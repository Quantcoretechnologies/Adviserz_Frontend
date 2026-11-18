"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getErrorMessage } from "@/lib/api";
import { formatIndianPhone } from "@/lib/utils/format";
import { AUTH_ROUTES, postAuthRoute } from "../constants";
import { useLoginWithOtp, useSendLoginOtp } from "../hooks/use-auth-mutations";
import { loginOtpStore } from "../lib/flow-state";
import { OtpForm } from "./otp-form";

/** Phone login, step 2: enter the texted code to sign in. */
export function LoginOtpStep() {
  const router = useRouter();
  const pending = loginOtpStore.useValue();
  const loginWithOtp = useLoginWithOtp();
  const resend = useSendLoginOtp();

  useEffect(() => {
    // Read storage directly: the hook value is null while the page hydrates.
    if (!loginOtpStore.get()) router.replace(AUTH_ROUTES.login);
  }, [router]);

  if (!pending) return null;

  const error = loginWithOtp.error ?? resend.error;

  return (
    <OtpForm
      description={`Sent by SMS to ${formatIndianPhone(pending.phone)}.`}
      resendAvailableAt={pending.resendAvailableAt}
      verifying={loginWithOtp.isPending}
      resending={resend.isPending}
      errorMessage={error && getErrorMessage(error)}
      onVerify={(otp) => {
        resend.reset();
        loginWithOtp.mutate(
          { verificationId: pending.verificationId, otp },
          {
            onSuccess: (data) => {
              router.replace(postAuthRoute(data.nextAction));
              loginOtpStore.clear();
            },
          },
        );
      }}
      onResend={() => {
        loginWithOtp.reset();
        resend.mutate(pending.phone, {
          onSuccess: (issued) =>
            loginOtpStore.set({
              phone: pending.phone,
              verificationId: issued.verificationId,
              resendAvailableAt: Date.parse(issued.resendAvailableAt),
            }),
        });
      }}
    />
  );
}
