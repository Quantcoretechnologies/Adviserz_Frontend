import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const tones = {
  neutral: "bg-surface text-muted-foreground",
  brand: "bg-brand-gradient-badge text-primary",
  positive: "bg-positive/10 text-positive",
  negative: "bg-negative/10 text-negative",
} as const;

interface BadgeProps {
  tone?: keyof typeof tones;
  children: ReactNode;
  className?: string;
}

/** A small label for a status, a role or a count. */
export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-sm leading-none font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
