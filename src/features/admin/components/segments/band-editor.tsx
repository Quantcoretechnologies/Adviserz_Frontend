"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { compactButtonClassName } from "@/components/ui/dialog";
import { inputBoxClassName } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import type { RiskRules } from "@/features/risk/api/risk.types";
import { percent } from "@/features/risk/lib/bands";
import { isApiError } from "@/lib/api";
import { cn } from "@/lib/utils/cn";
import { trimDecimal } from "@/lib/utils/format";
import type {
  AdminSegment,
  BandInput,
  SaveRiskRulesResult,
} from "../../api/admin-segments.types";
import { useSaveRiskRules } from "../../hooks/use-admin-segments";
import { describeError } from "../access/shared";
import { cellClassName, DataTable } from "./band-tables";
import { ReviewChangesDialog } from "./review-changes-dialog";

const AMOUNT = /^\d{1,16}(\.\d{1,2})?$/;
const PERCENT = /^\d{1,3}(\.\d{1,4})?$/;
const MAX_BANDS = 50;

type Field =
  "capitalFrom" | "minRiskPercent" | "suggestedRiskPercent" | "maxRiskPercent";

interface Row {
  /** Stable React key; rows can be added and removed. */
  key: number;
  capitalFrom: string;
  minRiskPercent: string;
  suggestedRiskPercent: string;
  maxRiskPercent: string;
}

/** Problems keyed "<row index>.<field>", the same shape the API uses (bands.<index>.<field>). */
type Problems = Record<string, string>;

let nextKey = 0;
const newRow = (values: Omit<Row, "key">): Row => ({
  key: nextKey++,
  ...values,
});

function rowsFrom(rules: RiskRules): Row[] {
  return rules.bands.map((band) =>
    newRow({
      capitalFrom: trimDecimal(band.capitalFrom),
      minRiskPercent: trimDecimal(band.minRiskPercent),
      suggestedRiskPercent: trimDecimal(band.suggestedRiskPercent),
      maxRiskPercent: trimDecimal(band.maxRiskPercent),
    }),
  );
}

/** (min + max) / 2 at 4 decimals, as the API works it out; null until both are valid. */
function midpoint(row: Row): string | null {
  if (!PERCENT.test(row.minRiskPercent) || !PERCENT.test(row.maxRiskPercent))
    return null;
  const value = (Number(row.minRiskPercent) + Number(row.maxRiskPercent)) / 2;
  return String(Math.round(value * 10_000) / 10_000);
}

/** The same rules the API applies, so problems show before anything is sent. */
function validate(rows: Row[], manual: boolean): Problems {
  const problems: Problems = {};
  rows.forEach((row, index) => {
    const at = (field: Field, message: string) => {
      problems[`${index}.${field}`] ??= message;
    };
    if (!AMOUNT.test(row.capitalFrom))
      at("capitalFrom", "Enter an amount (up to 2 decimals)");
    else {
      const previous = rows[index - 1];
      if (
        previous &&
        AMOUNT.test(previous.capitalFrom) &&
        Number(row.capitalFrom) <= Number(previous.capitalFrom)
      ) {
        at("capitalFrom", "Must be higher than the band above");
      }
    }
    const min = Number(row.minRiskPercent);
    const max = Number(row.maxRiskPercent);
    if (!PERCENT.test(row.minRiskPercent))
      at("minRiskPercent", "Enter a percentage (up to 4 decimals)");
    else if (min <= 0) at("minRiskPercent", "Must be more than 0");
    if (!PERCENT.test(row.maxRiskPercent))
      at("maxRiskPercent", "Enter a percentage (up to 4 decimals)");
    else if (max > 100) at("maxRiskPercent", "Cannot be more than 100");
    if (
      PERCENT.test(row.minRiskPercent) &&
      PERCENT.test(row.maxRiskPercent) &&
      min > max
    ) {
      at("minRiskPercent", "Cannot be more than the maximum");
    }
    if (manual) {
      if (!PERCENT.test(row.suggestedRiskPercent))
        at("suggestedRiskPercent", "Enter a percentage (up to 4 decimals)");
      else {
        const suggested = Number(row.suggestedRiskPercent);
        if (suggested < min || suggested > max)
          at(
            "suggestedRiskPercent",
            "Must be between the minimum and the maximum",
          );
      }
    }
  });
  return problems;
}

/** Per-row problems the API reported (paths like "bands.2.capitalFrom"). */
function serverProblems(error: unknown): Problems {
  if (!isApiError(error) || !Array.isArray(error.details)) return {};
  const problems: Problems = {};
  for (const detail of error.details as { path?: string; message?: string }[]) {
    const match = detail.path?.match(/^bands\.(\d+)\.(\w+)$/);
    if (match && detail.message)
      problems[`${match[1]}.${match[2]}`] = detail.message;
  }
  return problems;
}

function toInput(rows: Row[], manual: boolean): BandInput[] {
  return rows.map((row) => ({
    capitalFrom: row.capitalFrom.trim(),
    minRiskPercent: row.minRiskPercent.trim(),
    maxRiskPercent: row.maxRiskPercent.trim(),
    ...(manual
      ? { suggestedRiskPercent: row.suggestedRiskPercent.trim() }
      : {}),
  }));
}

interface BandEditorProps {
  segment: AdminSegment;
  rules: RiskRules;
  onCancel: () => void;
  onSaved: (result: SaveRiskRulesResult) => void;
}

/**
 * The band table in edit mode. Nothing is saved until the review step: the
 * table is first sent as a preview, which shows every change and how many
 * customers it affects, and only then saved (which notifies them).
 */
