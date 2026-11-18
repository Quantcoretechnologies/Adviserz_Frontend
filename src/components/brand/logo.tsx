import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface LogoProps {
  /** "light" wordmark for dark backgrounds, "dark" for light ones. */
  tone?: "light" | "dark";
  className?: string;
}

/** The Adviserz mark and wordmark. */
export function Logo({ tone = "light", className }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <Image
        src="/images/logo-mark.svg"
        alt=""
        width={41.28}
        height={40.32}
        priority
      />
      <span
        className={cn(
          "font-logo text-2xl leading-none font-bold",
          tone === "light" ? "text-white" : "text-foreground",
        )}
      >
        ADVISERZ
      </span>
    </span>
  );
}
