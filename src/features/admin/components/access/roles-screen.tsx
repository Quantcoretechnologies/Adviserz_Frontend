"use client";

import { useDeferredValue, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  compactButtonClassName,
  dangerButtonClassName,
} from "@/components/ui/dialog";
import { FormAlert } from "@/components/ui/form-alert";
import { cn } from "@/lib/utils/cn";
import type { Role } from "../../api/admin-access.types";
import {
  useDeleteRole,
  usePermissionCatalog,
  useRoleDeletionImpact,
  useRoles,
} from "../../hooks/use-admin-access";
import { usePermissions } from "../../hooks/use-admin-session";
import { NoAccess } from "./no-access";
import { RoleFormDialog } from "./role-form-dialog";
import {
  CascadeSummary,
  EmptyState,
  ImpactList,
  LoadFailed,
  Pager,
  RowActions,
  SearchInput,
  describeError,
  plural,
  type RowAction,
} from "./shared";

const PAGE_SIZE = 20;

/** The Roles section: every role in the staff member's branch. */
export function RolesScreen() {
  const permissions = usePermissions();
  const canView = permissions.can("roles.view");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const term = useDeferredValue(search.trim());
  const roles = useRoles(
    { page, pageSize: PAGE_SIZE, ...(term ? { search: term } : {}) },
    canView,
  );
  const catalog = usePermissionCatalog(canView);

  const [form, setForm] = useState<{ role?: Role } | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);

  if (!permissions.ready) return null;
  if (!canView) return <NoAccess section="Roles" />;

  const modules = catalog.data?.modules ?? [];
  const labels = new Map(
    modules.flatMap((module) =>
      module.permissions.map((permission) => [
        permission.key,
        permission.label,
      ]),
    ),
  );
  const labelFor = (key: string) => labels.get(key) ?? key;

  const actionsFor = (role: Role): RowAction[] => {
    if (!role.canManage) return [];
    return [
      ...(permissions.can("roles.edit")
        ? [{ label: "Edit", onSelect: () => setForm({ role }) }]
        : []),
      ...(permissions.can("roles.delete")
        ? [
            {
              label: "Delete",
              destructive: true,
              onSelect: () => setDeleting(role),
            },
          ]
        : []),
    ];
  };

  return (
    <>
      <PageHeader
        title="Roles"
        description="A role is a named set of permissions. Give roles to the staff you create."
        actions={
          permissions.can("roles.create") ? (
            <Button
              className={compactButtonClassName}
              disabled={modules.length === 0}
              onClick={() => setForm({})}
            >
              Create role
            </Button>
          ) : null
        }
      />

      <Card className="flex flex-col gap-4">
        <SearchInput
          label="Search roles"
          placeholder="Search by role name"
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />

        {roles.error ? (
          <LoadFailed
            error={roles.error}
            onRetry={() => void roles.refetch()}
          />
        ) : null}

        {roles.data && roles.data.items.length === 0 ? (
          <EmptyState>
            {term
              ? "No role matches your search."
              : "There are no roles yet. Create one to start giving access."}
          </EmptyState>
        ) : null}

        {roles.data && roles.data.items.length > 0 ? (
          <ul className="flex flex-col divide-y divide-hairline">
            {roles.data.items.map((role) => (
              <li
                key={role.id}
                className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
                  <p className="font-display text-lg leading-6 font-semibold break-words text-foreground">
                    {role.name}
                  </p>
                  {role.description ? (
                    <p className="text-sm break-words text-muted-foreground">
                      {role.description}
                    </p>
                  ) : null}
                  <p className="text-sm text-subtle">
                    Created by {role.owner.fullName}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">
                    {plural(role.permissions.length, "permission")}
                  </Badge>
                  <Badge>{plural(role.holderCount, "holder")}</Badge>
                </div>
                <RowActions
                  label={`Actions for ${role.name}`}
                  actions={actionsFor(role)}
                />
              </li>
            ))}
          </ul>
        ) : null}

        {roles.data ? (
          <Pager pagination={roles.data.pagination} onPage={setPage} />
        ) : null}
      </Card>

      {form ? (
        <RoleFormDialog
          role={form.role}
          modules={modules}
          onClose={() => setForm(null)}
        />
      ) : null}
      {deleting ? (
        <DeleteRoleDialog
          role={deleting}
          labelFor={labelFor}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </>
  );
}

/** Shows who loses the role and what is stripped below, then deletes it. */
function DeleteRoleDialog({
  role,
  labelFor,
  onClose,
}: {
  role: Role;
  labelFor: (key: string) => string;
  onClose: () => void;
}) {
  const impact = useRoleDeletionImpact(role.id);
  const deleteRole = useDeleteRole();

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Delete "${role.name}"?`}
      description="The role is removed from everyone who holds it. Their accounts are kept."
      footer={
        <>
          <Button
            variant="outline"
            className={compactButtonClassName}
            disabled={deleteRole.isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            className={cn(compactButtonClassName, dangerButtonClassName)}
            disabled={!impact.data}
            loading={deleteRole.isPending}
            onClick={() => deleteRole.mutate(role.id, { onSuccess: onClose })}
          >
            Delete role
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
      {impact.data ? (
        <>
          {impact.data.holders.length === 0 ? (
            <p className="text-base text-muted-foreground">
              Nobody holds this role, so no one loses access.
            </p>
          ) : (
            <ImpactList
              title={`${plural(impact.data.holders.length, "staff member")} will lose this role`}
              items={impact.data.holders.map(
                (holder) => `${holder.fullName} (${holder.email})`,
              )}
            />
          )}
          <CascadeSummary cascade={impact.data.cascade} labelFor={labelFor} />
        </>
      ) : null}
      <FormAlert
        message={deleteRole.error && describeError(deleteRole.error)}
      />
    </Dialog>
  );
}
