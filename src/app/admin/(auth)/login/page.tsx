import type { Metadata } from "next";
import { AdminLoginForm } from "@/features/admin/components/admin-login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return <AdminLoginForm />;
}
