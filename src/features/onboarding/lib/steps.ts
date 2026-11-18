import { isApiError } from "@/lib/api";
import type {
  OnboardingState,
  OnboardingStep,
  SegmentErrorDetail,
} from "../api/onboarding.api";
import type { StepProgress } from "../components/question-step";

/**
 * The questions the user actually sees, in order. The API also tracks a
 * `broker` step; it has no screen yet and is recorded as skipped for them.
 */
export const SCREEN_STEPS = [
  "contact",
  "segments",
  "experience",
  "capital",
  "risk",
  "policies",
  "confirm",
] as const satisfies readonly OnboardingStep[];

export type ScreenStep = (typeof SCREEN_STEPS)[number];

/** Props every step screen receives from the flow. */
export interface StepProps {
  state: OnboardingState;
  progress: StepProgress;
  /** Absent on the first question. */
  onBack?: () => void;
  /** Call once the step has been saved. */
  onDone: () => void;
}

/** The screen to open for the API's `nextStep`. */
export function screenFor(nextStep: OnboardingStep | null): ScreenStep {
  if (nextStep === null) return "confirm";
  return nextStep === "broker" ? "policies" : nextStep;
}

/**
 * Per-segment messages from a rejected capital or risk save, keyed by segment
 * id, so each can be shown under its own field.
 */
export function segmentErrors(error: unknown): Record<string, string> {
  if (!isApiError(error) || !Array.isArray(error.details)) return {};
  const messages: Record<string, string> = {};
  for (const detail of error.details as SegmentErrorDetail[]) {
    if (detail.segmentId) messages[detail.segmentId] = detail.message;
  }
  return messages;
}
