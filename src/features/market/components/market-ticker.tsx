import Image from "next/image";
import type { MarketQuote } from "@/data/placeholder";
import { cn } from "@/lib/utils/cn";

/** A row of index quotes across the top of the app. */
export function MarketTicker({ quotes }: { quotes: MarketQuote[] }) {
  return (
    <ul
      aria-label="Market indices"
      className="flex w-full items-center gap-5 overflow-hidden bg-background px-6 py-3"
    >
      {quotes.map((quote, index) => (
        <li
          key={`${quote.name}-${index}`}
          className="flex shrink-0 items-center gap-5"
        >
          <Quote quote={quote} />
          <span aria-hidden className="h-[39px] w-px shrink-0 bg-divider" />
        </li>
      ))}
    </ul>
  );
}

function Quote({ quote }: { quote: MarketQuote }) {
  const up = quote.direction === "up";
  return (
    <div className="flex items-center gap-2 font-semibold">
      <div className="flex flex-col">
        <span className="font-display text-sm whitespace-nowrap text-foreground">
          {quote.name}
        </span>
        <span className="text-xs tracking-[-0.18px] text-subtle">
          {quote.price}
        </span>
      </div>
      <Image
        src={up ? "/icons/app/trend-up.svg" : "/icons/app/trend-down.svg"}
        alt={up ? "Up" : "Down"}
        width={13}
        height={7}
        className={cn("shrink-0", !up && "-scale-y-100")}
      />
      <span
        className={cn(
          "text-xs tracking-[-0.18px] whitespace-nowrap",
          up ? "text-positive" : "text-negative",
        )}
      >
        {quote.change}
      </span>
    </div>
  );
}
