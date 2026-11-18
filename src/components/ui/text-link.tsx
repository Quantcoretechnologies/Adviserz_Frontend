import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface TextLinkProps {
  href: Route;
  children: ReactNode;
  className?: string;
}

/** An inline link in the brand gradient. */
export function TextLink({ href, children, className }: TextLinkProps) {
  return (
    <Link
      href={href}
      className={cn("text-brand-gradient hover:underline", className)}
    >
      {children}
    </Link>
  );
}
