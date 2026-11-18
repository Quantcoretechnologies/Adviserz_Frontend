"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ROUTES } from "@/config/routes";
import { getErrorMessage } from "@/lib/api";
import { formatInr, trimDecimal } from "@/lib/utils/format";
import { experienceLabel } from "../../constants";
import { useConfirmOnboarding } from "../../hooks/use-onboarding";
import type { StepProps } from "../../lib/steps";
import { QuestionStep } from "../question-step";

/** Last step: show everything that was entered, then activate the profile. */
export function ReviewStep({ state, progress, onBack }: StepProps) {
  const router = useRouter();
  const confirm = useConfirmOnboarding();
  const draft = state.draft;

  const submit = () => {
    confirm.mutate(undefined, {
      onSuccess: () => router.replace(ROUTES.home),
    });
  };

  return (
    <QuestionStep
      progress={progress}
      title="Check your answers"
      description="You can change your risk profile later from your profile."
      onSubmit={submit}
      onBack={onBack}
      submitLabel="Start using Adviserz"
      submitting={confirm.isPending}
      errorMessage={confirm.error && getErrorMessage(confirm.error)}
    >
      <dl className="flex w-full flex-col gap-3 text-base font-semibold">
        <ReviewItem label="Trading experience">
          {draft?.marketExperience
            ? experienceLabel(draft.marketExperience)
            : "Not answered"}
        </ReviewItem>
        {draft?.segments.map((segment) => (
          <ReviewItem key={segment.segmentId} label={segment.name ?? "Segment"}>
            {segment.capital ? formatInr(segment.capital) : "No capital"}
            {" · "}
            {segment.riskPercent
              ? `${trimDecimal(segment.riskPercent)}% risk`
              : "No risk set"}
          </ReviewItem>
        ))}
        {draft?.totalCapital ? (
          <ReviewItem label="Total trading capital">
            {formatInr(draft.totalCapital)}
          </ReviewItem>
        ) : null}
        <ReviewItem label="Policies">
          {state.policies.map((policy) => policy.title).join(", ")} accepted
        </ReviewItem>
      </dl>
    </QuestionStep>
  );
}

function ReviewItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-1 rounded-xl bg-surface-subtle px-4 py-[18px]">
      <dt className="font-display text-foreground">{label}</dt>
      <dd className="tracking-[-0.24px] text-muted-foreground">{children}</dd>
    </div>
  );
}
