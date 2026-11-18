import type { Metadata } from "next";
import { ChatHome } from "@/features/chat/components/chat-home";

export const metadata: Metadata = { title: "Dashboard" };

export default function HomePage() {
  return <ChatHome />;
}
