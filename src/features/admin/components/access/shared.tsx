"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { compactButtonClassName } from "@/components/ui/dialog";
import { inputBoxClassName } from "@/components/ui/field";
import { getErrorMessage, isApiError } from "@/lib/api";
import { cn } from "@/lib/utils/cn";
import type { Cascade, Pagination } from "../../api/admin-access.types";

/** Pieces shared by the Staff and Roles screens. */

/**
 * The message for a failed request. Where the API explains each problem
 * separately (for example which permission cannot be given), those lines are
 * used, because they say more than the general message.
 *
 * Given `labelFor`, a permission key quoted in a message ("users.view") is
 * replaced by its readable name ("View customers").
 */
export function describeError(
  error: unknown,
  labelFor?: (permissionKey: string) => string,
): string {
  if (isApiError(error) && Array.isArray(error.details)) {
    const lines = error.details
      .map((detail: unknown) => {
        if (typeof detail !== "object" || detail === null) return "";
        const { message, permission } = detail as {
          message?: unknown;
          permission?: unknown;
        };
        if (typeof message !== "string") return "";
        return labelFor && typeof permission === "string"
          ? message.replaceAll(`"${permission}"`, `"${labelFor(permission)}"`)
          : message;
      })
      .filter(Boolean);
    if (lines.length > 0) return [...new Set(lines)].join(". ");
  }
  return getErrorMessage(error);
}

/** "18 Nov 2026" */
export function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

// --- Search and paging ---------------------------------------------------------

interface SearchInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({
  label,
  placeholder,
  value,
  onChange,
}: SearchInputProps) {
  return (
    <input
      type="search"
      aria-label={label}
      placeholder={placeholder}
      value={value}
      maxLength={100}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        inputBoxClassName,
        "w-full min-w-0 px-4 py-3 placeholder:text-subtle focus:border-primary focus:outline-none sm:max-w-80",
      )}
    />
  );
}

export function Pager({
  pagination,
  onPage,
}: {
  pagination: Pagination;
  onPage: (page: number) => void;
}) {
  if (pagination.totalPages <= 1) return null;
  return (
    <nav
      aria-label="Pages"
      className="flex items-center justify-between gap-4 pt-2"
    >
      <p className="text-sm font-semibold text-subtle">
        Page {pagination.page} of {pagination.totalPages}
      </p>
      <div className="flex gap-3">
        <Button
          variant="outline"
          className={compactButtonClassName}
          disabled={pagination.page <= 1}
          onClick={() => onPage(pagination.page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          className={compactButtonClassName}
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPage(pagination.page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}

// --- States --------------------------------------------------------------------

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl bg-surface px-4 py-8 text-center text-base text-muted-foreground">
      {children}
    </p>
  );
}

export function LoadFailed({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3"
    >
      <p className="text-sm font-semibold text-destructive">
        {describeError(error)}
      </p>
      <Button
        variant="outline"
        className={compactButtonClassName}
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  );
}

// --- Row actions ---------------------------------------------------------------

export interface RowAction {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
}

/** The "Actions" button at the end of a row, with its small menu. */
export function RowActions({
  label,
  actions,
}: {
  /** Who or what the actions are for, e.g. "Actions for Kiran Rao". */
  label: string;
  actions: RowAction[];
}) {
  const [open, setOpen] = useState(false);
  if (actions.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-surface"
      >
        Actions
      </button>
      {open ? (
        <>
          <div
            aria-hidden
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute top-full right-0 z-20 mt-2 min-w-44 rounded-xl border border-hairline bg-background p-2 shadow-lg"
          >
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  action.onSelect();
                }}
                className={cn(
                  "w-full cursor-pointer rounded-lg px-3 py-2 text-left text-base font-semibold whitespace-nowrap hover:bg-surface",
                  action.destructive ? "text-destructive" : "text-foreground",
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

// --- What a change takes away ---------------------------------------------------

/**
 * Lists the roles further down the hierarchy that lose permissions because
 * of a change. Shown before the change is confirmed.
 */
export function CascadeSummary({
  cascade,
  labelFor,
}: {
  cascade: Cascade;
  /** Turns a permission key into its readable name. */
  labelFor: (key: string) => string;
}) {
  if (cascade.roles.length === 0) return null;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <p className="text-sm font-semibold text-destructive">
        This also removes permissions from{" "}
        {plural(cascade.roles.length, "role")} further down, affecting{" "}
        {plural(cascade.affectedAdminIds.length, "staff member")}:
      </p>
      <ul className="flex flex-col gap-2">
        {cascade.roles.map((role) => (
          <li key={role.id} className="text-sm text-foreground">
            <span className="font-semibold">{role.name}</span> loses{" "}
            {role.revoked.map(labelFor).join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A titled list inside a confirmation, e.g. "Staff who lose this role". */
export function ImpactList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-subtle">{title}</p>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item} className="text-base text-foreground">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
