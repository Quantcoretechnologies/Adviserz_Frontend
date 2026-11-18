"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getErrorMessage } from "@/lib/api";
import { formatIndianPhone } from "@/lib/utils/format";
import { AUTH_ROUTES, postAuthRoute } from "../constants";
import {
  useCompleteSignup,
  useSendSignupOtp,
} from "../hooks/use-auth-mutations";
import { signupPassword, signupStore } from "../lib/flow-state";
import { OtpForm } from "./otp-form";

/** Signup, step 2: verify the code, which creates the account and signs in. */
export function SignupOtpStep() {
  const router = useRouter();
  const draft = signupStore.useValue();
  const completeSignup = useCompleteSignup();
  const resend = useSendSignupOtp();

  useEffect(() => {
    // Read storage directly: the hook value is null while the page hydrates.
    const stored = signupStore.get();
    // An email signup also needs its password, which does not survive a reload.
    const passwordLost = stored?.method === "email" && !signupPassword.get();
    if (!stored || passwordLost) router.replace(AUTH_ROUTES.signup);
  }, [router]);

  if (!draft) return null;

  const error = completeSignup.error ?? resend.error;
  const description =
    draft.method === "phone"
      ? `Sent by SMS to ${formatIndianPhone(draft.phone)}.`
      : `Sent by email to ${draft.email}.`;

  return (
    <OtpForm
      description={description}
      resendAvailableAt={draft.resendAvailableAt}
      verifying={completeSignup.isPending}
      resending={resend.isPending}
      errorMessage={error && getErrorMessage(error)}
      onVerify={(otp) => {
        resend.reset();
        completeSignup.mutate(
          { draft, otp, password: signupPassword.get() },
          {
            onSuccess: (data) => {
              router.replace(postAuthRoute(data.nextAction));
              signupStore.clear();
              signupPassword.clear();
            },
          },
        );
      }}
      onResend={() => {
        completeSignup.reset();
        resend.mutate(
          draft.method === "phone"
            ? { phone: draft.phone }
            : { email: draft.email },
          {
            onSuccess: (issued) => {
              // A new code replaces the old one, including any token from it.
              signupStore.set({
                ...draft,
                verificationToken: undefined,
                verificationId: issued.verificationId,
                resendAvailableAt: Date.parse(issued.resendAvailableAt),
              });
            },
          },
        );
      }}
    />
  );
}