export function BandEditor({
  segment,
  rules,
  onCancel,
  onSaved,
}: BandEditorProps) {
  const manual = rules.suggestedMode === "manual";
  const save = useSaveRiskRules();
  const [rows, setRows] = useState(() => rowsFrom(rules));
  const [problems, setProblems] = useState<Problems>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [review, setReview] = useState<SaveRiskRulesResult | null>(null);

  const update = (key: number, field: Field, value: string) => {
    setRows((current) =>
      current.map((row) =>
        row.key === key ? { ...row, [field]: value } : row,
      ),
    );
    setProblems({});
    setFormError(null);
  };

  const remove = (key: number) => {
    setRows((current) => current.filter((row) => row.key !== key));
    setProblems({});
  };

  const add = () => {
    setRows((current) => [
      ...current,
      newRow({
        capitalFrom: "",
        minRiskPercent: "",
        suggestedRiskPercent: "",
        maxRiskPercent: "",
      }),
    ]);
  };

  const handleError = (error: unknown) => {
    const perRow = serverProblems(error);
    setProblems(perRow);
    setFormError(
      Object.keys(perRow).length > 0
        ? "Some bands need fixing. See the marked fields."
        : describeError(error),
    );
  };

  const startReview = () => {
    const found = validate(rows, manual);
    setProblems(found);
    if (Object.keys(found).length > 0) {
      setFormError("Some bands need fixing. See the marked fields.");
      return;
    }
    setFormError(null);
    save.mutate(
      { segmentId: segment.id, bands: toInput(rows, manual), asPreview: true },
      { onSuccess: setReview, onError: handleError },
    );
  };

  const confirm = () => {
    save.mutate(
      { segmentId: segment.id, bands: toInput(rows, manual), asPreview: false },
      {
        onSuccess: (result) => {
          setReview(null);
          onSaved(result);
        },
      },
    );
  };

  const input = (
    row: Row,
    index: number,
    field: Field,
    label: string,
    unit: string,
  ) => {
    const message = problems[`${index}.${field}`];
    const id = `band-${row.key}-${field}`;
    return (
      <div className="flex flex-col gap-1">
        <div
          className={cn(
            inputBoxClassName,
            "flex items-center gap-1 px-3 py-2 focus-within:border-primary",
            message && "border-destructive",
          )}
        >
          {unit === "₹" ? <span aria-hidden>₹</span> : null}
          <input
            id={id}
            aria-label={`${label}, band ${index + 1}`}
            aria-invalid={message ? true : undefined}
            aria-describedby={message ? `${id}-error` : undefined}
            inputMode="decimal"
            autoComplete="off"
            value={row[field]}
            onChange={(event) => update(row.key, field, event.target.value)}
            className="w-full min-w-0 bg-transparent focus:outline-none"
          />
          {unit === "%" ? <span aria-hidden>%</span> : null}
        </div>
        {message ? (
          <p
            id={`${id}-error`}
            className="text-sm font-semibold text-destructive"
          >
            {message}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base tracking-[-0.24px] text-muted-foreground">
        Each band applies from its capital up to the next band&apos;s capital.
        The first band&apos;s capital is the minimum capital for {segment.name}.{" "}
        {manual
          ? "Type the suggested risk for each band."
          : "Suggested risk is worked out as the midpoint of minimum and maximum."}
      </p>

      <DataTable
        caption={`Edit risk bands for ${segment.name}`}
        headers={["Capital from", "Minimum", "Suggested", "Maximum", ""]}
      >
        {rows.map((row, index) => (
          <tr key={row.key}>
            <td className={cn(cellClassName, "w-[28%]")}>
              {input(row, index, "capitalFrom", "Capital from", "₹")}
            </td>
            <td className={cellClassName}>
              {input(row, index, "minRiskPercent", "Minimum risk", "%")}
            </td>
            <td className={cellClassName}>
              {manual ? (
                input(row, index, "suggestedRiskPercent", "Suggested risk", "%")
              ) : (
                <p
                  className="px-3 py-2 text-muted-foreground"
                  aria-label={`Suggested risk, band ${index + 1}`}
                >
                  {midpoint(row) ? percent(midpoint(row) ?? "0") : "—"}
                </p>
              )}
            </td>
            <td className={cellClassName}>
              {input(row, index, "maxRiskPercent", "Maximum risk", "%")}
            </td>
            <td className={cn(cellClassName, "w-px")}>
              <button
                type="button"
                aria-label={`Remove band ${index + 1}`}
                disabled={rows.length <= 1}
                onClick={() => remove(row.key)}
                className="cursor-pointer rounded-lg px-2 py-2 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Remove
              </button>
            </td>
          </tr>
        ))}
      </DataTable>

      <FormAlert message={formError} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          className={compactButtonClassName}
          disabled={rows.length >= MAX_BANDS}
          onClick={add}
        >
          Add band
        </Button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className={compactButtonClassName}
            disabled={save.isPending}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className={compactButtonClassName}
            loading={save.isPending && review === null}
            onClick={startReview}
          >
            Review changes
          </Button>
        </div>
      </div>

      {review ? (
        <ReviewChangesDialog
          segmentName={segment.name}
          result={review}
          saving={save.isPending}
          error={
            save.error && !save.isPending ? describeError(save.error) : null
          }
          onBack={() => {
            save.reset();
            setReview(null);
          }}
          onConfirm={confirm}
        />
      ) : null}
    </div>
  );
}
