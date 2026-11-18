"use client";

import { trimDecimal } from "@/lib/utils/format";
import { useSaveRisk } from "../../hooks/use-onboarding";
import type { StepProps } from "../../lib/steps";
import {
  segmentRows,
  SegmentValuesStep,
  type SegmentRow,
} from "../segment-values-step";

/** A percentage with up to four decimals (the API's precision). */
const PERCENT_PATTERN = /^\d{1,3}(\.\d{1,4})?$/;

function range({ config }: SegmentRow): string {
  return `${trimDecimal(config.minRiskPercent)}% and ${trimDecimal(config.maxRiskPercent)}%`;
}

function validateRisk(row: SegmentRow, value: string): string | null {
  if (!value) return "Enter a percentage";
  if (!PERCENT_PATTERN.test(value)) {
    return "Enter a number with at most 4 decimal places";
  }
  const { minRiskPercent, maxRiskPercent } = row.config;
  if (
    Number(value) < Number(minRiskPercent) ||
    Number(value) > Number(maxRiskPercent)
  ) {
    return `Must be between ${range(row)}`;
  }
  return null;
}

/** What the percentage is measured against, which differs by segment. */
function riskHint(row: SegmentRow): string {
  const meaning =
    row.config.riskBasis === "total_capital"
      ? "Share of this capital you are willing to risk"
      : "Most of this capital you are willing to lose in a day";
  return `${meaning}. Between ${range(row)}.`;
}

/** How much the user is willing to lose in each chosen segment. */
export function RiskStep({ state, progress, onBack, onDone }: StepProps) {
  const save = useSaveRisk();
  const rows = segmentRows(
    state.draft?.segments ?? [],
    state.availableSegments,
  );

  return (
    <SegmentValuesStep
      name="risk"
      title="How much can you lose?"
      description="As a share of your trading capital, for each segment."
      rows={rows}
      suffix="%"
      inputMode="decimal"
      initialValue={({ draft }) =>
        draft.riskPercent ? trimDecimal(draft.riskPercent) : ""
      }
      hint={riskHint}
      validate={validateRisk}
      onSave={(values, callbacks) =>
        save.mutate(
          values.map(({ segmentId, value }) => ({
            segmentId,
            riskPercent: value,
          })),
          callbacks,
        )
      }
      saving={save.isPending}
      saveError={save.error}
      progress={progress}
      onBack={onBack}
      onDone={onDone}
    />
  );
}
