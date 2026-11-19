"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { PasswordField } from "@/components/ui/password-field";
import { TextLink } from "@/components/ui/text-link";
import { ADMIN_ROUTES } from "@/config/routes";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { getErrorMessage } from "@/lib/api";
import {
  useAdminLogout,
  useChangeAdminPassword,
  useCurrentAdmin,
} from "../hooks/use-admin-session";
import {
  changeAdminPasswordSchema,
  type ChangeAdminPasswordValues,
} from "../schemas/admin-auth.schemas";

/**
 * Change the signed-in staff member's password. A staff member who signed in
 * with a generated password is sent here and cannot leave until it is
 * replaced; anyone else can open it from the account menu.
 */
export function ChangePasswordForm() {
  const router = useRouter();
  const { data, error: loadError } = useCurrentAdmin();
  const changePassword = useChangeAdminPassword();
  const logout = useAdminLogout();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangeAdminPasswordValues>({
    resolver: zodResolver(changeAdminPasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const forced = data?.admin.mustChangePassword === true;

  const onSubmit = handleSubmit((values) => {
    changePassword.mutate(values, {
      onSuccess: () => router.replace(ADMIN_ROUTES.home),
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-6">
      <AuthHeading
        title={forced ? "Set your password" : "Change password"}
        description={
          forced
            ? "You signed in with a temporary password. Choose your own to continue."
            : "Choose a new password. You'll be signed out on your other devices."
        }
      />
      <PasswordField
        id="admin-current-password"
        label={forced ? "Temporary Password" : "Current Password"}
        autoComplete="current-password"
        placeholder={
          forced ? "Enter the password you were given" : "Enter your Password"
        }
        error={errors.currentPassword?.message}
        {...register("currentPassword")}
      />
      <PasswordField
        id="admin-new-password"
        label="New Password"
        autoComplete="new-password"
        placeholder="At least 12 characters"
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />
      <PasswordField
        id="admin-confirm-password"
        label="Confirm Password"
        autoComplete="new-password"
        placeholder="Re-enter your New Password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <FormAlert
        message={
          (changePassword.error && getErrorMessage(changePassword.error)) ||
          (loadError && getErrorMessage(loadError))
        }
      />
      <Button type="submit" loading={changePassword.isPending}>
        {forced ? "Set Password" : "Change Password"}
      </Button>
      <p className="text-center text-base font-semibold tracking-[-0.24px] text-muted-foreground">
        {forced ? (
          <button
            type="button"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
            className="cursor-pointer text-brand-gradient hover:underline disabled:opacity-60"
          >
            Sign out instead
          </button>
        ) : (
          <TextLink href={ADMIN_ROUTES.home}>Back to the dashboard</TextLink>
        )}
      </p>
    </form>
  );
}
