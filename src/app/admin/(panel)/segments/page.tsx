import type { Metadata } from "next";
import { SegmentsScreen } from "@/features/admin/components/segments/segments-screen";

export const metadata: Metadata = { title: "Segments" };

export default function Page() {
  return <SegmentsScreen />;
}
