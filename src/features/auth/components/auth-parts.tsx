import type { Route } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/text-link";

/** Small pieces shared by the login and signup forms. */

/** "By continuing, I agree to the Adviserz Disclaimer and T&Cs." */
export function LegalConsentText() {
  // The Disclaimer and T&Cs become links once the policy pages exist.
  return (
    <span className="text-base font-semibold tracking-[-0.24px] text-foreground">
      By continuing, I agree to the{" "}
      <span className="text-brand-gradient underline">Adviserz Disclaimer</span>{" "}
      and <span className="text-brand-gradient underline">T&amp;Cs.</span>
    </span>
  );
}

interface AuthSwitchPromptProps {
  prompt: string;
  linkLabel: string;
  href: Route;
}

/** "Don't have an account? Create Account" and its mirror on the signup page. */
export function AuthSwitchPrompt({
  prompt,
  linkLabel,
  href,
}: AuthSwitchPromptProps) {
  return (
    <p className="w-full text-center text-base font-semibold tracking-[-0.24px] text-foreground">
      {prompt} <TextLink href={href}>{linkLabel}</TextLink>
    </p>
  );
}

/** Google sign-in. Not connected yet: the backend has no Google login. */
export function GoogleButton() {
  return (
    <Button variant="outline">
      <Image src="/icons/google.svg" alt="" width={20} height={20} />
      Log in with Google
    </Button>
  );
}
