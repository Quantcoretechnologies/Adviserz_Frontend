import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin console",
    template: "%s | Adviserz Admin",
  },
  // The console is a staff tool: keep it out of search engines.
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
