import type { Metadata } from "next";
import { RiskNoticeScreen } from "@/features/risk/components/risk-notice-screen";

export const metadata: Metadata = { title: "Update to your risk limits" };

export default function Page() {
  return <RiskNoticeScreen />;
}
