"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { getErrorMessage } from "@/lib/api";
import { useAcceptPolicies } from "../../hooks/use-onboarding";
import type { StepProps } from "../../lib/steps";
import { QuestionStep } from "../question-step";

/** Read and accept the current Terms & Conditions and Risk Policy. */
export function PoliciesStep({ state, progress, onBack, onDone }: StepProps) {
  const [accepted, setAccepted] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      state.policies.map((policy) => [policy.id, policy.accepted]),
    ),
  );
  const [showRequired, setShowRequired] = useState(false);
  const accept = useAcceptPolicies();

  const submit = () => {
    if (state.policies.some((policy) => !accepted[policy.id])) {
      setShowRequired(true);
      return;
    }
    // Only what the server has not recorded yet needs to be sent.
    const pending = state.policies
      .filter((policy) => !policy.accepted)
      .map((policy) => policy.id);
    if (pending.length === 0) {
      onDone();
      return;
    }
    accept.mutate(pending, { onSuccess: onDone });
  };

  return (
    <QuestionStep
      progress={progress}
      title="Review and accept our policies"
      description="Please read each one before you accept it."
      onSubmit={submit}
      onBack={onBack}
      submitting={accept.isPending}
      errorMessage={accept.error && getErrorMessage(accept.error)}
    >
      <div className="flex w-full flex-col gap-3">
        {state.policies.map((policy) => (
          <section
            key={policy.id}
            className="flex w-full flex-col gap-3 rounded-xl bg-surface-subtle px-4 py-[18px]"
          >
            <div className="flex flex-col gap-1 text-base font-semibold">
              <h2 className="font-display text-foreground">{policy.title}</h2>
              <p className="tracking-[-0.24px] text-muted-foreground">
                Version {policy.version}
              </p>
            </div>
            <details className="group text-base font-semibold">
              <summary className="w-fit cursor-pointer list-none text-brand-gradient tracking-[-0.24px] hover:underline">
                <span className="group-open:hidden">Read the policy</span>
                <span className="hidden group-open:inline">
                  Hide the policy
                </span>
              </summary>
              <div className="mt-3 max-h-60 overflow-y-auto rounded-lg bg-background p-4 text-sm leading-relaxed font-normal whitespace-pre-wrap text-muted-foreground">
                {policy.content}
              </div>
            </details>
            <Checkbox
              id={`policy-${policy.type}`}
              checked={accepted[policy.id] ?? false}
              onChange={(event) => {
                setAccepted((current) => ({
                  ...current,
                  [policy.id]: event.target.checked,
                }));
                setShowRequired(false);
              }}
              error={
                showRequired && !accepted[policy.id]
                  ? "Please accept this policy to continue"
                  : undefined
              }
            >
              I have read and accept the {policy.title}
            </Checkbox>
          </section>
        ))}
      </div>
    </QuestionStep>
  );
}
