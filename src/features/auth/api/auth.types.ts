/** Shapes used by the adviserz_be auth endpoints. Dates arrive as ISO strings. */

export interface AuthUser {
  id: string;
  fullName: string;
  /** Not chosen at signup; set later in the profile. */
  username: string | null;
  /** An account starts with one contact; the other is added during onboarding. */
  email: string | null;
  phone: string | null;
  status: string;
  onboardingStatus: "pending" | "completed";
  onboardingCompletedAt: string | null;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

/** What the user must do before using the app; `null` when nothing is pending. */
export type NextAction =
  "onboarding" | "policy_acceptance" | "risk_notice" | null;

/** Returned by every endpoint that signs a user in. */
export interface SignedInResponse {
  tokenType: "Bearer";
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  sessionId: string;
  csrfToken: string;
  user: AuthUser;
  nextAction: NextAction;
}

export interface LoginRequest {
  /** Email address or Indian mobile number. */
  identifier: string;
  password: string;
}

export interface OtpIssued {
  verificationId: string;
  channel: "email" | "sms";
  expiresAt: string;
  resendAvailableAt: string;
}

export interface VerifyOtpRequest {
  verificationId: string;
  otp: string;
}

/** The contact a signup code is sent to. */
export type SignupContact = { phone: string } | { email: string };

export interface VerificationTokenIssued {
  verificationToken: string;
  expiresAt: string;
  channel: "email" | "sms";
}

export type SignupRequest = { fullName: string; verificationToken: string } & (
  | { method: "phone"; phone: string }
  | { method: "email"; email: string; password: string }
);

export interface ResetTokenIssued {
  resetToken: string;
  expiresAt: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CurrentUserResponse {
  user: AuthUser;
  requirements: {
    onboardingRequired: boolean;
    policyAcceptanceRequired: boolean;
    /** Risk limits changed for the user's segments and the notice is not yet accepted. */
    riskNoticeRequired: boolean;
  };
}
