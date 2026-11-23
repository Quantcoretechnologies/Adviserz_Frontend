"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { compactButtonClassName } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatInr } from "@/lib/utils/format";
import type { RiskRuleVersion } from "../../api/admin-segments.types";
import { formatDate, plural } from "../access/shared";
import { BandChangesTable } from "./band-tables";

const SOURCE_LABEL: Record<RiskRuleVersion["source"], string> = {
  migration: "Set up by the system",
  seed: "Default values",
  admin: "Saved by an admin",
};

interface VersionHistoryProps {
  versions: RiskRuleVersion[];
  /** Opens the acceptance report of a version that notified customers. */
  onShowAcceptances: (version: number) => void;
}

/** Every version of a segment's bands, newest first, with what each one changed. */
export function VersionHistory({
  versions,
  onShowAcceptances,
}: VersionHistoryProps) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <ol className="flex flex-col divide-y divide-hairline">
      {versions.map((version, index) => {
        const changes = version.changeSummary?.bands ?? [];
        const minCapital = version.changeSummary?.minCapital;
        const expanded = open === version.version;
        return (
          <li
            key={version.id}
            className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                  Version {version.version}
                  {index === 0 ? <Badge tone="brand">In force</Badge> : null}
                  {version.notifyUsers ? (
                    <Badge>Customers notified</Badge>
                  ) : null}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(version.createdAt)} ·{" "}
                  {version.createdBy
                    ? version.createdBy.fullName
                    : SOURCE_LABEL[version.source]}
                  {changes.length > 0
                    ? ` · ${plural(changes.length, "band")} changed`
                    : ""}
                  {minCapital &&
                  minCapital.before !== null &&
                  minCapital.before !== minCapital.after
                    ? ` · minimum capital ${formatInr(minCapital.before)} → ${formatInr(minCapital.after)}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {changes.length > 0 ? (
                  <Button
                    variant="outline"
                    className={compactButtonClassName}
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : version.version)}
                  >
                    {expanded ? "Hide changes" : "Show changes"}
                  </Button>
                ) : null}
                {version.notifyUsers ? (
                  <Button
                    variant="outline"
                    className={compactButtonClassName}
                    onClick={() => onShowAcceptances(version.version)}
                  >
                    Acceptance report
                  </Button>
                ) : null}
              </div>
            </div>
            {expanded ? <BandChangesTable changes={changes} /> : null}
          </li>
        );
      })}
    </ol>
  );
}
