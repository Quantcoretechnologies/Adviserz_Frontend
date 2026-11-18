import type { Route } from "next";
import { ROUTES } from "@/config/routes";
import type { NextAction } from "./api/auth.types";

export { ROUTES as AUTH_ROUTES };

export const OTP_LENGTH = 6;

export type ContactMethod = "phone" | "email";

export const CONTACT_METHOD_OPTIONS = [
  { value: "phone", label: "Phone Number" },
  { value: "email", label: "Email" },
] as const satisfies readonly { value: ContactMethod; label: string }[];

/**
 * Where a user goes right after signing in or signing up, from the API's
 * `nextAction`. Accepting a newly published policy has no screen yet, so it
 * falls through to the home page for now.
 */
export function postAuthRoute(nextAction: NextAction): Route {
  return nextAction === "onboarding" ? ROUTES.onboarding : ROUTES.home;
}
