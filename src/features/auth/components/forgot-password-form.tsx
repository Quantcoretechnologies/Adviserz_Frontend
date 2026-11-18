"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { TextField } from "@/components/ui/text-field";
import { getErrorMessage } from "@/lib/api";
import { AUTH_ROUTES } from "../constants";
import { useRequestPasswordReset } from "../hooks/use-auth-mutations";
import { passwordResetStore } from "../lib/flow-state";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "../schemas/auth.schemas";
import { AuthHeading } from "./auth-heading";
import { AuthSwitchPrompt } from "./auth-parts";

/** Password reset, step 1: ask for the account email and send it a code. */
export function ForgotPasswordForm() {
  const router = useRouter();
  const requestReset = useRequestPasswordReset();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(({ email }) => {
    requestReset.mutate(email, {
      onSuccess: (issued) => {
        passwordResetStore.set({
          email,
          verificationId: issued.verificationId,
          resendAvailableAt: Date.parse(issued.resendAvailableAt),
        });
        router.push(AUTH_ROUTES.forgotPasswordVerify);
      },
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-6">
      <AuthHeading
        title="Forgot Password?"
        description="No worries! Enter your registered email address, and we'll send you a code to reset your password."
      />
      <TextField
        id="forgot-email"
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="Enter your Email"
        error={errors.email?.message}
        {...register("email")}
      />
      <FormAlert
        message={requestReset.error && getErrorMessage(requestReset.error)}
      />
      <div className="flex flex-col gap-4">
        <Button type="submit" loading={requestReset.isPending}>
          Send Code
        </Button>
        <AuthSwitchPrompt
          prompt="Remembered it?"
          linkLabel="Log In"
          href={AUTH_ROUTES.login}
        />
      </div>
    </form>
  );
}
