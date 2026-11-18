import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

const variants = {
  primary:
    "bg-brand-gradient font-display text-[20px] leading-5 tracking-[-0.3px] text-white",
  outline:
    "border border-border bg-background font-sans text-base tracking-[-0.24px] text-foreground",
  /** Text-only, e.g. the "Back" button beside a primary action. */
  ghost:
    "font-display text-[22px] leading-5 font-normal tracking-[-0.33px] text-quiet",
} as const;

interface ButtonProps extends ComponentProps<"button"> {
  variant?: keyof typeof variants;
  /** Disables the button and announces it as busy. */
  loading?: boolean;
}

export function Button({
  variant = "primary",
  type = "button",
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl px-4 py-[18px] font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
