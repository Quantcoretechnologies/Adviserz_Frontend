"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { ROUTES } from "@/config/routes";
import { getErrorMessage } from "@/lib/api";
import type { OnboardingState } from "../api/onboarding.api";
import { useOnboardingState, useSkipBroker } from "../hooks/use-onboarding";
import {
  SCREEN_STEPS,
  screenFor,
  type ScreenStep,
  type StepProps,
} from "../lib/steps";
import { CapitalStep } from "./steps/capital-step";
import { ContactStep } from "./steps/contact-step";
import { ExperienceStep } from "./steps/experience-step";
import { PoliciesStep } from "./steps/policies-step";
import { ReviewStep } from "./steps/review-step";
import { RiskStep } from "./steps/risk-step";
import { SegmentsStep } from "./steps/segments-step";

/** Loads the onboarding state, then hands over to the step-by-step flow. */
export function OnboardingFlow() {
  const router = useRouter();
  const { data, error, isPending, refetch, isRefetching } =
    useOnboardingState();

  const completed = data?.status === "completed";
  useEffect(() => {
    if (completed) router.replace(ROUTES.home);
  }, [completed, router]);

  if (isPending || completed) return null;

  if (!data) {
    return (
      <div className="flex w-full flex-col gap-6">
        <FormAlert message={getErrorMessage(error)} />
        <Button loading={isRefetching} onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return <OnboardingSteps state={data} />;
}

/**
 * Walks the user through the questions. Starts at the first unfinished one,
 * so a user who left halfway resumes where they stopped.
 */
function OnboardingSteps({ state }: { state: OnboardingState }) {
  // Fixed when the flow opens, so the "n/total" numbering does not change as
  // steps are completed. Accounts that already have both contacts skip it.
  const [steps] = useState<readonly ScreenStep[]>(() =>
    SCREEN_STEPS.filter(
      (step) => step !== "contact" || state.steps?.missingContact != null,
    ),
  );
  const [current, setCurrent] = useState<ScreenStep>(() =>
    screenFor(state.nextStep),
  );

  // The broker step has no screen: record it as skipped as soon as the
  // answers before it are in, so the API does not hold the user there.
  const skipBroker = useSkipBroker();
  const brokerPending = state.steps?.risk === true && !state.steps.broker;
  const { mutate: skip, isIdle: skipNotTried } = skipBroker;
  useEffect(() => {
    if (brokerPending && skipNotTried) skip();
  }, [brokerPending, skipNotTried, skip]);

  const index = Math.max(steps.indexOf(current), 0);
  const previous = steps[index - 1];
  const next = steps[index + 1];

  const stepProps: StepProps = {
    state,
    progress: { current: index + 1, total: steps.length },
    // A verified contact cannot be changed here, so there is no way back to it.
    onBack:
      previous && previous !== "contact"
        ? () => setCurrent(previous)
        : undefined,
    onDone: () => {
      if (next) setCurrent(next);
    },
  };

  switch (steps[index]) {
    case "contact":
      return state.steps?.missingContact ? (
        <ContactStep kind={state.steps.missingContact} {...stepProps} />
      ) : null;
    case "segments":
      return <SegmentsStep {...stepProps} />;
    case "experience":
      return <ExperienceStep {...stepProps} />;
    case "capital":
      return <CapitalStep {...stepProps} />;
    case "risk":
      return <RiskStep {...stepProps} />;
    case "policies":
      return <PoliciesStep {...stepProps} />;
    default:
      return <ReviewStep {...stepProps} />;
  }
}
