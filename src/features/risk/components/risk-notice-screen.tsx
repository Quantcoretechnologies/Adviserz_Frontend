"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AffixField } from "@/components/ui/affix-field";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { ROUTES } from "@/config/routes";
import { ErrorCode, getErrorMessage, isApiError } from "@/lib/api";
import { formatInr, trimDecimal } from "@/lib/utils/format";
import type {
  Acknowledgement,
  RiskNotice,
  RiskNoticeSegment,
  RiskSegment,
} from "../api/risk.types";
import {
  useDisclaimerQueue,
  type DisclaimerRequest,
} from "../hooks/use-disclaimer-queue";
import {
  useAcceptRiskNotice,
  useAssessRisk,
  useRiskNotice,
  useRiskSegments,
} from "../hooks/use-risk";
import {
  acknowledgementFor,
  bandRangeLabel,
  classifyRisk,
  disclaimersFromError,
  findBand,
  percent,
  riskAmount,
  riskAmountPeriod,
} from "../lib/bands";
import { DisclaimerText, parseDisclaimer } from "./disclaimer-text";

const PERCENT_PATTERN = /^\d{1,3}(\.\d{1,4})?$/;
const AMOUNT_PATTERN = /^\d{1,16}(\.\d{1,2})?$/;

/** The values on screen for one segment of the notice. */
interface Draft {
  capital: string;
  riskPercent: string;
}

/**
 * Shown when an admin has changed the risk limits of a segment the user
 * holds. The app stays blocked until this is accepted. The text and the
 * band changes come from the API; values that no longer fit must be changed
 * here, and a value above the suggested or maximum level needs its
 * disclaimer.
 */
export function RiskNoticeScreen() {
  const router = useRouter();
  const notice = useRiskNotice();
  const segments = useRiskSegments();
  const required = notice.data?.required;
  const [updatedAgain, setUpdatedAgain] = useState(false);
  const notOnboarded =
    isApiError(notice.error) &&
    notice.error.code === ErrorCode.ONBOARDING_REQUIRED;

  useEffect(() => {
    if (required === false) router.replace(ROUTES.home);
    else if (notOnboarded) router.replace(ROUTES.onboarding);
  }, [required, notOnboarded, router]);

  if (notice.isError && !notOnboarded) {
    return <FormAlert message={getErrorMessage(notice.error)} />;
  }
  if (!notice.data?.notice || !segments.data) {
    return <p className="text-muted-foreground">Loading…</p>;
  }
  return (
    <div className="flex w-full flex-col gap-4">
      {/* Kept here, above the form: the form starts afresh with the new notice. */}
      {updatedAgain ? (
        <p
          role="status"
          className="w-full rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary"
        >
          The risk limits were updated again while you were reading. Please
          review the latest update below.
        </p>
      ) : null}
      <NoticeForm
        // Starts afresh whenever the notice itself changes (limits changed again).
        key={notice.data.notice.noticeSha256}
        notice={notice.data.notice}
        segments={segments.data.items}
        onAccepted={() => router.replace(ROUTES.home)}
        onOutdated={() => {
          setUpdatedAgain(true);
          void notice.refetch();
          void segments.refetch();
        }}
      />
    </div>
  );
}

function initialDrafts(notice: RiskNotice): Record<string, Draft> {
  return Object.fromEntries(
    notice.segments.map((segment) => [
      segment.segmentId,
      {
        capital: trimDecimal(segment.yourValues.capital),
        riskPercent: segment.yourValues.riskPercent
          ? trimDecimal(segment.yourValues.riskPercent)
          : "",
      },
    ]),
  );
}

