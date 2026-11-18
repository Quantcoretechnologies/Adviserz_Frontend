"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getErrorMessage } from "@/lib/api";
import { AUTH_ROUTES } from "../constants";
import {
  useRequestPasswordReset,
  useVerifyPasswordResetOtp,
} from "../hooks/use-auth-mutations";
import { passwordResetStore } from "../lib/flow-state";
import { OtpForm } from "./otp-form";

/** Password reset, step 2: verify the emailed code. */
export function PasswordResetOtpStep() {
  const router = useRouter();
  const reset = passwordResetStore.useValue();
  const verifyOtp = useVerifyPasswordResetOtp();
  const resend = useRequestPasswordReset();

  useEffect(() => {
    // Read storage directly: the hook value is null while the page hydrates.
    if (!passwordResetStore.get()) router.replace(AUTH_ROUTES.forgotPassword);
  }, [router]);

  if (!reset) return null;

  const error = verifyOtp.error ?? resend.error;

  return (
    <OtpForm
      description={`Sent by email to ${reset.email}.`}
      resendAvailableAt={reset.resendAvailableAt}
      verifying={verifyOtp.isPending}
      resending={resend.isPending}
      errorMessage={error && getErrorMessage(error)}
      onVerify={(otp) => {
        resend.reset();
        verifyOtp.mutate(
          { verificationId: reset.verificationId, otp },
          {
            onSuccess: ({ resetToken }) => {
              passwordResetStore.set({ ...reset, resetToken });
              router.push(AUTH_ROUTES.forgotPasswordReset);
            },
          },
        );
      }}
      onResend={() => {
        verifyOtp.reset();
        resend.mutate(reset.email, {
          onSuccess: (issued) =>
            passwordResetStore.set({
              email: reset.email,
              verificationId: issued.verificationId,
              resendAvailableAt: Date.parse(issued.resendAvailableAt),
            }),
        });
      }}
    />
  );
}
