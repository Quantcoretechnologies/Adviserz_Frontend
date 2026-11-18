"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { TextField } from "@/components/ui/text-field";
import { getErrorMessage } from "@/lib/api";
import { AUTH_ROUTES } from "../constants";
import { useResetPassword } from "../hooks/use-auth-mutations";
import { passwordResetStore } from "../lib/flow-state";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "../schemas/auth.schemas";
import { AuthHeading } from "./auth-heading";

/** Password reset, step 3: choose the new password. */
export function ResetPasswordForm() {
  const router = useRouter();
  const reset = passwordResetStore.useValue();
  const resetPassword = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    // Read storage directly: the hook value is null while the page hydrates.
    if (!passwordResetStore.get()?.resetToken) {
      router.replace(AUTH_ROUTES.forgotPassword);
    }
  }, [router]);

  const resetToken = reset?.resetToken;
  if (!resetToken) return null;

  const onSubmit = handleSubmit((values) => {
    resetPassword.mutate(
      { resetToken, ...values },
      {
        onSuccess: () => {
          router.push(AUTH_ROUTES.login);
          passwordResetStore.clear();
        },
      },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-6">
      <AuthHeading
        title="Set a new password"
        description="Choose a new password for your account. You'll be signed out on all devices."
      />
      <TextField
        id="reset-new-password"
        label="New Password"
        type="password"
        autoComplete="new-password"
        placeholder="Enter your New Password"
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />
      <TextField
        id="reset-confirm-password"
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        placeholder="Re-enter your New Password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <FormAlert
        message={resetPassword.error && getErrorMessage(resetPassword.error)}
      />
      <Button type="submit" loading={resetPassword.isPending}>
        Change Password
      </Button>
    </form>
  );
}
