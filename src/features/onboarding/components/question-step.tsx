import type { FormEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";

export interface StepProgress {
  /** 1-based position of this question. */
  current: number;
  total: number;
}

interface QuestionStepProps {
  progress: StepProgress;
  title: string;
  description: string;
  children: ReactNode;
  onSubmit: () => void;
  /** Omit on the first question: there is nothing to go back to. */
  onBack?: () => void;
  submitLabel?: string;
  submitting?: boolean;
  errorMessage?: string | null;
}

/**
 * The frame every onboarding question shares: progress badge, title,
 * description, the answer area, and Back / Next.
 */
export function QuestionStep({
  progress,
  title,
  description,
  children,
  onSubmit,
  onBack,
  submitLabel = "Next",
  submitting = false,
  errorMessage,
}: QuestionStepProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex w-full flex-col gap-6"
    >
      <header className="flex w-full flex-col items-start gap-2 font-semibold">
        <span className="rounded-[34px] bg-brand-gradient-badge px-4 py-2 text-base tracking-[-0.24px]">
          <span className="text-brand-gradient">
            Questions {progress.current}/{progress.total}
          </span>
        </span>
        <h1 className="max-w-[512px] font-display text-[36px] leading-[1.2] text-foreground sm:text-[47px]">
          {title}
        </h1>
        <p className="text-lg tracking-[-0.27px] text-muted-foreground">
          {description}
        </p>
      </header>

      {children}

      <FormAlert message={errorMessage} />

      <div className="flex w-full items-center justify-end gap-2">
        {onBack ? (
          <Button
            variant="ghost"
            className="w-auto px-[17px]"
            onClick={onBack}
            disabled={submitting}
          >
            Back
          </Button>
        ) : null}
        <Button type="submit" className="w-auto px-8" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
