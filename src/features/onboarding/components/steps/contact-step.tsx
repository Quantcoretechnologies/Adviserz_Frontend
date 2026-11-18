"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { OtpField, ResendCode } from "@/components/ui/otp-field";
import { PhoneField } from "@/components/ui/phone-field";
import { TextField } from "@/components/ui/text-field";
import { OTP_LENGTH } from "@/features/auth/constants";
import { getErrorMessage } from "@/lib/api";
import { formatIndianPhone } from "@/lib/utils/format";
import { emailSchema, phoneSchema } from "@/lib/validation/contact";
import type { ContactInput } from "../../api/onboarding.api";
import {
  useSendContactOtp,
  useVerifyContact,
} from "../../hooks/use-onboarding";
import type { StepProps } from "../../lib/steps";
import { QuestionStep } from "../question-step";

const COPY = {
  email: {
    title: "What's your email address?",
    description: "We'll send a code to confirm it's yours.",
  },
  phone: {
    title: "What's your phone number?",
    description: "We'll text a code to confirm it's yours.",
  },
} as const;

const contactSchema = {
  email: z.object({ value: emailSchema }),
  phone: z.object({ value: phoneSchema }),
} as const;

/** A code that has been sent and is waiting to be entered. */
interface PendingCode {
  contact: ContactInput;
  /** Formatted for display, e.g. "+91 98765-43210". */
  destination: string;
  verificationId: string;
  /** Epoch milliseconds. */
  resendAvailableAt: number;
}

interface ContactStepProps extends StepProps {
  /** The contact the account is missing. */
  kind: "email" | "phone";
}

/**
 * First question: add and verify the contact the account was not created
 * with. Two phases: enter the contact, then enter the code sent to it.
 */
export function ContactStep({ kind, progress, onDone }: ContactStepProps) {
  const [pending, setPending] = useState<PendingCode | null>(null);
  const sendOtp = useSendContactOtp();

  const send = (value: string) => {
    const contact: ContactInput =
      kind === "email" ? { email: value } : { phone: value };
    sendOtp.mutate(contact, {
      onSuccess: (issued) =>
        setPending({
          contact,
          destination: kind === "email" ? value : formatIndianPhone(value),
          verificationId: issued.verificationId,
          resendAvailableAt: Date.parse(issued.resendAvailableAt),
        }),
    });
  };

  if (pending) {
    return (
      <ContactCode
        kind={kind}
        pending={pending}
        progress={progress}
        resending={sendOtp.isPending}
        resendError={sendOtp.error && getErrorMessage(sendOtp.error)}
        onResend={() =>
          send(
            "email" in pending.contact
              ? pending.contact.email
              : pending.contact.phone,
          )
        }
        onBack={() => {
          sendOtp.reset();
          setPending(null);
        }}
        onDone={onDone}
      />
    );
  }

  return (
    <ContactEntry
      kind={kind}
      progress={progress}
      sending={sendOtp.isPending}
      errorMessage={sendOtp.error && getErrorMessage(sendOtp.error)}
      onSubmit={send}
    />
  );
}

interface ContactEntryProps {
  kind: "email" | "phone";
  progress: StepProps["progress"];
  sending: boolean;
  errorMessage?: string | null;
  onSubmit: (value: string) => void;
}

function ContactEntry({
  kind,
  progress,
  sending,
  errorMessage,
  onSubmit,
}: ContactEntryProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ value: string }>({
    resolver: zodResolver(contactSchema[kind]),
    defaultValues: { value: "" },
  });

  return (
    <QuestionStep
      progress={progress}
      title={COPY[kind].title}
      description={COPY[kind].description}
      onSubmit={handleSubmit(({ value }) => onSubmit(value))}
      submitting={sending}
      errorMessage={errorMessage}
    >
      {kind === "email" ? (
        <TextField
          id="onboarding-email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="Enter your Email"
          error={errors.value?.message}
          {...register("value")}
        />
      ) : (
        <Controller
          control={control}
          name="value"
          render={({ field, fieldState }) => (
            <PhoneField
              id="onboarding-phone"
              label="Phone number"
              error={fieldState.error?.message}
              {...field}
            />
          )}
        />
      )}
    </QuestionStep>
  );
}

interface ContactCodeProps {
  kind: "email" | "phone";
  pending: PendingCode;
  progress: StepProps["progress"];
  resending: boolean;
  resendError?: string | null;
  onResend: () => void;
  onBack: () => void;
  onDone: () => void;
}

function ContactCode({
  kind,
  pending,
  progress,
  resending,
  resendError,
  onResend,
  onBack,
  onDone,
}: ContactCodeProps) {
  const [code, setCode] = useState("");
  const [incomplete, setIncomplete] = useState(false);
  const verify = useVerifyContact();

  const submit = () => {
    if (code.length < OTP_LENGTH) {
      setIncomplete(true);
      return;
    }
    verify.mutate(
      { verificationId: pending.verificationId, otp: code },
      { onSuccess: onDone },
    );
  };

  return (
    <QuestionStep
      progress={progress}
      title="Enter the code"
      description={`Sent by ${kind === "email" ? "email" : "SMS"} to ${pending.destination}.`}
      onSubmit={submit}
      onBack={onBack}
      submitLabel="Verify"
      submitting={verify.isPending}
      errorMessage={
        (verify.error && getErrorMessage(verify.error)) ?? resendError
      }
    >
      <OtpField
        id="onboarding-otp"
        value={code}
        onChange={(value) => {
          setCode(value);
          setIncomplete(false);
        }}
        length={OTP_LENGTH}
        error={incomplete ? `Enter the ${OTP_LENGTH}-digit code` : undefined}
        disabled={verify.isPending}
      />
      <ResendCode
        availableAt={pending.resendAvailableAt}
        onResend={() => {
          verify.reset();
          onResend();
        }}
        resending={resending}
      />
    </QuestionStep>
  );
}
