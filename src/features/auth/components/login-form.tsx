"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
  postAuthRoute,
  type ContactMethod,
} from "../constants";
import { useLogin, useSendLoginOtp } from "../hooks/use-auth-mutations";
import { loginOtpStore } from "../lib/flow-state";
import {
  emailLoginSchema,
  phoneLoginSchema,
  type EmailLoginValues,
  type PhoneLoginValues,
} from "../schemas/auth.schemas";
import { AuthHeading } from "./auth-heading";
import { AuthSwitchPrompt, GoogleButton, LegalConsentText } from "./auth-parts";

const signupPrompt = (
  <AuthSwitchPrompt
    prompt="Don't have an account?"
    linkLabel="Create Account"
    href={AUTH_ROUTES.signup}
  />
);

export function LoginForm() {
  const [method, setMethod] = useState<ContactMethod>("phone");

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <AuthHeading
        title="Welcome back"
        description="Your next investment insight is one step away."
      />
      <SegmentedTabs
        label="Log in method"
        options={CONTACT_METHOD_OPTIONS}
        value={method}
        onChange={setMethod}
      />
      {method === "phone" ? <PhoneLogin /> : <EmailLogin />}
    </div>
  );
}

/** Phone login: text a code to the number, then continue on the code screen. */
function PhoneLogin() {
  const router = useRouter();
  const sendOtp = useSendLoginOtp();
  const { control, handleSubmit } = useForm<PhoneLoginValues>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: { phone: "" },
  });

  const onSubmit = handleSubmit(({ phone }) => {
    sendOtp.mutate(phone, {
      onSuccess: (issued) => {
        loginOtpStore.set({
          phone,
          verificationId: issued.verificationId,
          resendAvailableAt: Date.parse(issued.resendAvailableAt),
        });
        router.push(AUTH_ROUTES.loginVerify);
      },
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-6">
      <Controller
        control={control}
        name="phone"
        render={({ field, fieldState }) => (
          <PhoneField
            id="login-phone"
            label="Phone number"
            error={fieldState.error?.message}
            {...field}
          />
        )}
      />
      <FormAlert message={sendOtp.error && getErrorMessage(sendOtp.error)} />
      <div className="flex flex-col gap-4">
        <LegalConsentText />
        <Button type="submit" loading={sendOtp.isPending}>
          Log In
        </Button>
      </div>
      {signupPrompt}
    </form>
  );
}

function EmailLogin() {
  const router = useRouter();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailLoginValues>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(({ email, password }) => {
    login.mutate(
      { identifier: email, password },
      { onSuccess: (data) => router.replace(postAuthRoute(data.nextAction)) },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-6">
      <TextField
        id="login-email"
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="Enter your Email"
        error={errors.email?.message}
        {...register("email")}
      />
      <div className="flex flex-col gap-3">
        <TextField
          id="login-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your Password"
          error={errors.password?.message}
          {...register("password")}
        />
        <TextLink
          href={AUTH_ROUTES.forgotPassword}
          className="self-end font-display text-base font-semibold tracking-[-0.24px]"
        >
          Forgot Password?
        </TextLink>
      </div>
      <FormAlert message={login.error && getErrorMessage(login.error)} />
      <div className="flex flex-col gap-4">
        <LegalConsentText />
        <Button type="submit" loading={login.isPending}>
          Log In
        </Button>
        {signupPrompt}
      </div>
      <LabeledDivider label="Or" />
      <GoogleButton />
    </form>
  );
}
