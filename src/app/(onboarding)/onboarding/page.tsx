import type { Metadata } from "next";
import { OnboardingFlow } from "@/features/onboarding/components/onboarding-flow";

export const metadata: Metadata = { title: "Set up your account" };

export default function Page() {
  return <OnboardingFlow />;
}
