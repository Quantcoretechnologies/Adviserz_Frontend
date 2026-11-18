import type { Metadata } from "next";
import { SignupOtpStep } from "@/features/auth/components/signup-otp-step";

export const metadata: Metadata = { title: "Enter the code" };

export default function Page() {
  return <SignupOtpStep />;
}
