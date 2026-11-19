import { AdminAuthLayout } from "@/features/admin/components/admin-auth-layout";

export default function AdminAccountLayout({
  children,
}: LayoutProps<"/admin">) {
  return <AdminAuthLayout>{children}</AdminAuthLayout>;
}
