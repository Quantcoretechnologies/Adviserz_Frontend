import type { Metadata } from "next";
import { ChangePasswordForm } from "@/features/admin/components/change-password-form";

export const metadata: Metadata = { title: "Change password" };

export default function Page() {
  return <ChangePasswordForm />;
}
