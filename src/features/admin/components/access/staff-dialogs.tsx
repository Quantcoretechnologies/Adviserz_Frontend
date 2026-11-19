"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  compactButtonClassName,
  dangerButtonClassName,
} from "@/components/ui/dialog";
import {
  Field,
  fieldErrorProps,
  inputBoxClassName,
} from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { TextField } from "@/components/ui/text-field";
import { cn } from "@/lib/utils/cn";
import type {
  Role,
  Staff,
  StaffCredentials,
  StaffRolesResult,
} from "../../api/admin-access.types";
import {
  useBlockStaff,
  useCreateStaff,
  useDeleteStaff,
  usePermissionCatalog,
  useResetStaffPassword,
  useRoles,
  useSetStaffRoles,
  useStaffDeletionImpact,
  useUnblockStaff,
  useUpdateStaff,
} from "../../hooks/use-admin-access";
import { usePermissions } from "../../hooks/use-admin-session";
import {
  blockStaffSchema,
  staffDetailsSchema,
  type BlockStaffValues,
  type StaffDetailsValues,
} from "../../schemas/admin-access.schemas";
import {
  CascadeSummary,
  ImpactList,
  LoadFailed,
  describeError,
  plural,
} from "./shared";

/** The most roles one request can list; far more than anyone creates. */
const ALL_ROLES = 100;

const cancelButton = (onClose: () => void, disabled: boolean) => (
  <Button
    variant="outline"
    className={compactButtonClassName}
    disabled={disabled}
    onClick={onClose}
  >
    Cancel
  </Button>
);

// --- Credentials, shown once ---------------------------------------------------

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-subtle">{label}</p>
      <div className="flex items-center gap-3">
        <code className="min-w-0 flex-1 rounded-xl bg-surface px-4 py-3 font-mono text-base break-all text-foreground select-all">
          {value}
        </code>
        <Button
          variant="outline"
          className={cn(compactButtonClassName, "shrink-0")}
          onClick={() => {
            void navigator.clipboard.writeText(value).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            });
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

/**
 * The email and generated password of a new or reset account. This is the
 * only time the password is ever shown, so the window cannot be closed by
 * accident: it needs the button.
 */
export function CredentialsDialog({
  title,
  credentials,
  onClose,
}: {
  title: string;
  credentials: StaffCredentials;
  onClose: () => void;
}) {
  return (
    <Dialog
      open
      onClose={onClose}
      dismissible={false}
      title={title}
      description="Share these sign-in details with the staff member. They will be asked to set their own password the first time they sign in."
      footer={
        <Button className={compactButtonClassName} onClick={onClose}>
          I have saved these details
        </Button>
      }
    >
      <CopyRow label="Email" value={credentials.email} />
      <CopyRow
        label="Temporary password"
        value={credentials.temporaryPassword}
      />
      <p
        role="note"
        className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive"
      >
        This password is shown only once. It cannot be looked up later; if it is
        lost, reset the password to get a new one.
      </p>
    </Dialog>
  );
}

// --- Role checkboxes -----------------------------------------------------------

