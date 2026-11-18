"use client";

import { formatInr, trimDecimal } from "@/lib/utils/format";
import { useSaveCapital } from "../../hooks/use-onboarding";
import type { StepProps } from "../../lib/steps";
import {
  segmentRows,
  SegmentValuesStep,
  type SegmentRow,
} from "../segment-values-step";

/** Whole rupees, optionally with up to two decimals (the API's precision). */
const AMOUNT_PATTERN = /^\d{1,16}(\.\d{1,2})?$/;

function validateCapital({ config }: SegmentRow, value: string): string | null {
  if (!value) return "Enter an amount";
  if (!AMOUNT_PATTERN.test(value)) {
    return "Enter a number with at most 2 decimal places";
  }
  if (Number(value) <= 0) return "Enter an amount greater than 0";
  if (Number(value) < Number(config.minCapital)) {
    return `Minimum for ${config.name} is ${formatInr(config.minCapital)}`;
  }
  return null;
}

/** How much capital the user trades with in each chosen segment. */
export function CapitalStep({ state, progress, onBack, onDone }: StepProps) {
  const save = useSaveCapital();
  const rows = segmentRows(
    state.draft?.segments ?? [],
    state.availableSegments,
  );

  return (
    <SegmentValuesStep
      name="capital"
      title="How much capital do you trade with?"
      description="Only what you set aside for trading, not total savings."
      rows={rows}
      prefix="₹"
      inputMode="decimal"
      initialValue={({ draft }) =>
        draft.capital ? trimDecimal(draft.capital) : ""
      }
      hint={({ config }) =>
        Number(config.minCapital) > 0
          ? `Minimum ${formatInr(config.minCapital)}`
          : "Enter the amount in rupees"
      }
      validate={validateCapital}
      onSave={(values, callbacks) =>
        save.mutate(
          values.map(({ segmentId, value }) => ({ segmentId, capital: value })),
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
