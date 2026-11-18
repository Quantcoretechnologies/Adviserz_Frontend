"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormAlert } from "@/components/ui/form-alert";
import { LabeledDivider } from "@/components/ui/labeled-divider";
import { PhoneField } from "@/components/ui/phone-field";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { TextField } from "@/components/ui/text-field";
import { TextLink } from "@/components/ui/text-link";
import { getErrorMessage } from "@/lib/api";
import {
  AUTH_ROUTES,
  CONTACT_METHOD_OPTIONS,
  type ContactMethod,
} from "../constants";
import { useSendSignupOtp } from "../hooks/use-auth-mutations";
import { signupPassword, signupStore } from "../lib/flow-state";
import {
  emailSignupSchema,
  phoneSignupSchema,
  type EmailSignupValues,
  type PhoneSignupValues,
} from "../schemas/auth.schemas";
import { AuthHeading } from "./auth-heading";
import { AuthSwitchPrompt, GoogleButton, LegalConsentText } from "./auth-parts";

const loginPrompt = (
  <AuthSwitchPrompt
    prompt="Already have an account?"
    linkLabel="Log In"
    href={AUTH_ROUTES.login}
  />
);

export function SignupForm() {
  const [method, setMethod] = useState<ContactMethod>("phone");

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <AuthHeading
        title="Create your account"
        description="Start building a more informed investing habit."
      />
      <SegmentedTabs
        label="Sign up method"
        options={CONTACT_METHOD_OPTIONS}
        value={method}
        onChange={setMethod}
      />
      {method === "phone" ? <PhoneSignup /> : <EmailSignup />}
    </div>
  );
}

/** Signup by phone: the account has no password and signs in with a code. */
function PhoneSignup() {
  const router = useRouter();
  const sendOtp = useSendSignupOtp();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneSignupValues>({
    resolver: zodResolver(phoneSignupSchema),
    defaultValues: { fullName: "", phone: "", consent: false },
  });

  const onSubmit = handleSubmit(({ fullName, phone }) => {
    sendOtp.mutate(
      { phone },
      {
        onSuccess: (issued) => {
          signupStore.set({
            method: "phone",
            fullName,
            phone,
            verificationId: issued.verificationId,
            resendAvailableAt: Date.parse(issued.resendAvailableAt),
          });
          router.push(AUTH_ROUTES.signupVerify);
        },
      },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-6">
      <TextField
        id="signup-full-name"
        label="Full Name"
        autoComplete="name"
        placeholder="Enter your full name"
        error={errors.fullName?.message}
        {...register("fullName")}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field, fieldState }) => (
          <PhoneField
            id="signup-phone"
            label="Phone number"
            error={fieldState.error?.message}
            {...field}
          />
        )}
      />
      <FormAlert message={sendOtp.error && getErrorMessage(sendOtp.error)} />
      <div className="flex flex-col gap-4">
        <Checkbox
          id="signup-consent"
          error={errors.consent?.message}
          {...register("consent")}
        >
          <LegalConsentText />
        </Checkbox>
        <Button type="submit" loading={sendOtp.isPending}>
          Create Account
        </Button>
      </div>
      {loginPrompt}
    </form>
  );
}

function EmailSignup() {
  const router = useRouter();
  const sendOtp = useSendSignupOtp();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailSignupValues>({
    resolver: zodResolver(emailSignupSchema),
    defaultValues: { fullName: "", email: "", password: "", consent: false },
  });

  const onSubmit = handleSubmit(({ fullName, email, password }) => {
    sendOtp.mutate(
      { email },
      {
        onSuccess: (issued) => {
          signupPassword.set(password);
          signupStore.set({
            method: "email",
            fullName,
            email,
            verificationId: issued.verificationId,
            resendAvailableAt: Date.parse(issued.resendAvailableAt),
          });
          router.push(AUTH_ROUTES.signupVerify);
        },
      },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-6">
      <TextField
        id="signup-full-name"
        label="Full Name"
        autoComplete="name"
        placeholder="Enter your full name"
        error={errors.fullName?.message}
        {...register("fullName")}
      />
      <TextField
        id="signup-email"
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="Enter your Email"
        error={errors.email?.message}
        {...register("email")}
      />
      <div className="flex flex-col gap-3">
        <TextField
          id="signup-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Enter your Password"
          error={errors.password?.message}
          {...register("password")}
        />
        <TextLink
          href={AUTH_ROUTES.forgotPassword}
          className="self-end font-display text-base font-semibold tracking-[-0.24px]"
        >
          Forget Password?
        </TextLink>
      </div>
      <FormAlert message={sendOtp.error && getErrorMessage(sendOtp.error)} />
      <div className="flex flex-col gap-4">
        <Checkbox
          id="signup-consent"
          error={errors.consent?.message}
          {...register("consent")}
        >
          <LegalConsentText />
        </Checkbox>
        <Button type="submit" loading={sendOtp.isPending}>
          Create Account
        </Button>
        {loginPrompt}
      </div>
      <LabeledDivider label="Or" />
      <GoogleButton />
    </form>
  );
}
