import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface OptionCardProps {
  title: string;
  description?: ReactNode;
  selected: boolean;
  onSelect: () => void;
  /** "radio" when one option may be chosen, "checkbox" when several may. */
  role: "radio" | "checkbox";
  disabled?: boolean;
}

/** A selectable answer card, as used by the onboarding questions. */
export function OptionCard({
  title,
  description,
  selected,
  onSelect,
  role,
  disabled,
}: OptionCardProps) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer flex-col items-start gap-1 rounded-xl border px-4 py-[18px] text-left text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        selected
          ? "border-primary bg-brand-gradient-soft"
          : "border-transparent bg-surface-subtle",
      )}
    >
      <span className="font-display text-foreground">{title}</span>
      {description ? (
        <span className="tracking-[-0.24px] text-muted-foreground">
          {description}
        </span>
      ) : null}
    </button>
  );
}
