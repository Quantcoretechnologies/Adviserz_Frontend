"use client";

import { useState } from "react";
import { FieldError } from "@/components/ui/field";
import { OptionCard } from "@/components/ui/option-card";
import { getErrorMessage } from "@/lib/api";
import type { MarketExperience } from "../../api/onboarding.api";
import { EXPERIENCE_OPTIONS } from "../../constants";
import { useSaveExperience } from "../../hooks/use-onboarding";
import type { StepProps } from "../../lib/steps";
import { QuestionStep } from "../question-step";

/** How long the user has been trading. One answer. */
export function ExperienceStep({ state, progress, onBack, onDone }: StepProps) {
  const [selected, setSelected] = useState<MarketExperience | null>(
    state.draft?.marketExperience ?? null,
  );
  const [showRequired, setShowRequired] = useState(false);
  const save = useSaveExperience();

  const submit = () => {
    if (!selected) {
      setShowRequired(true);
      return;
    }
    save.mutate(selected, { onSuccess: onDone });
  };

  return (
    <QuestionStep
      progress={progress}
      title="How long have you been trading?"
      description="Stocks, F&O or both count whichever is longest."
      onSubmit={submit}
      onBack={onBack}
      submitting={save.isPending}
      errorMessage={save.error && getErrorMessage(save.error)}
    >
      <div
        role="radiogroup"
        aria-label="Trading experience"
        className="flex w-full flex-col gap-3"
      >
        {EXPERIENCE_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            role="radio"
            title={option.title}
            description={option.description}
            selected={selected === option.value}
            onSelect={() => {
              setSelected(option.value);
              setShowRequired(false);
            }}
          />
        ))}
        <FieldError
          id="experience-error"
          message={showRequired ? "Choose one option" : undefined}
        />
      </div>
    </QuestionStep>
  );
}
