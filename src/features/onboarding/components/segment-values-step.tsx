"use client";

import { useState } from "react";
import { AffixField } from "@/components/ui/affix-field";
import { getErrorMessage } from "@/lib/api";
import type { DraftSegment, Segment } from "../api/onboarding.api";
import { segmentErrors, type StepProps } from "../lib/steps";
import { QuestionStep } from "./question-step";

/** A chosen segment together with the limits an admin configured for it. */
export interface SegmentRow {
  draft: DraftSegment;
  config: Segment;
}

interface SegmentValuesStepProps extends Omit<StepProps, "state"> {
  title: string;
  description: string;
  rows: SegmentRow[];
  /** Used to build field ids, e.g. "capital". */
  name: string;
  prefix?: string;
  suffix?: string;
  inputMode: "numeric" | "decimal";
  /** The value already saved for a row, or "" if none. */
  initialValue: (row: SegmentRow) => string;
  /** Guidance under a field; gets what is typed so far, so it can react to it. */
  hint: (row: SegmentRow, value: string) => string;
  /** Returns a message when `value` is not acceptable for the row. */
  validate: (row: SegmentRow, value: string) => string | null;
  onSave: (
    values: { segmentId: string; value: string }[],
    callbacks: { onSuccess: () => void },
  ) => void;
  saving: boolean;
  /** The failed save, if any. Per-segment problems are shown under their field. */
  saveError: unknown;
}

/**
 * A question answered with one number per chosen segment. Shared by the
 * capital and risk questions, which differ only in copy, unit and rules.
 */
export function SegmentValuesStep({
  title,
  description,
  rows,
  name,
  prefix,
  suffix,
  inputMode,
  initialValue,
  hint,
  validate,
  onSave,
  saving,
  saveError,
  progress,
  onBack,
  onDone,
}: SegmentValuesStepProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((row) => [row.config.id, initialValue(row)])),
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [edited, setEdited] = useState(false);

  // Server messages apply to what was submitted; hide them once the user edits.
  const serverErrors = edited ? {} : segmentErrors(saveError);
  const hasFieldErrors = Object.keys(serverErrors).length > 0;

  const submit = () => {
    const errors: Record<string, string> = {};
    for (const row of rows) {
      const message = validate(row, (values[row.config.id] ?? "").trim());
      if (message) errors[row.config.id] = message;
    }
    setLocalErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setEdited(false);
    onSave(
      rows.map((row) => ({
        segmentId: row.config.id,
        value: (values[row.config.id] ?? "").trim(),
      })),
      { onSuccess: onDone },
    );
  };

  return (
    <QuestionStep
      progress={progress}
      title={title}
      description={description}
      onSubmit={submit}
      onBack={onBack}
      submitting={saving}
      errorMessage={
        saveError && !edited && !hasFieldErrors
          ? getErrorMessage(saveError)
          : null
      }
    >
      <div className="flex w-full flex-col gap-4">
        {rows.map((row) => {
          const id = row.config.id;
          return (
            <AffixField
              key={id}
              id={`${name}-${row.config.code.toLowerCase()}`}
              label={row.config.name}
              prefix={prefix}
              suffix={suffix}
              inputMode={inputMode}
              autoComplete="off"
              placeholder="0"
              value={values[id] ?? ""}
              onChange={(event) => {
                setValues((current) => ({
                  ...current,
                  [id]: event.target.value,
                }));
                setLocalErrors((current) => {
                  const rest = { ...current };
                  delete rest[id];
                  return rest;
                });
                setEdited(true);
              }}
              hint={hint(row, (values[id] ?? "").trim())}
              error={localErrors[id] ?? serverErrors[id]}
            />
          );
        })}
      </div>
    </QuestionStep>
  );
}

/** Pair each chosen segment with its configuration; drops any that is no longer offered. */
export function segmentRows(
  chosen: DraftSegment[],
  available: Segment[],
): SegmentRow[] {
  return chosen.flatMap((draft) => {
    const config = available.find((segment) => segment.id === draft.segmentId);
    return config ? [{ draft, config }] : [];
  });
}
