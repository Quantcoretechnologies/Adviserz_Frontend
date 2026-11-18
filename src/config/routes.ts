import type { Route } from "next";

/** Every route in the app. Link and redirect to these, never to string literals. */
export const ROUTES = {
  home: "/",
  login: "/login",
  loginVerify: "/login/verify",
  signup: "/signup",
  signupVerify: "/signup/verify",
  forgotPassword: "/forgot-password",
  forgotPasswordVerify: "/forgot-password/verify",
  forgotPasswordReset: "/forgot-password/reset",
  onboarding: "/onboarding",
} as const satisfies Record<string, Route>;

/** Pages for signed-out visitors; a signed-in user is sent away from them. */
export const GUEST_ONLY_PREFIXES = [
  ROUTES.login,
  ROUTES.signup,
  ROUTES.forgotPassword,
] as const;

/** Pages that need a session; a signed-out visitor is sent to the login page. */
export const PROTECTED_PREFIXES = [ROUTES.home, ROUTES.onboarding] as const;

export function matchesPrefix(
  pathname: string,
  prefixes: readonly string[],
): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
