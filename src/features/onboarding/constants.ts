import type { MarketExperience } from "./api/onboarding.api";

export const EXPERIENCE_OPTIONS = [
  {
    value: "new",
    title: "New to trading",
    description: "Less than 6 months",
  },
  {
    value: "beginner",
    title: "Beginner",
    description: "6 months - 2 years",
  },
  {
    value: "intermediate",
    title: "Intermediate",
    description: "2 - 5 years",
  },
  {
    value: "experienced",
    title: "Experienced",
    description: "5+ years, active in F&O",
  },
] as const satisfies readonly {
  value: MarketExperience;
  title: string;
  description: string;
}[];

export function experienceLabel(value: MarketExperience): string {
  const option = EXPERIENCE_OPTIONS.find((item) => item.value === value);
  return option ? `${option.title} (${option.description})` : value;
}
