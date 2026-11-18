"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { MaskIcon } from "@/components/ui/mask-icon";
import { APP_NAV, type NavItem } from "@/config/navigation";
import { ROUTES } from "@/config/routes";
import type { ConnectedBroker } from "@/data/placeholder";
import { cn } from "@/lib/utils/cn";

const rowClassName =
  "font-display flex h-10 w-full items-center gap-2 rounded-lg px-3 text-base leading-6 font-normal tracking-[-0.31px]";

interface AppSidebarProps {
  brokers: ConnectedBroker[];
  recentSearches: string[];
  /** Counts shown as badges, keyed by `NavItem.badge`. */
  badges: Record<NonNullable<NavItem["badge"]>, number>;
  className?: string;
}

/** The app's left navigation: main menu, connected brokers and recent searches. */
export function AppSidebar({
  brokers,
  recentSearches,
  badges,
  className,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "w-[272px] shrink-0 flex-col border-r border-hairline bg-background",
        className,
      )}
    >
      <div className="flex border-b border-hairline p-6">
        <Link href={ROUTES.home} aria-label="Adviserz home">
          <Logo tone="dark" className="h-10" />
        </Link>
      </div>

      <nav aria-label="Main" className="flex flex-col overflow-y-auto p-6">
        <ul className="flex flex-col gap-4">
          {APP_NAV.map((item) => (
            <li key={item.label}>
              <NavRow
                item={item}
                active={!item.action && item.href === pathname}
                badge={item.badge ? badges[item.badge] : 0}
              />
            </li>
          ))}
        </ul>

        <SectionHeading
          action={
            <button
              type="button"
              aria-label="Connect a broker"
              className="cursor-pointer text-foreground"
            >
              <MaskIcon
                src="/icons/app/add.svg"
                width={20}
                height={20}
                className="size-5"
              />
            </button>
          }
        >
          Broker
        </SectionHeading>
        <ul className="flex flex-col">
          {brokers.map((broker) => (
            <li
              key={broker.name}
              className={cn(rowClassName, "text-foreground")}
            >
              <span className="flex size-6 shrink-0 items-center justify-center">
                <Image src={broker.logo} alt="" width={17} height={18} />
              </span>
              {broker.name}
            </li>
          ))}
        </ul>

        <SectionHeading>Recent Search</SectionHeading>
        <ul className="flex flex-col">
          {recentSearches.map((search) => (
            <li key={search} className={cn(rowClassName, "text-foreground")}>
              <span className="truncate">{search}</span>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

function NavRow({
  item,
  active,
  badge,
}: {
  item: NavItem;
  active: boolean;
  badge: number;
}) {
  const content = (
    <>
      <MaskIcon
        src={item.icon}
        width={item.iconWidth}
        height={item.iconHeight}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {badge > 0 ? (
        <span className="rounded-md bg-brand-gradient-soft px-1.5 py-1 font-logo text-sm leading-none font-semibold text-accent">
          {badge}
        </span>
      ) : null}
    </>
  );
  const className = cn(
    rowClassName,
    active ? "bg-brand-gradient text-white" : "text-foreground",
  );

  // Screens that are not built yet are shown, as in the design, but are not links.
  if (!item.href) {
    return (
      <span className={className} aria-disabled>
        {content}
      </span>
    );
  }
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {content}
    </Link>
  );
}

function SectionHeading({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-3 pt-6 pb-4">
      <h2 className="text-sm leading-4 font-normal tracking-[-0.3125px] text-subtle">
        {children}
      </h2>
      {action}
    </div>
  );
}
