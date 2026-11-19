"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { PasswordField } from "@/components/ui/password-field";
import { TextField } from "@/components/ui/text-field";
import { ADMIN_ROUTES } from "@/config/routes";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { getErrorMessage } from "@/lib/api";
import { useAdminLogin } from "../hooks/use-admin-session";
import {
  adminLoginSchema,
  type AdminLoginValues,
} from "../schemas/admin-auth.schemas";

/** Staff sign-in with email and password. */
export function AdminLoginForm() {
  const router = useRouter();
  const login = useAdminLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: ({ admin }) =>
        // A generated password must be replaced before anything else works.
        router.replace(
          admin.mustChangePassword
            ? ADMIN_ROUTES.changePassword
            : ADMIN_ROUTES.home,
        ),
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-6">
      <AuthHeading
        title="Staff sign in"
        description="Sign in with the email and password of your staff account."
      />
      <TextField
        id="admin-login-email"
        label="Email address"
        type="email"
        autoComplete="username"
        placeholder="Enter your Email"
        error={errors.email?.message}
        {...register("email")}
      />
      <PasswordField
        id="admin-login-password"
        label="Password"
        autoComplete="current-password"
        placeholder="Enter your Password"
        error={errors.password?.message}
        {...register("password")}
      />
      <FormAlert message={login.error && getErrorMessage(login.error)} />
      <Button type="submit" loading={login.isPending}>
        Sign In
      </Button>
    </form>
  );
}
