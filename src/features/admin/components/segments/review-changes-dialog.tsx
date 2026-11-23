"use client";

import { Button } from "@/components/ui/button";
import { compactButtonClassName, Dialog } from "@/components/ui/dialog";
import { FormAlert } from "@/components/ui/form-alert";
import { formatInr } from "@/lib/utils/format";
import type { SaveRiskRulesResult } from "../../api/admin-segments.types";
import { plural } from "../access/shared";
import { BandChangesTable } from "./band-tables";

interface ReviewChangesDialogProps {
  segmentName: string;
  /** The preview answer: changes and effect on customers. Nothing is saved yet. */
  result: SaveRiskRulesResult;
  saving: boolean;
  error: string | null;
  onBack: () => void;
  onConfirm: () => void;
}

/**
 * The last step before a new band table is saved: every change, and what it
 * means for the customers who hold the segment. Saving notifies all of them.
 */
export function ReviewChangesDialog({
  segmentName,
  result,
  saving,
  error,
  onBack,
  onConfirm,
}: ReviewChangesDialogProps) {
  const { changes, impact } = result;
  const minCapitalChanged =
    changes.minCapital.before !== changes.minCapital.after;

  return (
    <Dialog
      open
      size="lg"
      dismissible={!saving}
      onClose={onBack}
      title={`Review changes to ${segmentName}`}
      description={`This will be version ${result.ruleSet.version}. Nothing is saved until you confirm.`}
      footer={
        <>
          <Button
            variant="outline"
            className={compactButtonClassName}
            disabled={saving}
            onClick={onBack}
          >
            Back to editing
          </Button>
          <Button
            className={compactButtonClassName}
            loading={saving}
            onClick={onConfirm}
          >
            Save and notify customers
          </Button>
        </>
      }
    >
      <section className="flex flex-col gap-2">
        <h3 className="font-display text-lg font-semibold text-foreground">
          What changes
        </h3>
        {minCapitalChanged ? (
          <p className="text-base text-foreground">
            Minimum capital:{" "}
            {changes.minCapital.before
              ? formatInr(changes.minCapital.before)
              : "—"}{" "}
            → <strong>{formatInr(changes.minCapital.after)}</strong>
          </p>
        ) : null}
        <BandChangesTable changes={changes.bands} />
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Effect on customers
        </h3>
        {impact.customers === 0 ? (
          <p className="text-base text-muted-foreground">
            No customer holds this segment yet, so nobody has to accept
            anything.
          </p>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <ImpactCount label="Values still fit" count={impact.ok} />
              <ImpactCount
                label="Will confirm the caution disclaimer"
                count={impact.needsCautionAck}
              />
              <ImpactCount
                label="Will accept the strict warning"
                count={impact.needsStrictAck}
              />
              <ImpactCount
                label="Must change their values"
                count={impact.mustChange}
                strong
              />
            </ul>
            {impact.notified === 0 ? (
              <p className="rounded-xl bg-surface-subtle px-4 py-3 text-sm font-semibold text-foreground">
                Nobody will be asked to accept this update: every customer
                holding {segmentName} already has these limits.
              </p>
            ) : (
              <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive">
                {impact.notified === impact.customers
                  ? `All ${plural(impact.customers, "customer")} holding ${segmentName} will be blocked until they accept this update.`
                  : `${impact.notified} of ${plural(impact.customers, "customer")} holding ${segmentName} will be blocked until they accept this update. The others already have these limits.`}
              </p>
            )}
          </>
        )}
      </section>

      <FormAlert message={error} />
    </Dialog>
  );
}

function ImpactCount({
  label,
  count,
  strong = false,
}: {
  label: string;
  count: number;
  strong?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl bg-surface-subtle px-4 py-3">
      <span className="text-base text-muted-foreground">{label}</span>
      <span
        className={
          strong && count > 0
            ? "font-display text-xl font-semibold text-destructive"
            : "font-display text-xl font-semibold text-foreground"
        }
      >
        {count}
      </span>
    </li>
  );
}
