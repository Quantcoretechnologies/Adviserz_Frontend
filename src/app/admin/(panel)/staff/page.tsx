import type { Metadata } from "next";
import { StaffScreen } from "@/features/admin/components/access/staff-screen";

export const metadata: Metadata = { title: "Staff" };

export default function Page() {
  return <StaffScreen />;
}
