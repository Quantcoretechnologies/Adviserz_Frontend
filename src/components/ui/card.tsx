import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

/** A white panel with the design's hairline border, for a block of content. */
export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-hairline bg-background p-6",
        className,
      )}
      {...props}
    />
  );
}

/** The heading at the top of a card. */
export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "font-display text-xl leading-6 font-semibold text-foreground",
        className,
      )}
      {...props}
    />
  );
}
