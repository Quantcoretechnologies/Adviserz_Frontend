import { createSessionStore } from "@/lib/storage/session-store";

/**
 * State carried between the pages of a multi-step auth flow. Kept in
 * sessionStorage (not the URL) so phone numbers, emails and tokens never
 * appear in browser history or server logs. Passwords are never stored here.
 */

/** Phone login: the number a sign-in code was sent to. */
export interface LoginOtp {
  /** Ten national digits. */
  phone: string;
  verificationId: string;
  /** Epoch milliseconds. */
  resendAvailableAt: number;
}

export const loginOtpStore = createSessionStore<LoginOtp>("adz.auth.login-otp");

/** Signup: the form the user filled in, waiting for its contact to be verified. */
export type SignupDraft = {
  fullName: string;
  verificationId: string;
  /** Epoch milliseconds. */
  resendAvailableAt: number;
  /** Present once the code has been verified, so a retry does not need a new code. */
  verificationToken?: string;
} & ({ method: "phone"; phone: string } | { method: "email"; email: string });

export const signupStore = createSessionStore<SignupDraft>("adz.auth.signup");

/**
 * The password chosen on the email signup form. Held in memory only, for the
 * moment between the form and the code screen: a reload loses it and the user
 * is sent back to the form, which is safer than writing it to storage.
 */
let pendingSignupPassword: string | null = null;

export const signupPassword = {
  get: (): string | null => pendingSignupPassword,
  set: (password: string): void => {
    pendingSignupPassword = password;
  },
  clear: (): void => {
    pendingSignupPassword = null;
  },
};

/** Password reset: the email being recovered and where the flow has got to. */
export interface PasswordReset {
  email: string;
  verificationId: string;
  /** Epoch milliseconds. */
  resendAvailableAt: number;
  /** Present once the emailed code has been verified. */
  resetToken?: string;
}

export const passwordResetStore = createSessionStore<PasswordReset>(
  "adz.auth.password-reset",
);
