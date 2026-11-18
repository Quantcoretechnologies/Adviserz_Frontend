import type { Metadata } from "next";
import { LoginOtpStep } from "@/features/auth/components/login-otp-step";

export const metadata: Metadata = { title: "Enter the code" };

export default function Page() {
  return <LoginOtpStep />;
}
