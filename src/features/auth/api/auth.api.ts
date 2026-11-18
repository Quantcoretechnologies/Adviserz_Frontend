import { api, authedApi } from "@/lib/api";
import type {
  CurrentUserResponse,
  LoginRequest,
  OtpIssued,
  ResetPasswordRequest,
  ResetTokenIssued,
  SignedInResponse,
  SignupContact,
  SignupRequest,
  VerificationTokenIssued,
  VerifyOtpRequest,
} from "./auth.types";

/**
 * Raw calls to the auth endpoints. Components never call these directly;
 * they go through the TanStack Query hooks in ../hooks.
 */
export const authApi = {
  // --- Sign in ---------------------------------------------------------------
  login: (body: LoginRequest) =>
    api.post<SignedInResponse>("/auth/web/login", body),

  sendLoginOtp: (phone: string) =>
    api.post<OtpIssued>("/auth/login/otp/send", { phone }),

  loginWithOtp: (body: VerifyOtpRequest) =>
    api.post<SignedInResponse>("/auth/web/login/otp", body),

  // --- Sign up ---------------------------------------------------------------
  sendSignupOtp: (contact: SignupContact) =>
    "phone" in contact
      ? api.post<OtpIssued>("/auth/register/phone/send-otp", contact)
      : api.post<OtpIssued>("/auth/register/email/send-otp", contact),

  verifySignupOtp: (body: VerifyOtpRequest) =>
    api.post<VerificationTokenIssued>("/auth/register/verify-otp", body),

  signup: (body: SignupRequest) =>
    api.post<SignedInResponse>("/auth/web/signup", body),

  // --- Password reset --------------------------------------------------------
  requestPasswordReset: (email: string) =>
    api.post<OtpIssued>("/auth/password/forgot", { email }),

  verifyPasswordResetOtp: (body: VerifyOtpRequest) =>
    api.post<ResetTokenIssued>("/auth/password/verify-otp", body),

  resetPassword: (body: ResetPasswordRequest) =>
    api.post<null>("/auth/password/reset", body),

  // --- Session ---------------------------------------------------------------
  currentUser: () => authedApi.get<CurrentUserResponse>("/users/me"),

  logout: (csrfToken: string) =>
    api.post<null>("/auth/web/logout", undefined, { csrfToken }),
};

export const authKeys = {
  currentUser: ["auth", "current-user"] as const,
};
