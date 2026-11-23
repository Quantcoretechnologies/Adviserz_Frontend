"use client";

import { useState } from "react";
import type { Acknowledgement } from "@/features/risk/api/risk.types";
import { useDisclaimerQueue } from "@/features/risk/hooks/use-disclaimer-queue";
import { useAssessRisk } from "@/features/risk/hooks/use-risk";
import {
  acknowledgementFor,
  classifyRisk,
  disclaimersFromError,
  findBand,
  percent,
  riskAmount,
  riskAmountPeriod,
} from "@/features/risk/lib/bands";
import { formatInr, trimDecimal } from "@/lib/utils/format";
import { useSaveRisk } from "../../hooks/use-onboarding";
import type { SegmentCheck } from "../../api/onboarding.api";
import type { StepProps } from "../../lib/steps";
import {
  segmentRows,
  SegmentValuesStep,
  type SegmentRow,
} from "../segment-values-step";

/** A percentage with up to four decimals (the API's precision). */
const PERCENT_PATTERN = /^\d{1,3}(\.\d{1,4})?$/;

/** The band for the capital the user entered at the previous step. */
function bandFor(row: SegmentRow) {
  const rules = row.config.riskRules;
  const capital = row.draft.capital;
  return rules && capital ? findBand(rules, capital) : null;
}

/** Below the band minimum and above 100% are never allowed. */
function validateRisk(row: SegmentRow, value: string): string | null {
  if (!value) return "Enter a percentage";
  if (!PERCENT_PATTERN.test(value)) {
    return "Enter a number with at most 4 decimal places";
  }
  const band = bandFor(row);
  const rules = row.config.riskRules;
  if (!band || !rules) {
    return `Your capital is below the minimum for ${row.config.name}. Go back and change it.`;
  }
  const level = classifyRisk(band, value, rules.ceilingPercent);
  if (level === "below_minimum") {
    return `For this capital the minimum is ${percent(band.minRiskPercent)}`;
  }
  if (level === "above_ceiling") {
    return `Cannot be more than ${percent(rules.ceilingPercent)}`;
  }
  return null;
}

/**
 * The range for the user's own capital, and — once a valid number is typed —
 * the amount at risk and whether a disclaimer will follow.
 */
function riskHint(row: SegmentRow, value: string): string {
  const band = bandFor(row);
  const capital = row.draft.capital;
  if (!band || !capital) return "Enter your capital first.";
  const range =
    `For ${formatInr(capital)}: minimum ${percent(band.minRiskPercent)}, ` +
    `suggested ${percent(band.suggestedRiskPercent)}, maximum ${percent(band.maxRiskPercent)}.`;
  if (!PERCENT_PATTERN.test(value)) return range;

  const level = classifyRisk(band, value, row.config.riskRules?.ceilingPercent);
  if (level === "below_minimum" || level === "above_ceiling") return range;
  const amount = `That is ${formatInr(riskAmount(capital, value))} ${riskAmountPeriod(row.config.riskBasis)}`;
  if (level === "above_maximum") {
    return `${range} ${amount}, above the maximum limit: you will be asked to accept a risk warning.`;
  }
  if (level === "above_suggested") {
    return `${range} ${amount}, above the suggested level: you will be asked to confirm it.`;
  }
  return `${range} ${amount}.`;
}

/**
 * A disclaimer is needed unless one was already accepted for exactly this
 * value at this level (the API keeps it on record and reuses it).
 */
function needsDisclaimer(
  row: SegmentRow,
  value: string,
  check: SegmentCheck | undefined,
): boolean {
  const band = bandFor(row);
  if (!band) return false;
  const required = acknowledgementFor(
    classifyRisk(band, value, row.config.riskRules?.ceilingPercent),
  );
  if (!required) return false;
  const unchanged =
    row.draft.riskPercent !== null &&
    Number(row.draft.riskPercent) === Number(value);
  return !(
    unchanged &&
    check?.acknowledged === true &&
    check.acknowledgementRequired === required
  );
}

/** How much the user is willing to lose in each chosen segment. */
export function RiskStep({ state, progress, onBack, onDone }: StepProps) {
  const save = useSaveRisk();
  const assess = useAssessRisk();
  const queue = useDisclaimerQueue();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const rows = segmentRows(
    state.draft?.segments ?? [],
    state.availableSegments,
  );
  const checks = new Map(
    state.segmentChecks.map((check) => [check.segmentId, check]),
  );
  const nameOf = (segmentId: string) =>
    rows.find((row) => row.config.id === segmentId)?.config.name ?? "Segment";

  /**
   * Fetch and show the disclaimers the values need, then save with the
   * acceptances. If the API still asks for one (the limits changed in the
   * meantime), show that and save again. Backing out of a disclaimer saves
   * nothing, so the user can lower the value.
   */
  const submit = async (
    values: { segmentId: string; value: string }[],
    onSuccess: () => void,
  ) => {
    setError(null);
    const acks = new Map<string, Acknowledgement>();
    const allocations = () =>
      values.map(({ segmentId, value }) => {
        const acknowledgement = acks.get(segmentId);
        return {
          segmentId,
          riskPercent: value,
          ...(acknowledgement ? { acknowledgement } : {}),
        };
      });
    try {
      const needing = values.filter(({ segmentId, value }) => {
        const row = rows.find((candidate) => candidate.config.id === segmentId);
        return row ? needsDisclaimer(row, value, checks.get(segmentId)) : false;
      });
      if (needing.length > 0) {
        setBusy(true);
        const assessed = await assess.mutateAsync(
          needing.map(({ segmentId, value }) => ({
            segmentId,
            capital:
              rows.find((row) => row.config.id === segmentId)?.draft.capital ??
              "0",
            riskPercent: value,
          })),
        );
        setBusy(false);
        const accepted = await queue.ask(
          assessed.items.flatMap((item) =>
            item.disclaimer
              ? [
                  {
                    segmentId: item.segmentId,
                    segmentName: nameOf(item.segmentId),
                    disclaimer: item.disclaimer,
                  },
                ]
              : [],
          ),
        );
        if (!accepted) return;
        accepted.forEach((ack, segmentId) => acks.set(segmentId, ack));
      }

      setBusy(true);
      try {
        await save.mutateAsync(allocations());
      } catch (saveError) {
        const asked = disclaimersFromError(saveError);
        if (asked.length === 0) throw saveError;
        setBusy(false);
        const again = await queue.ask(
          asked.map(({ segmentId, disclaimer }) => ({
            segmentId,
            segmentName: nameOf(segmentId),
            disclaimer,
          })),
        );
        if (!again) return;
        again.forEach((ack, segmentId) => acks.set(segmentId, ack));
        setBusy(true);
        await save.mutateAsync(allocations());
      }
      onSuccess();
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
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
        onSave={(values, { onSuccess }) => void submit(values, onSuccess)}
        saving={busy}
        saveError={error}
        progress={progress}
        onBack={onBack}
        onDone={onDone}
      />
      {queue.dialog}
    </>
  );
}
