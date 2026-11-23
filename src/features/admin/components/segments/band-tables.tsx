import type { ReactNode } from "react";
import type { RiskRules } from "@/features/risk/api/risk.types";
import { bandRangeLabel, percent } from "@/features/risk/lib/bands";
import { cn } from "@/lib/utils/cn";
import { formatInr } from "@/lib/utils/format";
import type { BandChange, BandValues } from "../../api/admin-segments.types";

/** Table frame shared by the band tables on the Segments screen. */
export function DataTable({
  caption,
  headers,
  children,
  className,
}: {
  caption?: string;
  headers: string[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[560px] text-left text-base tracking-[-0.24px]">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-hairline text-sm text-muted-foreground">
            {headers.map((header) => (
              <th key={header} scope="col" className="py-2 pr-4 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">{children}</tbody>
      </table>
    </div>
  );
}

export const cellClassName = "py-3 pr-4 align-top";

/** The bands in force, one row per capital range. */
export function BandTable({ rules }: { rules: RiskRules }) {
  return (
    <DataTable
      caption="Risk bands in force"
      headers={["Capital range", "Minimum", "Suggested", "Maximum"]}
    >
      {rules.bands.map((band) => (
        <tr key={band.capitalFrom}>
          <td className={cn(cellClassName, "font-semibold")}>
            {bandRangeLabel(band)}
          </td>
          <td className={cellClassName}>{percent(band.minRiskPercent)}</td>
          <td className={cellClassName}>
            {percent(band.suggestedRiskPercent)}
          </td>
          <td className={cellClassName}>{percent(band.maxRiskPercent)}</td>
        </tr>
      ))}
    </DataTable>
  );
}

function values(band: BandValues | null): string {
  if (!band) return "—";
  return `${percent(band.minRiskPercent)} / ${percent(band.suggestedRiskPercent)} / ${percent(band.maxRiskPercent)}`;
}

const CHANGE_LABEL: Record<BandChange["change"], string> = {
  added: "Added",
  removed: "Removed",
  changed: "Changed",
};

/** Old and new values of every band that differs between two versions. */
export function BandChangesTable({ changes }: { changes: BandChange[] }) {
  return (
    <DataTable
      caption="Band changes"
      headers={[
        "Capital from",
        "Change",
        "Before (min / suggested / max)",
        "Now (min / suggested / max)",
      ]}
    >
      {changes.map((change) => (
        <tr key={change.capitalFrom}>
          <td className={cn(cellClassName, "font-semibold")}>
            {formatInr(change.capitalFrom)}
          </td>
          <td className={cellClassName}>{CHANGE_LABEL[change.change]}</td>
          <td className={cn(cellClassName, "text-muted-foreground")}>
            {values(change.before)}
          </td>
          <td className={cn(cellClassName, "font-semibold")}>
            {values(change.after)}
          </td>
        </tr>
      ))}
    </DataTable>
  );
}
