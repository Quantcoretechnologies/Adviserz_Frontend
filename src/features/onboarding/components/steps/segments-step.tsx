"use client";

import { useState } from "react";
import { FieldError } from "@/components/ui/field";
import { OptionCard } from "@/components/ui/option-card";
import { getErrorMessage } from "@/lib/api";
import { formatInr } from "@/lib/utils/format";
import { useSaveSegments } from "../../hooks/use-onboarding";
import type { StepProps } from "../../lib/steps";
import { QuestionStep } from "../question-step";

/** Which market segments the user trades. Several may be chosen. */
export function SegmentsStep({ state, progress, onBack, onDone }: StepProps) {
  const [selected, setSelected] = useState<string[]>(
    () => state.draft?.segments.map((segment) => segment.segmentId) ?? [],
  );
  const [showRequired, setShowRequired] = useState(false);
  const save = useSaveSegments();

  const toggle = (id: string) => {
    setShowRequired(false);
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const submit = () => {
    if (selected.length === 0) {
      setShowRequired(true);
      return;
    }
    save.mutate(selected, { onSuccess: onDone });
  };

  return (
    <QuestionStep
      progress={progress}
      title="Which segments do you trade?"
      description="Choose every segment you want advice for."
      onSubmit={submit}
      onBack={onBack}
      submitting={save.isPending}
      errorMessage={save.error && getErrorMessage(save.error)}
    >
      <div
        role="group"
        aria-label="Trading segments"
        className="flex w-full flex-col gap-3"
      >
        {state.availableSegments.map((segment) => (
          <OptionCard
            key={segment.id}
            role="checkbox"
            title={segment.name}
            description={
              segment.description ??
              `Minimum capital ${formatInr(segment.minCapital ?? "0")}`
            }
            selected={selected.includes(segment.id)}
            onSelect={() => toggle(segment.id)}
          />
        ))}
        <FieldError
          id="segments-error"
          message={showRequired ? "Choose at least one segment" : undefined}
        />
      </div>
    </QuestionStep>
  );
}
