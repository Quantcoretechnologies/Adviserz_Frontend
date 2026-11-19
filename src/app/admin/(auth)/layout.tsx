import { AdminAuthLayout } from "@/features/admin/components/admin-auth-layout";
import { RedirectIfSignedIn } from "@/features/auth/components/redirect-if-signed-in";

export default function AdminSignInLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AdminAuthLayout>
      <RedirectIfSignedIn scope="admin" />
      {children}
    </AdminAuthLayout>
  );
}
