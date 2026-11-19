"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
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
  CatalogModule,
  Role,
  RoleChangeResult,
  RoleInput,
} from "../../api/admin-access.types";
import {
  useCreateRole,
  useRole,
  useUpdateRole,
} from "../../hooks/use-admin-access";
import { useCurrentAdmin } from "../../hooks/use-admin-session";
import {
  roleDetailsSchema,
  type RoleDetailsValues,
} from "../../schemas/admin-access.schemas";
import { CascadeSummary, LoadFailed, describeError } from "./shared";

interface RoleFormDialogProps {
  /** The role being edited; absent when creating a new one. */
  role?: Role;
  modules: CatalogModule[];
  onClose: () => void;
}

/**
 * Create a role or edit one: its name, description and ticked permissions.
 *
 * Removing a permission can strip it from roles further down the hierarchy,
 * so an edit that removes anything is first sent as a preview and the
 * affected roles are shown for confirmation before it is saved.
 */
export function RoleFormDialog({
  role,
  modules,
  onClose,
}: RoleFormDialogProps) {
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const me = useCurrentAdmin().data?.admin;
  // A role can hold only what its owner holds. A new role is owned by the
  // person creating it (the catalog's `granted` flag); an existing one may be
  // owned by someone else, whose permissions come with the role's details.
  const detail = useRole(role ? role.id : null);
  const ownerIsMe = !role || role.owner.id === me?.id;
  const ownerHolds: ReadonlySet<string> | null = role
    ? detail.data
      ? new Set(detail.data.ownerPermissions)
      : null
    : new Set(
        modules
          .flatMap((module) => module.permissions)
          .filter((permission) => permission.granted)
          .map((permission) => permission.key),
      );
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(role?.permissions ?? []),
  );
  const [permissionError, setPermissionError] = useState<string | null>(null);
  /** Set while the staff member is asked to confirm what the edit strips. */
  const [pending, setPending] = useState<{
    input: RoleInput;
    preview: RoleChangeResult;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleDetailsValues>({
    resolver: zodResolver(roleDetailsSchema),
    defaultValues: {
      name: role?.name ?? "",
      description: role?.description ?? "",
    },
  });

  const catalog = useMemo(() => {
    const all = modules.flatMap((module) => module.permissions);
    return {
      byKey: new Map(all.map((permission) => [permission.key, permission])),
      /** For each permission, the ones that cannot stay ticked without it. */
      dependents: (key: string) =>
        all
          .filter((permission) => permission.requires.includes(key))
          .map((permission) => permission.key),
    };
  }, [modules]);
  const labelFor = (key: string) => catalog.byKey.get(key)?.label ?? key;

  const toggle = (key: string, checked: boolean) => {
    setPermissionError(null);
    setSelected((current) => {
      const next = new Set(current);
      const walk = (start: string, step: (k: string) => string[]) => {
        const queue = [start];
        for (let item = queue.pop(); item !== undefined; item = queue.pop()) {
          for (const other of step(item)) {
            if (checked ? !next.has(other) : next.has(other)) {
              if (checked) next.add(other);
              else next.delete(other);
              queue.push(other);
            }
          }
        }
      };
      if (checked) {
        // Ticking a permission also ticks what it depends on.
        next.add(key);
        walk(key, (k) => catalog.byKey.get(k)?.requires ?? []);
      } else {
        // Unticking one also unticks everything that depends on it.
        next.delete(key);
        walk(key, catalog.dependents);
      }
      return next;
    });
  };

  const error = createRole.error ?? updateRole.error;
  const busy = createRole.isPending || updateRole.isPending;
  const lockedReason = ownerIsMe
    ? "You do not hold this permission, so you cannot give it."
    : `${role?.owner.fullName ?? "Its owner"} does not hold this permission, so this role cannot have it.`;

  const onSubmit = handleSubmit((values) => {
    if (selected.size === 0) {
      setPermissionError("Select at least one permission");
      return;
    }
    const input: RoleInput = {
      name: values.name,
      description: values.description === "" ? null : values.description,
      permissions: [...selected],
    };

    if (!role) {
      createRole.mutate(input, { onSuccess: onClose });
      return;
    }

    const removesSomething = role.permissions.some((key) => !selected.has(key));
    if (!removesSomething) {
      updateRole.mutate(
        { id: role.id, input, preview: false },
        { onSuccess: onClose },
      );
      return;
    }
    // Ask the server what the removal would strip further down.
    updateRole.mutate(
      { id: role.id, input, preview: true },
      {
        onSuccess: (preview) => {
          if (preview.cascade.roles.length === 0) {
            updateRole.mutate(
              { id: role.id, input, preview: false },
              { onSuccess: onClose },
            );
          } else {
            setPending({ input, preview });
          }
        },
      },
    );
  });

  if (role && pending) {
    return (
      <Dialog
        open
        onClose={onClose}
        title="Confirm the change"
        description={`Saving "${pending.input.name}" takes permissions away from other roles too.`}
        footer={
          <>
            <Button
              variant="outline"
              className={compactButtonClassName}
              disabled={busy}
              onClick={() => setPending(null)}
            >
              Back
            </Button>
            <Button
              variant="outline"
              className={cn(compactButtonClassName, dangerButtonClassName)}
              loading={busy}
              onClick={() =>
                updateRole.mutate(
                  { id: role.id, input: pending.input, preview: false },
                  { onSuccess: onClose },
                )
              }
            >
              Save and remove
            </Button>
          </>
        }
      >
        <CascadeSummary cascade={pending.preview.cascade} labelFor={labelFor} />
        <p className="text-sm text-muted-foreground">
          Giving a permission back later does not hand it back down
          automatically: each role below has to be updated by its creator.
        </p>
        <FormAlert message={error && describeError(error, labelFor)} />
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={role ? "Edit role" : "Create role"}
      description={
        role
          ? `Created by ${role.owner.fullName}. A role can only hold permissions its creator holds.`
          : "Name the role and tick exactly what it may do. You can only give permissions you hold yourself."
      }
      footer={
        <>
          <Button
            variant="outline"
            className={compactButtonClassName}
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="role-form"
            className={compactButtonClassName}
            disabled={ownerHolds === null}
            loading={busy}
          >
            {role ? "Save changes" : "Create role"}
          </Button>
        </>
      }
    >
      <form
        id="role-form"
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-5"
      >
        <TextField
          id="role-name"
          label="Role name"
          placeholder="For example: Support Lead"
          autoComplete="off"
          error={errors.name?.message}
          {...register("name")}
        />
        <Field
          label="Description (optional)"
          htmlFor="role-description"
          error={errors.description?.message}
        >
          <textarea
            id="role-description"
            rows={2}
            placeholder="What this role is for"
            className={cn(
              inputBoxClassName,
              "w-full resize-y p-4 placeholder:text-subtle focus:border-primary focus:outline-none aria-invalid:border-destructive",
            )}
            {...fieldErrorProps(
              "role-description",
              errors.description?.message,
            )}
            {...register("description")}
          />
        </Field>

        <fieldset className="flex flex-col gap-4">
          <legend className="font-display text-base font-semibold text-foreground">
            Permissions
          </legend>
          <p className="text-sm text-muted-foreground">
            {selected.size} selected. Some permissions need another one, which
            is ticked for you.
          </p>
          {detail.error ? (
            <LoadFailed
              error={detail.error}
              onRetry={() => void detail.refetch()}
            />
          ) : null}
          {modules.map((module) => (
            <section
              key={module.key}
              aria-label={module.label}
              className="flex flex-col gap-3 rounded-xl border border-hairline p-4"
            >
              <h3 className="font-display text-base font-semibold text-foreground">
                {module.label}
              </h3>
              <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {module.permissions.map((permission) => {
                  const checked = selected.has(permission.key);
                  // One the owner does not hold can be removed, never added.
                  // Until the owner's permissions are known, nothing is added.
                  const locked =
                    !checked &&
                    (ownerHolds === null || !ownerHolds.has(permission.key));
                  return (
                    <div
                      key={permission.key}
                      className={cn(
                        "flex flex-col gap-1",
                        locked && "opacity-50",
                      )}
                    >
                      <Checkbox
                        id={`permission-${permission.key}`}
                        checked={checked}
                        disabled={locked}
                        onChange={(event) =>
                          toggle(permission.key, event.target.checked)
                        }
                      >
                        {permission.label}
                      </Checkbox>
                      <p className="pl-7 text-sm text-muted-foreground">
                        {locked && ownerHolds !== null
                          ? lockedReason
                          : permission.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
          {permissionError ? (
            <p role="alert" className="text-sm font-semibold text-destructive">
              {permissionError}
            </p>
          ) : null}
        </fieldset>

        <FormAlert message={error && describeError(error, labelFor)} />
      </form>
    </Dialog>
  );
}
