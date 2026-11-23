"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { compactButtonClassName } from "@/components/ui/dialog";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { formatInr } from "@/lib/utils/format";
import type {
  AdminSegment,
  SaveRiskRulesResult,
} from "../../api/admin-segments.types";
import { useAdminSegments, useRiskRules } from "../../hooks/use-admin-segments";
import { usePermissions } from "../../hooks/use-admin-session";
import { NoAccess } from "../access/no-access";
import { EmptyState, LoadFailed, plural } from "../access/shared";
import { AcceptanceReportDialog } from "./acceptance-report-dialog";
import { BandEditor } from "./band-editor";
import { BandTable } from "./band-tables";
import { VersionHistory } from "./version-history";

/**
 * The Segments section: each trading segment's capital bands (minimum,
 * suggested and maximum risk), the history of changes, and who has accepted
 * each change. Editing needs the "Edit segments" permission.
 */
export function SegmentsScreen() {
  const permissions = usePermissions();
  const canView = permissions.can("segments.view");
  const segments = useAdminSegments(canView);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!permissions.ready) return null;
  if (!canView) return <NoAccess section="Segments" />;

  const items = segments.data ?? [];
  const selected =
    items.find((segment) => segment.id === selectedId) ?? items[0];

  return (
    <>
      <PageHeader
        title="Segments"
        description="Capital bands and risk limits for each trading segment. Customers holding a segment must accept every change."
      />
      {segments.error ? (
        <LoadFailed
          error={segments.error}
          onRetry={() => void segments.refetch()}
        />
      ) : null}
      {items.length > 0 && selected ? (
        <>
          <div className="overflow-x-auto">
            <SegmentedTabs
              label="Segment"
              options={items.map((segment) => ({
                value: segment.id,
                label: segment.name,
              }))}
              value={selected.id}
              onChange={setSelectedId}
            />
          </div>
          {/* Keyed so that switching segment leaves any unsaved edit behind. */}
          <SegmentPanel
            key={selected.id}
            segment={selected}
            canEdit={permissions.can("segments.edit")}
          />
        </>
      ) : null}
    </>
  );
}

function SegmentPanel({
  segment,
  canEdit,
}: {
  segment: AdminSegment;
  canEdit: boolean;
}) {
  const overview = useRiskRules(segment.id);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState<SaveRiskRulesResult | null>(null);
  const [report, setReport] = useState<number | null>(null);
  const rules = overview.data?.current ?? null;

  return (
    <>
      {saved ? (
        <p
          role="status"
          className="rounded-xl bg-positive/10 px-4 py-3 text-sm font-semibold text-positive"
        >
          Version {saved.ruleSet.version} saved.{" "}
          {saved.impact.customers === 0
            ? "No customer holds this segment yet."
            : saved.impact.notified > 0
              ? `${plural(saved.impact.notified, "customer")} will be asked to accept it the next time they open Adviserz.`
              : "Nobody has to accept it: every customer holding this segment already has these limits."}
        </p>
      ) : null}

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <CardTitle>Risk bands</CardTitle>
            {rules ? (
              <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge tone="brand">Version {rules.version}</Badge>
                <span>Minimum capital {formatInr(rules.minCapital)}</span>
                <span aria-hidden>·</span>
                <span>
                  {segment.riskBasis === "daily_loss"
                    ? "Risk is a daily loss limit"
                    : "Risk is on the whole capital"}
                </span>
                <span aria-hidden>·</span>
                <span>
                  {rules.suggestedMode === "midpoint"
                    ? "Suggested = midpoint of min and max"
                    : "Suggested is set per band"}
                </span>
              </p>
            ) : null}
          </div>
          {canEdit && rules && !editing ? (
            <Button
              className={compactButtonClassName}
              onClick={() => {
                setSaved(null);
                setEditing(true);
              }}
            >
              Edit bands
            </Button>
          ) : null}
        </div>

        {overview.error ? (
          <LoadFailed
            error={overview.error}
            onRetry={() => void overview.refetch()}
          />
        ) : null}
        {overview.data && !rules ? (
          <EmptyState>No risk bands are set for this segment.</EmptyState>
        ) : null}
        {rules && editing ? (
          <BandEditor
            segment={segment}
            rules={rules}
            onCancel={() => setEditing(false)}
            onSaved={(result) => {
              setEditing(false);
              setSaved(result);
            }}
          />
        ) : null}
        {rules && !editing ? <BandTable rules={rules} /> : null}
      </Card>

      {overview.data && overview.data.versions.length > 0 ? (
        <Card className="flex flex-col gap-4">
          <CardTitle>History</CardTitle>
          <VersionHistory
            versions={overview.data.versions}
            onShowAcceptances={setReport}
          />
        </Card>
      ) : null}

      {report !== null ? (
        <AcceptanceReportDialog
          segmentId={segment.id}
          segmentName={segment.name}
          version={report}
          onClose={() => setReport(null)}
        />
      ) : null}
    </>
  );
}
