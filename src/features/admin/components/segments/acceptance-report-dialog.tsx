"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { compactButtonClassName, Dialog } from "@/components/ui/dialog";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { cn } from "@/lib/utils/cn";
import type { AcceptanceStatus } from "../../api/admin-segments.types";
import { useAcceptanceReport } from "../../hooks/use-admin-segments";
import { EmptyState, formatDate, LoadFailed, Pager } from "../access/shared";
import { cellClassName, DataTable } from "./band-tables";

const PAGE_SIZE = 20;

type Filter = "all" | AcceptanceStatus;

const FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "up_to_date", label: "Up to date" },
] as const satisfies readonly { value: Filter; label: string }[];

const STATUS: Record<
  AcceptanceStatus,
  { label: string; tone: "positive" | "negative" | "neutral" }
> = {
  accepted: { label: "Accepted", tone: "positive" },
  pending: { label: "Pending", tone: "negative" },
  up_to_date: { label: "Already up to date", tone: "neutral" },
};

interface AcceptanceReportDialogProps {
  segmentId: string;
  segmentName: string;
  version: number;
  onClose: () => void;
}

/**
 * Who has accepted one change to a segment's bands. "Already up to date" are
 * customers who saved their values under this version or a later one (for
 * example they onboarded after it), so they never needed the notice.
 */
export function AcceptanceReportDialog({
  segmentId,
  segmentName,
  version,
  onClose,
}: AcceptanceReportDialogProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const report = useAcceptanceReport(segmentId, version, {
    page,
    pageSize: PAGE_SIZE,
    ...(filter === "all" ? {} : { status: filter }),
  });
  const summary = report.data?.summary;

  return (
    <Dialog
      open
      size="lg"
      onClose={onClose}
      title={`${segmentName}: version ${version}`}
      description={
        report.data
          ? `Customers asked to accept the change of ${formatDate(report.data.effectiveFrom)}.`
          : undefined
      }
      footer={
        <Button
          variant="outline"
          className={compactButtonClassName}
          onClick={onClose}
        >
          Close
        </Button>
      }
    >
      {summary ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Count label="Customers" value={summary.total} />
          <Count label="Accepted" value={summary.accepted} />
          <Count label="Pending" value={summary.pending} highlight />
          <Count label="Up to date" value={summary.upToDate} />
        </ul>
      ) : null}

      <SegmentedTabs
        label="Show customers"
        options={FILTERS}
        value={filter}
        onChange={(value) => {
          setFilter(value);
          setPage(1);
        }}
      />

      {report.error ? (
        <LoadFailed
          error={report.error}
          onRetry={() => void report.refetch()}
        />
      ) : null}
      {report.data && report.data.items.length === 0 ? (
        <EmptyState>No customers in this list.</EmptyState>
      ) : null}
      {report.data && report.data.items.length > 0 ? (
        <>
          <DataTable
            caption="Customers"
            headers={["Customer", "Contact", "Status", "Accepted on"]}
          >
            {report.data.items.map((item) => (
              <tr key={item.userId}>
                <td className={cn(cellClassName, "font-semibold")}>
                  {item.fullName}
                </td>
                <td className={cn(cellClassName, "text-muted-foreground")}>
                  {[item.email, item.phone].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className={cellClassName}>
                  <Badge tone={STATUS[item.status].tone}>
                    {STATUS[item.status].label}
                  </Badge>
                </td>
                <td className={cellClassName}>
                  {item.acceptedAt ? formatDate(item.acceptedAt) : "—"}
                </td>
              </tr>
            ))}
          </DataTable>
          <Pager pagination={report.data.pagination} onPage={setPage} />
        </>
      ) : null}
    </Dialog>
  );
}

function Count({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <li className="flex flex-col gap-1 rounded-xl bg-surface-subtle px-4 py-3">
      <span className="text-sm font-semibold text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "font-display text-2xl font-semibold",
          highlight && value > 0 ? "text-destructive" : "text-foreground",
        )}
      >
        {value}
      </span>
    </li>
  );
}
