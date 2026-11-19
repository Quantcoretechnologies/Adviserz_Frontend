import type { Route } from "next";
import Link from "next/link";
import { MaskIcon } from "@/components/ui/mask-icon";
import { cn } from "@/lib/utils/cn";

/** The shape of every row in a sidebar: links, brokers, recent searches. */
export const sidebarRowClassName =
  "font-display flex h-10 w-full items-center gap-2 rounded-lg px-3 text-base leading-6 font-normal tracking-[-0.31px]";

interface SidebarNavRowProps {
  label: string;
  /** SVG in /public, drawn in the row's text colour. */
  icon: string;
  iconWidth?: number;
  iconHeight?: number;
  /** Absent while the destination screen has not been built. */
  href?: Route;
  /** Highlights the row as the current page. */
  active: boolean;
  /** A count shown at the end of the row; hidden when 0. */
  badge?: number;
}

/** One navigation row of a sidebar, used by the app and the admin console. */
export function SidebarNavRow({
  label,
  icon,
  iconWidth,
  iconHeight,
  href,
  active,
  badge = 0,
}: SidebarNavRowProps) {
  const content = (
    <>
      <MaskIcon src={icon} width={iconWidth} height={iconHeight} />
      <span className="flex-1 truncate">{label}</span>
      {badge > 0 ? (
        <span className="rounded-md bg-brand-gradient-soft px-1.5 py-1 font-logo text-sm leading-none font-semibold text-accent">
          {badge}
        </span>
      ) : null}
    </>
  );
  const className = cn(
    sidebarRowClassName,
    active ? "bg-brand-gradient text-white" : "text-foreground",
  );

  // Screens that are not built yet are shown, as in the design, but are not links.
  if (!href) {
    return (
      <span className={className} aria-disabled>
        {content}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {content}
    </Link>
  );
}
