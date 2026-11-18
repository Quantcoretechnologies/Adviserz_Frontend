import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = { title: "Set a new password" };

export default function Page() {
  return <ResetPasswordForm />;
}
