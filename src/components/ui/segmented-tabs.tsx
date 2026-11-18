"use client";

import { cn } from "@/lib/utils/cn";

interface SegmentedTabsProps<T extends string> {
  /** Accessible name for the group, e.g. "Sign in method". */
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedTabs<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex w-full items-center gap-[13px] rounded-xl bg-surface p-2"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-w-0 flex-1 cursor-pointer rounded-md px-4 py-3 text-base font-semibold tracking-[-0.24px] whitespace-nowrap text-foreground transition-colors",
              selected && "bg-background",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
