import type { Metadata } from "next";
import { PasswordResetOtpStep } from "@/features/auth/components/password-reset-otp-step";

export const metadata: Metadata = { title: "Enter the code" };

export default function Page() {
  return <PasswordResetOtpStep />;
}
