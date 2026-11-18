"use client";

import { useCountdown } from "@/hooks/use-countdown";
import { formatClock } from "@/lib/utils/format";
import { FieldError } from "./field";
import { OtpInput } from "./otp-input";

interface OtpFieldProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  length: number;
  error?: string;
  disabled?: boolean;
}

/** Labelled one-time-code input with its validation message. */
export function OtpField({
  id,
  label = "Enter OTP",
  value,
  onChange,
  length,
  error,
  disabled,
}: OtpFieldProps) {
  return (
    <div className="flex w-full flex-col gap-3">
      <span
        id={`${id}-label`}
        className="font-display text-base font-semibold text-foreground"
      >
        {label}
      </span>
      <OtpInput
        id={id}
        value={value}
        onChange={onChange}
        length={length}
        error={error}
        disabled={disabled}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

interface ResendCodeProps {
  /** Epoch milliseconds after which a new code may be requested. */
  availableAt: number;
  onResend: () => void;
  resending?: boolean;
}

/** "Didn't get it?" row: a countdown that turns into a Resend button. */
export function ResendCode({
  availableAt,
  onResend,
  resending = false,
}: ResendCodeProps) {
  const secondsLeft = useCountdown(availableAt);

  return (
    <div className="flex w-full items-start justify-between text-base font-semibold tracking-[-0.24px]">
      <span className="text-subtle">Didn’t get it?</span>
      {secondsLeft > 0 ? (
        <span className="text-brand-gradient">
          Resend in {formatClock(secondsLeft)}
        </span>
      ) : (
        <button
          type="button"
          onClick={onResend}
          disabled={resending}
          className="cursor-pointer text-brand-gradient hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          Resend code
        </button>
      )}
    </div>
  );
}