function NoticeForm({
  notice,
  segments,
  onAccepted,
  onOutdated,
}: {
  notice: RiskNotice;
  segments: RiskSegment[];
  onAccepted: () => void;
  onOutdated: () => void;
}) {
  const accept = useAcceptRiskNotice();
  const assess = useAssessRisk();
  const queue = useDisclaimerQueue();
  const [drafts, setDrafts] = useState(() => initialDrafts(notice));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { paragraphs } = parseDisclaimer(notice.statement);
  const rulesOf = (segmentId: string) =>
    segments.find((segment) => segment.id === segmentId)?.riskRules ?? null;

  const changed = (segment: RiskNoticeSegment) => {
    const draft = drafts[segment.segmentId];
    if (!draft) return false;
    return (
      Number(draft.capital) !== Number(segment.yourValues.capital) ||
      Number(draft.riskPercent) !==
        Number(segment.yourValues.riskPercent ?? "0")
    );
  };

  /** Problems with the values on screen, per field ("<segmentId>.capital" / ".riskPercent"). */
  const validate = (): Record<string, string> => {
    const problems: Record<string, string> = {};
    for (const segment of notice.segments) {
      if (segment.status === "ok") continue;
      const draft = drafts[segment.segmentId];
      const rules = rulesOf(segment.segmentId);
      if (!draft || !rules) continue;
      const capitalKey = `${segment.segmentId}.capital`;
      const riskKey = `${segment.segmentId}.riskPercent`;
      if (!AMOUNT_PATTERN.test(draft.capital) || Number(draft.capital) <= 0) {
        problems[capitalKey] = "Enter an amount with at most 2 decimal places";
        continue;
      }
      const band = findBand(rules, draft.capital);
      if (!band) {
        problems[capitalKey] =
          `Minimum capital is ${formatInr(rules.minCapital)}`;
        continue;
      }
      if (!PERCENT_PATTERN.test(draft.riskPercent)) {
        problems[riskKey] = "Enter a percentage with at most 4 decimal places";
        continue;
      }
      const level = classifyRisk(band, draft.riskPercent, rules.ceilingPercent);
      if (level === "below_minimum") {
        problems[riskKey] =
          `For this capital the minimum is ${percent(band.minRiskPercent)}`;
      } else if (level === "above_ceiling") {
        problems[riskKey] =
          `Cannot be more than ${percent(rules.ceilingPercent)}`;
      }
    }
    return problems;
  };

  /** The disclaimers to show before accepting: ready-made ones for unchanged values, fetched ones for new values. */
  const disclaimerRequests = async (): Promise<DisclaimerRequest[]> => {
    const requests: DisclaimerRequest[] = [];
    const toAssess: {
      segmentId: string;
      capital: string;
      riskPercent: string;
    }[] = [];
    for (const segment of notice.segments) {
      if (segment.status === "ok") continue;
      const draft = drafts[segment.segmentId];
      if (!draft) continue;
      if (!changed(segment)) {
        const ready = notice.disclaimers.find(
          (item) => item.segmentId === segment.segmentId,
        );
        if (ready)
          requests.push({
            segmentId: segment.segmentId,
            segmentName: segment.name,
            disclaimer: ready,
          });
        continue;
      }
      const rules = rulesOf(segment.segmentId);
      const band = rules ? findBand(rules, draft.capital) : null;
      if (
        band &&
        acknowledgementFor(
          classifyRisk(band, draft.riskPercent, rules?.ceilingPercent),
        )
      ) {
        toAssess.push({
          segmentId: segment.segmentId,
          capital: draft.capital,
          riskPercent: draft.riskPercent,
        });
      }
    }
    if (toAssess.length > 0) {
      const assessed = await assess.mutateAsync(toAssess);
      for (const item of assessed.items) {
        if (!item.disclaimer) continue;
        const name =
          notice.segments.find(
            (segment) => segment.segmentId === item.segmentId,
          )?.name ?? "Segment";
        requests.push({
          segmentId: item.segmentId,
          segmentName: name,
          disclaimer: item.disclaimer,
        });
      }
    }
    return requests;
  };

  const body = (acks: Map<string, Acknowledgement>) => ({
    noticeSha256: notice.noticeSha256,
    policyDocumentId: notice.policyDocumentId,
    segments: notice.segments.flatMap((segment) => {
      const draft = drafts[segment.segmentId];
      const acknowledgement = acks.get(segment.segmentId);
      const values =
        draft && changed(segment)
          ? { capital: draft.capital, riskPercent: draft.riskPercent }
          : {};
      if (!acknowledgement && Object.keys(values).length === 0) return [];
      return [
        {
          segmentId: segment.segmentId,
          ...values,
          ...(acknowledgement ? { acknowledgement } : {}),
        },
      ];
    }),
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const problems = validate();
    setFieldErrors(problems);
    if (Object.keys(problems).length > 0) return;

    try {
      setBusy(true);
      const requests = await disclaimerRequests();
      setBusy(false);
      const acks = await queue.ask(requests);
      if (!acks) return;
      setBusy(true);
      try {
        await accept.mutateAsync(body(acks));
      } catch (failure) {
        const asked = disclaimersFromError(failure);
        if (asked.length === 0) throw failure;
        setBusy(false);
        const again = await queue.ask(
          asked.map(({ segmentId, disclaimer }) => ({
            segmentId,
            segmentName:
              notice.segments.find((segment) => segment.segmentId === segmentId)
                ?.name ?? "Segment",
            disclaimer,
          })),
        );
        if (!again) return;
        again.forEach((ack, segmentId) => acks.set(segmentId, ack));
        setBusy(true);
        await accept.mutateAsync(body(acks));
      }
      onAccepted();
    } catch (failure) {
      if (
        isApiError(failure) &&
        failure.code === ErrorCode.RISK_NOTICE_OUTDATED
      ) {
        // The screen shows the explanation and loads the new notice.
        onOutdated();
      } else {
        setError(getErrorMessage(failure));
      }
    } finally {
      setBusy(false);
    }
  };

  const update = (segmentId: string, field: keyof Draft, value: string) => {
    setDrafts((current) => ({
      ...current,
      [segmentId]: {
        ...(current[segmentId] ?? { capital: "", riskPercent: "" }),
        [field]: value,
      },
    }));
    setFieldErrors((current) => {
      const rest = { ...current };
      delete rest[`${segmentId}.${field}`];
      return rest;
    });
  };

  return (
    <>
      <form
        onSubmit={(event) => void submit(event)}
        noValidate
        className="flex w-full flex-col gap-6"
      >
        <header className="flex w-full flex-col items-start gap-2 font-semibold">
          <span className="rounded-[34px] bg-brand-gradient-badge px-4 py-2 text-base tracking-[-0.24px]">
            <span className="text-brand-gradient">Action needed</span>
          </span>
          <h1 className="max-w-[512px] font-display text-[36px] leading-[1.2] text-foreground sm:text-[47px]">
            {notice.title}
          </h1>
        </header>

        <div className="rounded-xl bg-surface-subtle p-4">
          <DisclaimerText paragraphs={paragraphs} />
        </div>

        {notice.segments.map((segment) => (
          <SegmentChanges
            key={segment.segmentId}
            segment={segment}
            draft={drafts[segment.segmentId]}
            rules={rulesOf(segment.segmentId)}
            errors={fieldErrors}
            onChange={update}
          />
        ))}

        <FormAlert message={error} />

        <div className="flex w-full justify-end">
          <Button type="submit" className="w-auto px-8" loading={busy}>
            I accept the updated limits
          </Button>
        </div>
      </form>
      {/* Outside the form: Enter in the dialog must not submit the notice. */}
      {queue.dialog}
    </>
  );
}

const STATUS_TEXT: Record<RiskNoticeSegment["status"], string> = {
  ok: "Your current setting fits the new limits.",
  needs_caution_ack:
    "Your current setting is above the suggested level. You will be asked to confirm it, or you can lower it below.",
  needs_strict_ack:
    "Your current setting is above the maximum limit. You will be asked to accept a risk warning, or you can lower it below.",
  must_change:
    "Your current setting no longer fits the new limits. Please change it below.",
};

/** One segment: what changed in its bands, and (when needed) fields for new values. */
function SegmentChanges({
  segment,
  draft,
  rules,
  errors,
  onChange,
}: {
  segment: RiskNoticeSegment;
  draft: Draft | undefined;
  rules: RiskSegment["riskRules"];
  errors: Record<string, string>;
  onChange: (segmentId: string, field: keyof Draft, value: string) => void;
}) {
  const editable = segment.status !== "ok";
  const editCapital = segment.reason === "capital_below_minimum";
  const band = rules && draft ? findBand(rules, draft.capital) : null;
  const level =
    band && draft && PERCENT_PATTERN.test(draft.riskPercent)
      ? classifyRisk(band, draft.riskPercent, rules?.ceilingPercent)
      : null;

  const riskHint = () => {
    if (!band || !draft) return undefined;
    const range = `For ${formatInr(draft.capital)}: minimum ${percent(band.minRiskPercent)}, suggested ${percent(band.suggestedRiskPercent)}, maximum ${percent(band.maxRiskPercent)}.`;
    if (!level || level === "below_minimum" || level === "above_ceiling")
      return range;
    return `${range} That is ${formatInr(riskAmount(draft.capital, draft.riskPercent))} ${riskAmountPeriod(segment.riskBasis)}.`;
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-hairline p-4">
      <h2 className="font-display text-[22px] leading-7 font-semibold text-foreground">
        {segment.name}
      </h2>
      <p className="text-base tracking-[-0.24px] text-muted-foreground">
        {STATUS_TEXT[segment.status]}
      </p>

      {segment.bandChanges.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <caption className="pb-2 text-left font-semibold text-foreground">
              What changed (minimum / suggested / maximum)
            </caption>
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-1 pr-3 font-semibold">Capital from</th>
                <th className="py-1 pr-3 font-semibold">Before</th>
                <th className="py-1 font-semibold">Now</th>
              </tr>
            </thead>
            <tbody>
              {segment.bandChanges.map((change) => (
                <tr
                  key={change.capitalFrom}
                  className="border-t border-hairline"
                >
                  <td className="py-1.5 pr-3">
                    {formatInr(change.capitalFrom)}
                  </td>
                  <td className="py-1.5 pr-3">{bandValues(change.before)}</td>
                  <td className="py-1.5 font-semibold">
                    {bandValues(change.after)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {segment.yourBand.after ? (
        <p className="text-sm font-semibold text-subtle">
          Your capital range: {bandRangeLabel(segment.yourBand.after)}
        </p>
      ) : null}

      {editable && draft ? (
        <div className="flex flex-col gap-3">
          {editCapital ? (
            <AffixField
              id={`notice-capital-${segment.code.toLowerCase()}`}
              label="Capital"
              prefix="₹"
              inputMode="decimal"
              autoComplete="off"
              value={draft.capital}
              onChange={(event) =>
                onChange(segment.segmentId, "capital", event.target.value)
              }
              hint={
                rules ? `Minimum ${formatInr(rules.minCapital)}` : undefined
              }
              error={errors[`${segment.segmentId}.capital`]}
            />
          ) : null}
          <AffixField
            id={`notice-risk-${segment.code.toLowerCase()}`}
            label="Risk"
            suffix="%"
            inputMode="decimal"
            autoComplete="off"
            value={draft.riskPercent}
            onChange={(event) =>
              onChange(segment.segmentId, "riskPercent", event.target.value)
            }
            hint={riskHint()}
            error={errors[`${segment.segmentId}.riskPercent`]}
          />
        </div>
      ) : null}
    </section>
  );
}

function bandValues(
  values: RiskNoticeSegment["bandChanges"][number]["before"],
): string {
  if (!values) return "—";
  return `${percent(values.minRiskPercent)} / ${percent(values.suggestedRiskPercent)} / ${percent(values.maxRiskPercent)}`;
}
