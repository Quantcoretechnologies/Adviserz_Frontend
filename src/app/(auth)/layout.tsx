import { ShowcaseLayout } from "@/components/layout/showcase-layout";
import { RedirectIfSignedIn } from "@/features/auth/components/redirect-if-signed-in";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <ShowcaseLayout>
      <RedirectIfSignedIn />
      {children}
    </ShowcaseLayout>
  );
}
