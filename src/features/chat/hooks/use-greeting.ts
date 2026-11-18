import { useSyncExternalStore } from "react";

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const noopSubscribe = () => () => {};

/**
 * A greeting for the visitor's local time of day. Uses a neutral greeting
 * during server rendering, where the visitor's time zone is unknown.
 */
export function useGreeting(): string {
  return useSyncExternalStore(noopSubscribe, greetingForNow, () => "Hello");
}
