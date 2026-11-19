"use client";

import { useDeferredValue, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { compactButtonClassName } from "@/components/ui/dialog";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import type {
  Staff,
  StaffCredentials,
  StaffStatus,
  StaffTreeNode,
} from "../../api/admin-access.types";
import type { RoleSummary } from "../../api/admin-auth.types";
import { useStaffList, useStaffTree } from "../../hooks/use-admin-access";
import { usePermissions } from "../../hooks/use-admin-session";
import { NoAccess } from "./no-access";
import {
  EmptyState,
  LoadFailed,
  Pager,
  RowActions,
  SearchInput,
  formatDate,
  type RowAction,
} from "./shared";
import {
  BlockStaffDialog,
  CreateStaffDialog,
  CredentialsDialog,
  DeleteStaffDialog,
  EditStaffDialog,
  ResetPasswordDialog,
  StaffRolesDialog,
  UnblockStaffDialog,
} from "./staff-dialogs";

const PAGE_SIZE = 20;

type View = "list" | "hierarchy";
type StatusFilter = "all" | StaffStatus;
type OpenDialog =
  | { kind: "create" }
  | {
      kind: "edit" | "roles" | "block" | "unblock" | "reset" | "delete";
      staff: Staff;
    };

const VIEWS = [
  { value: "list", label: "List" },
  { value: "hierarchy", label: "Hierarchy" },
] as const;

const STATUSES = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "disabled", label: "Blocked" },
] as const;

/** Badges describing what a person is: super admin, their roles, or none. */
function RoleBadges({
  isSuperAdmin,
  roles,
}: {
  isSuperAdmin: boolean;
  roles: RoleSummary[];
}) {
  if (isSuperAdmin) return <Badge tone="brand">Super admin</Badge>;
  if (roles.length === 0) return <Badge>No role</Badge>;
  return roles.map((role) => (
    <Badge key={role.id} tone="brand">
      {role.name}
    </Badge>
  ));
}

function StatusBadge({ status }: { status: StaffStatus }) {
  return status === "active" ? (
    <Badge tone="positive">Active</Badge>
  ) : (
    <Badge tone="negative">Blocked</Badge>
  );
}

/** The Staff section: everyone below the signed-in staff member. */
export function StaffScreen() {
  const permissions = usePermissions();
  const canView = permissions.can("staff.view");

  const [view, setView] = useState<View>("list");
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  const [credentials, setCredentials] = useState<{
    title: string;
    details: StaffCredentials;
  } | null>(null);

  if (!permissions.ready) return null;
  if (!canView) return <NoAccess section="Staff" />;

  const close = () => setDialog(null);

  const actionsFor = (staff: Staff): RowAction[] => {
    if (!staff.canManage) return [];
    const open = (kind: Exclude<OpenDialog["kind"], "create">) => () =>
      setDialog({ kind, staff });
    const can = permissions.can;
    return [
      ...(can("staff.edit")
        ? [{ label: "Edit details", onSelect: open("edit") }]
        : []),
      ...(can("roles.assign") && !staff.isSuperAdmin
        ? [{ label: "Change roles", onSelect: open("roles") }]
        : []),
      ...(can("staff.reset_password")
        ? [{ label: "Reset password", onSelect: open("reset") }]
        : []),
      ...(staff.status === "active" && can("staff.block")
        ? [{ label: "Block", destructive: true, onSelect: open("block") }]
        : []),
      ...(staff.status === "disabled" && can("staff.unblock")
        ? [{ label: "Unblock", onSelect: open("unblock") }]
        : []),
      ...(can("staff.delete")
        ? [{ label: "Delete", destructive: true, onSelect: open("delete") }]
        : []),
    ];
  };

  return (
    <>
      <PageHeader
        title="Staff"
        description="The people you created and everyone below them. You can change only the staff you created yourself."
        actions={
          permissions.can("staff.create") ? (
            <Button
              className={compactButtonClassName}
              onClick={() => setDialog({ kind: "create" })}
            >
              Add staff
            </Button>
          ) : null
        }
      />

      <div className="w-full sm:max-w-80">
        <SegmentedTabs
          label="How to show staff"
          options={VIEWS}
          value={view}
          onChange={setView}
        />
      </div>

      {view === "list" ? (
        <StaffList actionsFor={actionsFor} />
      ) : (
        <StaffHierarchy />
      )}

      {dialog?.kind === "create" ? (
        <CreateStaffDialog
          onClose={close}
          onCreated={(details) => {
            close();
            setCredentials({ title: "Account created", details });
          }}
        />
      ) : null}
      {dialog?.kind === "edit" ? (
        <EditStaffDialog staff={dialog.staff} onClose={close} />
      ) : null}
      {dialog?.kind === "roles" ? (
        <StaffRolesDialog staff={dialog.staff} onClose={close} />
      ) : null}
      {dialog?.kind === "block" ? (
        <BlockStaffDialog staff={dialog.staff} onClose={close} />
      ) : null}
      {dialog?.kind === "unblock" ? (
        <UnblockStaffDialog staff={dialog.staff} onClose={close} />
      ) : null}
      {dialog?.kind === "reset" ? (
        <ResetPasswordDialog
          staff={dialog.staff}
          onClose={close}
          onReset={(details) => {
            close();
            setCredentials({ title: "Password reset", details });
          }}
        />
      ) : null}
      {dialog?.kind === "delete" ? (
        <DeleteStaffDialog staff={dialog.staff} onClose={close} />
      ) : null}

      {credentials ? (
        <CredentialsDialog
          title={credentials.title}
          credentials={credentials.details}
          onClose={() => setCredentials(null)}
        />
      ) : null}
    </>
  );
}

