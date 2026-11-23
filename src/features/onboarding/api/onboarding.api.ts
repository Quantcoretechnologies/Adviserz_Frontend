import type {
  OtpIssued,
  VerifyOtpRequest,
} from "@/features/auth/api/auth.types";
import type { AuthUser } from "@/features/auth/api/auth.types";
import type {
  Acknowledgement,
  RiskLevel,
  RiskRules,
} from "@/features/risk/api/risk.types";
import { authedApi } from "@/lib/api";

/** The steps the API tracks, in order. `confirm` is the final review. */
export type OnboardingStep =
  | "contact"
  | "segments"
  | "experience"
  | "capital"
  | "risk"
  | "broker"
  | "policies"
  | "confirm";

export type MarketExperience =
  "new" | "beginner" | "intermediate" | "experienced";

/**
 * A trading segment the user can choose, with the capital bands an admin has
 * set: each band has a minimum, suggested and maximum risk %. Decimals are
 * strings.
 */
export interface Segment {
  id: string;
  code: string;
  name: string;
  description: string | null;
  /** What the risk percentage is measured against. */
  riskBasis: "total_capital" | "daily_loss";
  /** The first band's capital; null only if no bands are set (such segments are not offered). */
  minCapital: string | null;
  currency: string;
  riskRules: RiskRules | null;
}

/** One chosen segment in the draft risk profile. */
export interface DraftSegment {
  segmentId: string;
  code: string | null;
  name: string | null;
  riskBasis: Segment["riskBasis"];
  currency: string;
  capital: string | null;
  riskPercent: string | null;
}

export interface OnboardingPolicy {
  id: string;
  type: "terms_and_conditions" | "risk_policy";
  version: number;
  title: string;
  content: string;
  accepted: boolean;
}

export interface OnboardingState {
  status: "pending" | "completed";
  /** The first step that is not done yet; `null` once onboarding is complete. */
  nextStep: OnboardingStep | null;
  /** `null` once onboarding is complete. */
  steps: {
    contact: boolean;
    segments: boolean;
    experience: boolean;
    capital: boolean;
    risk: boolean;
    broker: boolean;
    policies: boolean;
    /** The contact the account still has to verify, if any. */
    missingContact: "email" | "phone" | null;
  } | null;
  /** `null` until the first answer is saved. */
  draft: {
    marketExperience: MarketExperience | null;
    segments: DraftSegment[];
    totalCapital: string | null;
  } | null;
  /** Per chosen segment: do capital and risk fit the bands in force, and is any needed disclaimer accepted. */
  segmentChecks: SegmentCheck[];
  availableSegments: Segment[];
  policies: OnboardingPolicy[];
}

export interface SegmentCheck {
  segmentId: string;
  capitalOk: boolean;
  riskOk: boolean;
  level: RiskLevel | null;
  acknowledgementRequired: "above_suggested" | "above_maximum" | null;
  /** True when no disclaimer is needed or the one needed was accepted for these exact values. */
  acknowledged: boolean;
  riskAmount: string | null;
}

export type ContactInput = { email: string } | { phone: string };

export interface CapitalAllocation {
  segmentId: string;
  capital: string;
}

export interface RiskAllocation {
  segmentId: string;
  riskPercent: string;
  /** Required when the risk is above the suggested level. */
  acknowledgement?: Acknowledgement;
}

/** One problem the API found with a per-segment value. */
export interface SegmentErrorDetail {
  segmentId?: string;
  message: string;
}

/**
 * Raw calls to the onboarding endpoints. Every mutation except the code
 * request returns the full, updated state.
 */
export const onboardingApi = {
  getState: () => authedApi.get<OnboardingState>("/onboarding"),

  sendContactOtp: (contact: ContactInput) =>
    authedApi.post<OtpIssued>("/onboarding/contact/send-otp", contact),

  verifyContact: (body: VerifyOtpRequest) =>
    authedApi.post<OnboardingState>("/onboarding/contact/verify", body),

  saveSegments: (segmentIds: string[]) =>
    authedApi.put<OnboardingState>("/onboarding/segments", { segmentIds }),

  saveExperience: (marketExperience: MarketExperience) =>
    authedApi.put<OnboardingState>("/onboarding/experience", {
      marketExperience,
    }),

  saveCapital: (allocations: CapitalAllocation[]) =>
    authedApi.put<OnboardingState>("/onboarding/capital", { allocations }),

  saveRisk: (allocations: RiskAllocation[]) =>
    authedApi.put<OnboardingState>("/onboarding/risk", { allocations }),

  skipBroker: () => authedApi.post<OnboardingState>("/onboarding/broker/skip"),

  acceptPolicies: (policyDocumentIds: string[]) =>
    authedApi.post<OnboardingState>("/onboarding/policies/accept", {
      policyDocumentIds,
    }),

  confirm: () => authedApi.post<{ user: AuthUser }>("/onboarding/confirm"),
};

export const onboardingKeys = {
  state: ["onboarding", "state"] as const,
};