function RoleChoices({
  idPrefix,
  roles,
  selected,
  disabled,
  onToggle,
}: {
  idPrefix: string;
  roles: Role[];
  selected: ReadonlySet<string>;
  disabled?: boolean;
  onToggle: (roleId: string, checked: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {roles.map((role) => (
        <div key={role.id} className="flex flex-col gap-1">
          <Checkbox
            id={`${idPrefix}-${role.id}`}
            checked={selected.has(role.id)}
            disabled={disabled}
            onChange={(event) => onToggle(role.id, event.target.checked)}
          >
            {role.name}
          </Checkbox>
          <p className="pl-7 text-sm text-muted-foreground">
            {plural(role.permissions.length, "permission")}
            {role.description ? ` · ${role.description}` : ""}
          </p>
        </div>
      ))}
    </div>
  );
}

function toggled(
  current: ReadonlySet<string>,
  id: string,
  checked: boolean,
): Set<string> {
  const next = new Set(current);
  if (checked) next.add(id);
  else next.delete(id);
  return next;
}

// --- Create --------------------------------------------------------------------

export function CreateStaffDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (credentials: StaffCredentials) => void;
}) {
  const permissions = usePermissions();
  const createStaff = useCreateStaff();
  // A role can only be given by its creator, so only the caller's own roles are offered.
  const roles = useRoles(
    { mine: true, pageSize: ALL_ROLES },
    permissions.can("roles.view"),
  );
  const [roleIds, setRoleIds] = useState<ReadonlySet<string>>(new Set());
  const [superAdmin, setSuperAdmin] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffDetailsValues>({
    resolver: zodResolver(staffDetailsSchema),
    defaultValues: { fullName: "", email: "" },
  });

  const onSubmit = handleSubmit((values) => {
    createStaff.mutate(
      {
        ...values,
        isSuperAdmin: superAdmin,
        roleIds: superAdmin ? [] : [...roleIds],
      },
      { onSuccess: ({ credentials }) => onCreated(credentials) },
    );
  });

  const ownRoles = roles.data?.items ?? [];

  return (
    <Dialog
      open
      onClose={onClose}
      title="Add staff"
      description="The account is created under you. A password is generated and shown once, on the next screen."
      footer={
        <>
          {cancelButton(onClose, createStaff.isPending)}
          <Button
            type="submit"
            form="create-staff-form"
            className={compactButtonClassName}
            loading={createStaff.isPending}
          >
            Create account
          </Button>
        </>
      }
    >
      <form
        id="create-staff-form"
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-5"
      >
        <TextField
          id="staff-full-name"
          label="Full name"
          placeholder="Enter their full name"
          autoComplete="off"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <TextField
          id="staff-email"
          label="Work email"
          type="email"
          placeholder="name@adviserz.in"
          autoComplete="off"
          error={errors.email?.message}
          {...register("email")}
        />

        {permissions.isSuperAdmin ? (
          <div className="flex flex-col gap-1 rounded-xl border border-hairline p-4">
            <Checkbox
              id="staff-super-admin"
              checked={superAdmin}
              onChange={(event) => setSuperAdmin(event.target.checked)}
            >
              Make this person a super admin
            </Checkbox>
            <p className="pl-7 text-sm text-muted-foreground">
              A super admin holds every permission and can see and change
              everything. They are not given roles.
            </p>
          </div>
        ) : null}

        {!superAdmin ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="font-display text-base font-semibold text-foreground">
              Roles
            </legend>
            {roles.error ? (
              <LoadFailed
                error={roles.error}
                onRetry={() => void roles.refetch()}
              />
            ) : ownRoles.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Tick the roles to give now. You can change them later.
                </p>
                <RoleChoices
                  idPrefix="new-staff-role"
                  roles={ownRoles}
                  selected={roleIds}
                  onToggle={(id, checked) =>
                    setRoleIds((current) => toggled(current, id, checked))
                  }
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {roles.isPending && permissions.can("roles.view")
                  ? "Loading your roles…"
                  : "You have not created any roles yet, so this account will start with no access. Create a role first, or give one later."}
              </p>
            )}
          </fieldset>
        ) : null}

        <FormAlert
          message={createStaff.error && describeError(createStaff.error)}
        />
      </form>
    </Dialog>
  );
}

// --- Edit details --------------------------------------------------------------