// --- List ----------------------------------------------------------------------

function StaffList({
  actionsFor,
}: {
  actionsFor: (staff: Staff) => RowAction[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const term = useDeferredValue(search.trim());

  const staff = useStaffList({
    page,
    pageSize: PAGE_SIZE,
    ...(term ? { search: term } : {}),
    ...(status === "all" ? {} : { status }),
  });
  const filtered = term !== "" || status !== "all";

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <SearchInput
          label="Search staff"
          placeholder="Search by name or email"
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        <div className="w-full sm:w-80">
          <SegmentedTabs
            label="Filter by status"
            options={STATUSES}
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {staff.error ? (
        <LoadFailed error={staff.error} onRetry={() => void staff.refetch()} />
      ) : null}

      {staff.data && staff.data.items.length === 0 ? (
        <EmptyState>
          {filtered
            ? "No staff member matches."
            : "You have not added any staff yet."}
        </EmptyState>
      ) : null}

      {staff.data && staff.data.items.length > 0 ? (
        <ul className="flex flex-col divide-y divide-hairline">
          {staff.data.items.map((person) => (
            <li
              key={person.id}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
                <p className="font-display text-lg leading-6 font-semibold break-words text-foreground">
                  {person.fullName}
                </p>
                <p className="text-sm break-all text-muted-foreground">
                  {person.email}
                </p>
                <p className="text-sm text-subtle">
                  {person.createdBy
                    ? `Created by ${person.createdBy.fullName}`
                    : "Original account"}
                  {" · "}Last sign-in: {formatDate(person.lastLoginAt)}
                </p>
                {person.status === "disabled" && person.blockedReason ? (
                  <p className="text-sm break-words text-destructive">
                    Blocked: {person.blockedReason}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <RoleBadges
                  isSuperAdmin={person.isSuperAdmin}
                  roles={person.roles}
                />
                <StatusBadge status={person.status} />
                {person.mustChangePassword ? (
                  <Badge>Temporary password</Badge>
                ) : null}
              </div>
              <RowActions
                label={`Actions for ${person.fullName}`}
                actions={actionsFor(person)}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {staff.data ? (
        <Pager pagination={staff.data.pagination} onPage={setPage} />
      ) : null}
    </Card>
  );
}

// --- Hierarchy -----------------------------------------------------------------

/** Who created whom, as an indented tree from the top of what is visible. */
function StaffHierarchy() {
  const tree = useStaffTree();

  if (tree.error) {
    return (
      <Card>
        <LoadFailed error={tree.error} onRetry={() => void tree.refetch()} />
      </Card>
    );
  }
  if (!tree.data) return null;

  const childrenOf = new Map<string, StaffTreeNode[]>();
  for (const node of tree.data.nodes) {
    if (node.parentId === null) continue;
    childrenOf.set(node.parentId, [
      ...(childrenOf.get(node.parentId) ?? []),
      node,
    ]);
  }
  const byId = new Map(tree.data.nodes.map((node) => [node.id, node]));
  const roots = tree.data.rootIds
    .map((id) => byId.get(id))
    .filter((node): node is StaffTreeNode => node !== undefined);

  return (
    <Card className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Each person sits under whoever created their account.
      </p>
      <ul className="flex flex-col gap-3">
        {roots.map((node) => (
          <TreeBranch key={node.id} node={node} childrenOf={childrenOf} />
        ))}
      </ul>
    </Card>
  );
}

function TreeBranch({
  node,
  childrenOf,
}: {
  node: StaffTreeNode;
  childrenOf: ReadonlyMap<string, StaffTreeNode[]>;
}) {
  const children = childrenOf.get(node.id) ?? [];
  return (
    <li className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-hairline px-4 py-3">
        <div className="flex min-w-0 flex-1 basis-56 flex-col">
          <p className="font-display text-base font-semibold break-words text-foreground">
            {node.fullName}
          </p>
          <p className="text-sm break-all text-muted-foreground">
            {node.email}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {node.isSelf ? <Badge>You</Badge> : null}
          <RoleBadges isSuperAdmin={node.isSuperAdmin} roles={node.roles} />
          <StatusBadge status={node.status} />
        </div>
      </div>
      {children.length > 0 ? (
        <ul className="ml-4 flex flex-col gap-3 border-l border-hairline pl-4 sm:ml-6 sm:pl-6">
          {children.map((child) => (
            <TreeBranch key={child.id} node={child} childrenOf={childrenOf} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
