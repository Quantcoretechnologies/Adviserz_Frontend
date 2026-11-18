"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { OtpField, ResendCode } from "@/components/ui/otp-field";
import { OTP_LENGTH } from "../constants";
import { AuthHeading } from "./auth-heading";

interface OtpFormProps {
  /** e.g. "Sent by SMS to +91 98765-43210." */
  description: string;
  /** Epoch milliseconds after which the code may be resent. */
  resendAvailableAt: number;
  onVerify: (code: string) => void;
  onResend: () => void;
  verifying?: boolean;
  resending?: boolean;
  /** Error from the verify or resend request. */
  errorMessage?: string | null;
}

/**
 * The "Enter the code" screen. Purely presentational: every flow (login,
 * signup, password reset) supplies its own verify and resend behaviour.
 */
export function OtpForm({
  description,
  resendAvailableAt,
  onVerify,
  onResend,
  verifying = false,
  resending = false,
  errorMessage,
}: OtpFormProps) {
  const [code, setCode] = useState("");
  const [incomplete, setIncomplete] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (code.length < OTP_LENGTH) {
      setIncomplete(true);
      return;
    }
    onVerify(code);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex w-full flex-col gap-6"
    >
      <AuthHeading title="Enter the code" description={description} />
      <OtpField
        id="otp"
        value={code}
        onChange={(value) => {
          setCode(value);
          setIncomplete(false);
        }}
        length={OTP_LENGTH}
        error={incomplete ? `Enter the ${OTP_LENGTH}-digit code` : undefined}
        disabled={verifying}
      />
      <ResendCode
        availableAt={resendAvailableAt}
        onResend={onResend}
        resending={resending}
      />
      <FormAlert message={errorMessage} />
      <Button type="submit" loading={verifying}>
        Verify
      </Button>
    </form>
  );
}