export function EditStaffDialog({
  staff,
  onClose,
}: {
  staff: Staff;
  onClose: () => void;
}) {
  const updateStaff = useUpdateStaff();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffDetailsValues>({
    resolver: zodResolver(staffDetailsSchema),
    defaultValues: { fullName: staff.fullName, email: staff.email },
  });

  const onSubmit = handleSubmit((values) => {
    updateStaff.mutate({ id: staff.id, input: values }, { onSuccess: onClose });
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title="Edit details"
      description="Changing the email changes what they sign in with."
      footer={
        <>
          {cancelButton(onClose, updateStaff.isPending)}
          <Button
            type="submit"
            form="edit-staff-form"
            className={compactButtonClassName}
            loading={updateStaff.isPending}
          >
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="edit-staff-form"
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-5"
      >
        <TextField
          id="edit-staff-full-name"
          label="Full name"
          autoComplete="off"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <TextField
          id="edit-staff-email"
          label="Work email"
          type="email"
          autoComplete="off"
          error={errors.email?.message}
          {...register("email")}
        />
        <FormAlert
          message={updateStaff.error && describeError(updateStaff.error)}
        />
      </form>
    </Dialog>
  );
}

// --- Roles ---------------------------------------------------------------------

/**
 * Choose which roles a staff member holds. Only roles created by the person
 * who created them can be given, so those are the ones listed. Taking a role
 * away can strip permissions further down, which is previewed and confirmed.
 */
export function StaffRolesDialog({
  staff,
  onClose,
}: {
  staff: Staff;
  onClose: () => void;
}) {
  const setRoles = useSetStaffRoles();
  const catalog = usePermissionCatalog();
  const roles = useRoles(
    { ownerId: staff.createdBy?.id, pageSize: ALL_ROLES },
    staff.createdBy !== null,
  );
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(staff.roles.map((role) => role.id)),
  );
  const [preview, setPreview] = useState<StaffRolesResult | null>(null);

  const labels = new Map(
    (catalog.data?.modules ?? []).flatMap((module) =>
      module.permissions.map((permission) => [
        permission.key,
        permission.label,
      ]),
    ),
  );
  const labelFor = (key: string) => labels.get(key) ?? key;

  const save = () =>
    setRoles.mutate(
      { id: staff.id, roleIds: [...selected], preview: false },
      { onSuccess: onClose },
    );

  const onSave = () => {
    const removesSomething = staff.roles.some((role) => !selected.has(role.id));
    if (!removesSomething) {
      save();
      return;
    }
    setRoles.mutate(
      { id: staff.id, roleIds: [...selected], preview: true },
      {
        onSuccess: (result) => {
          if (result.cascade.roles.length === 0) save();
          else setPreview(result);
        },
      },
    );
  };

  if (preview) {
    return (
      <Dialog
        open
        onClose={onClose}
        title="Confirm the change"
        description={`Taking roles away from ${staff.fullName} also takes permissions away from roles they handed down.`}
        footer={
          <>
            <Button
              variant="outline"
              className={compactButtonClassName}
              disabled={setRoles.isPending}
              onClick={() => setPreview(null)}
            >
              Back
            </Button>
            <Button
              variant="outline"
              className={cn(compactButtonClassName, dangerButtonClassName)}
              loading={setRoles.isPending}
              onClick={save}
            >
              Save and remove
            </Button>
          </>
        }
      >
        <CascadeSummary cascade={preview.cascade} labelFor={labelFor} />
        <FormAlert
          message={setRoles.error && describeError(setRoles.error, labelFor)}
        />
      </Dialog>
    );
  }

  const available = roles.data?.items ?? [];

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Roles for ${staff.fullName}`}
      description={
        staff.createdBy
          ? `Roles created by ${staff.createdBy.fullName}, who created this account. Their access is all ticked roles added together.`
          : undefined
      }
      footer={
        <>
          {cancelButton(onClose, setRoles.isPending)}
          <Button
            className={compactButtonClassName}
            disabled={!roles.data}
            loading={setRoles.isPending}
            onClick={onSave}
          >
            Save roles
          </Button>
        </>
      }
    >
      {roles.isPending ? (
        <p className="text-base text-muted-foreground">Loading roles…</p>
      ) : null}
      {roles.error ? (
        <LoadFailed error={roles.error} onRetry={() => void roles.refetch()} />
      ) : null}
      {roles.data && available.length === 0 ? (
        <p className="text-base text-muted-foreground">
          {staff.createdBy?.fullName ?? "Their creator"} has not created any
          roles yet. Create a role first, then come back here.
        </p>
      ) : null}
      {available.length > 0 ? (
        <RoleChoices
          idPrefix="staff-role"
          roles={available}
          selected={selected}
          disabled={setRoles.isPending}
          onToggle={(id, checked) =>
            setSelected((current) => toggled(current, id, checked))
          }
        />
      ) : null}
      <FormAlert
        message={setRoles.error && describeError(setRoles.error, labelFor)}
      />
    </Dialog>
  );
}

// --- Block and unblock ---------------------------------------------------------

export function BlockStaffDialog({
  staff,
  onClose,
}: {
  staff: Staff;
  onClose: () => void;
}) {
  const blockStaff = useBlockStaff();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BlockStaffValues>({
    resolver: zodResolver(blockStaffSchema),
    defaultValues: { reason: "" },
  });

  const onSubmit = handleSubmit(({ reason }) => {
    blockStaff.mutate({ id: staff.id, reason }, { onSuccess: onClose });
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Block ${staff.fullName}?`}
      description="They are signed out at once and cannot sign in until unblocked. Their roles are kept, and the staff they created keep working."
      footer={
        <>
          {cancelButton(onClose, blockStaff.isPending)}
          <Button
            type="submit"
            form="block-staff-form"
            variant="outline"
            className={cn(compactButtonClassName, dangerButtonClassName)}
            loading={blockStaff.isPending}
          >
            Block
          </Button>
        </>
      }
    >
      <form id="block-staff-form" onSubmit={onSubmit} noValidate>
        <Field
          label="Reason"
          htmlFor="block-reason"
          error={errors.reason?.message}
        >
          <textarea
            id="block-reason"
            rows={3}
            placeholder="Why is this account being blocked?"
            className={cn(
              inputBoxClassName,
              "w-full resize-y p-4 placeholder:text-subtle focus:border-primary focus:outline-none aria-invalid:border-destructive",
            )}
            {...fieldErrorProps("block-reason", errors.reason?.message)}
            {...register("reason")}
          />
        </Field>
      </form>
      <FormAlert
        message={blockStaff.error && describeError(blockStaff.error)}
      />
    </Dialog>
  );
}

