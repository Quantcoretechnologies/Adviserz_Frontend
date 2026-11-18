import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/api";
import { authSession } from "@/lib/auth/session";
import { authApi, authKeys } from "../api/auth.api";
import type {
  LoginRequest,
  OtpIssued,
  ResetPasswordRequest,
  ResetTokenIssued,
  SignedInResponse,
  SignupContact,
  VerifyOtpRequest,
} from "../api/auth.types";
import { signupStore, type SignupDraft } from "../lib/flow-state";

/** Store the new session; shared by every mutation that signs a user in. */
function useStartSession() {
  const queryClient = useQueryClient();
  return (data: SignedInResponse) => {
    authSession.set(data);
    queryClient.removeQueries({ queryKey: authKeys.currentUser });
  };
}

// --- Sign in -----------------------------------------------------------------

/** Sign in with email and password. */
export function useLogin() {
  const startSession = useStartSession();
  return useMutation<SignedInResponse, ApiError, LoginRequest>({
    mutationFn: authApi.login,
    onSuccess: startSession,
  });
}

/** Phone login, step 1: text a sign-in code to the number. */
export function useSendLoginOtp() {
  return useMutation<OtpIssued, ApiError, string>({
    mutationFn: authApi.sendLoginOtp,
  });
}

/** Phone login, step 2: sign in with the code. */
export function useLoginWithOtp() {
  const startSession = useStartSession();
  return useMutation<SignedInResponse, ApiError, VerifyOtpRequest>({
    mutationFn: authApi.loginWithOtp,
    onSuccess: startSession,
  });
}

// --- Sign up -----------------------------------------------------------------

/** Signup, step 1: send a code to the phone or email being registered. */
export function useSendSignupOtp() {
  return useMutation<OtpIssued, ApiError, SignupContact>({
    mutationFn: authApi.sendSignupOtp,
  });
}

interface CompleteSignupInput {
  draft: SignupDraft;
  otp: string;
  /** Required when `draft.method` is "email". */
  password: string | null;
}

/**
 * Signup, step 2: verify the code, then create the account and sign in.
 *
 * A code can be verified only once. If verification succeeds but account
 * creation fails, the resulting token is kept on the draft so that pressing
 * Verify again retries the creation instead of re-checking a spent code.
 */
export function useCompleteSignup() {
  const startSession = useStartSession();
  return useMutation<SignedInResponse, ApiError, CompleteSignupInput>({
    mutationFn: async ({ draft, otp, password }) => {
      let verificationToken = draft.verificationToken;
      if (!verificationToken) {
        const verified = await authApi.verifySignupOtp({
          verificationId: draft.verificationId,
          otp,
        });
        verificationToken = verified.verificationToken;
        signupStore.set({ ...draft, verificationToken });
      }

      return draft.method === "phone"
        ? authApi.signup({
            method: "phone",
            fullName: draft.fullName,
            phone: draft.phone,
            verificationToken,
          })
        : authApi.signup({
            method: "email",
            fullName: draft.fullName,
            email: draft.email,
            password: password ?? "",
            verificationToken,
          });
    },
    onSuccess: startSession,
  });
}

// --- Password reset ----------------------------------------------------------

/** Password reset, step 1: email the user a code. */
export function useRequestPasswordReset() {
  return useMutation<OtpIssued, ApiError, string>({
    mutationFn: authApi.requestPasswordReset,
  });
}

/** Password reset, step 2: exchange the code for a reset token. */
export function useVerifyPasswordResetOtp() {
  return useMutation<ResetTokenIssued, ApiError, VerifyOtpRequest>({
    mutationFn: authApi.verifyPasswordResetOtp,
  });
}

/** Password reset, step 3: set the new password. */
export function useResetPassword() {
  return useMutation<null, ApiError, ResetPasswordRequest>({
    mutationFn: authApi.resetPassword,
  });
}
