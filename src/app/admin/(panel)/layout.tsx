import { AdminShell } from "@/features/admin/components/admin-shell";

export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