export function UnblockStaffDialog({
  staff,
  onClose,
}: {
  staff: Staff;
  onClose: () => void;
}) {
  const unblockStaff = useUnblockStaff();
  return (
    <Dialog
      open
      onClose={onClose}
      size="sm"
      title={`Unblock ${staff.fullName}?`}
      description={
        <>
          They can sign in again with the same password and roles.
          {staff.blockedReason ? (
            <span className="mt-2 block">
              Blocked because: {staff.blockedReason}
            </span>
          ) : null}
        </>
      }
      footer={
        <>
          {cancelButton(onClose, unblockStaff.isPending)}
          <Button
            className={compactButtonClassName}
            loading={unblockStaff.isPending}
            onClick={() =>
              unblockStaff.mutate(staff.id, { onSuccess: onClose })
            }
          >
            Unblock
          </Button>
        </>
      }
    >
      <FormAlert
        message={unblockStaff.error && describeError(unblockStaff.error)}
      />
    </Dialog>
  );
}

// --- Reset password ------------------------------------------------------------

export function ResetPasswordDialog({
  staff,
  onClose,
  onReset,
}: {
  staff: Staff;
  onClose: () => void;
  onReset: (credentials: StaffCredentials) => void;
}) {
  const resetPassword = useResetStaffPassword();
  return (
    <Dialog
      open
      onClose={onClose}
      size="sm"
      title={`Reset the password of ${staff.fullName}?`}
      description="Their current password stops working, they are signed out everywhere, and a new temporary password is shown to you once."
      footer={
        <>
          {cancelButton(onClose, resetPassword.isPending)}
          <Button
            className={compactButtonClassName}
            loading={resetPassword.isPending}
            onClick={() =>
              resetPassword.mutate(staff.id, {
                onSuccess: ({ credentials }) => onReset(credentials),
              })
            }
          >
            Reset password
          </Button>
        </>
      }
    >
      <FormAlert
        message={resetPassword.error && describeError(resetPassword.error)}
      />
    </Dialog>
  );
}

// --- Delete --------------------------------------------------------------------

/**
 * Deleting a staff member deletes everyone they created and every role in
 * that branch, all the way down. (Deleting a super admin instead moves their
 * team under whoever deletes them.) The exact effect is fetched and shown
 * before anything happens.
 */
export function DeleteStaffDialog({
  staff,
  onClose,
}: {
  staff: Staff;
  onClose: () => void;
}) {
  const impact = useStaffDeletionImpact(staff.id);
  const deleteStaff = useDeleteStaff();
  const others = impact.data?.deleted.staff.filter(
    (person) => person.id !== staff.id,
  );

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Delete ${staff.fullName}?`}
      description="They are signed out and can no longer sign in. Their record and history are kept."
      footer={
        <>
          {cancelButton(onClose, deleteStaff.isPending)}
          <Button
            variant="outline"
            className={cn(compactButtonClassName, dangerButtonClassName)}
            disabled={!impact.data}
            loading={deleteStaff.isPending}
            onClick={() => deleteStaff.mutate(staff.id, { onSuccess: onClose })}
          >
            {impact.data && impact.data.deleted.staff.length > 1
              ? `Delete ${plural(impact.data.deleted.staff.length, "account")}`
              : "Delete"}
          </Button>
        </>
      }
    >
      {impact.isPending ? (
        <p className="text-base text-muted-foreground">
          Checking what this affects…
        </p>
      ) : null}
      {impact.error ? (
        <LoadFailed
          error={impact.error}
          onRetry={() => void impact.refetch()}
        />
      ) : null}
      {impact.data && others ? (
        <>
          {others.length === 0 &&
          impact.data.deleted.roles.length === 0 &&
          impact.data.transferred.staff.length === 0 &&
          impact.data.transferred.roles.length === 0 ? (
            <p className="text-base text-muted-foreground">
              Only this account is affected. They have not created any staff or
              roles.
            </p>
          ) : null}
          <ImpactList
            title={`${plural(others.length, "more account")} below them will also be deleted`}
            items={others.map(
              (person) => `${person.fullName} (${person.email})`,
            )}
          />
          <ImpactList
            title={`${plural(impact.data.deleted.roles.length, "role")} created in this branch will be deleted`}
            items={impact.data.deleted.roles.map((role) => role.name)}
          />
          <ImpactList
            title={`${plural(impact.data.transferred.staff.length, "staff member")} will move under you`}
            items={impact.data.transferred.staff.map(
              (person) => `${person.fullName} (${person.email})`,
            )}
          />
          <ImpactList
            title={`${plural(impact.data.transferred.roles.length, "role")} will become yours`}
            items={impact.data.transferred.roles.map((role) =>
              role.name === role.previousName
                ? role.name
                : `${role.previousName}, renamed "${role.name}"`,
            )}
          />
        </>
      ) : null}
      <FormAlert
        message={deleteStaff.error && describeError(deleteStaff.error)}
      />
    </Dialog>
  );
}
