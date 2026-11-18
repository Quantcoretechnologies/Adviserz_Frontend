import type { Route } from "next";
import { ROUTES } from "./routes";

export interface NavItem {
  label: string;
  /** SVG in /public, drawn in the item's text colour. */
  icon: string;
  iconWidth?: number;
  iconHeight?: number;
  /** Absent while the destination screen has not been built. */
  href?: Route;
  /** Never highlighted as the current page (an action rather than a place). */
  action?: boolean;
  /** Key of a count shown as a badge. */
  badge?: "newAdvisories";
}

/** Main sidebar navigation, in display order. */
export const APP_NAV: NavItem[] = [
  {
    label: "New Chat",
    icon: "/icons/app/new-chat.svg",
    href: ROUTES.home,
    action: true,
  },
  { label: "Dashboard", icon: "/icons/app/dashboard.svg", href: ROUTES.home },
  {
    label: "Advisories",
    icon: "/icons/app/advisories.svg",
    badge: "newAdvisories",
  },
  { label: "Market News", icon: "/icons/app/market-news.svg" },
  {
    label: "Plans",
    icon: "/icons/app/plans.svg",
    iconWidth: 20,
    iconHeight: 17,
  },
  {
    label: "Refer & Earn",
    icon: "/icons/app/refer.svg",
    iconWidth: 19,
    iconHeight: 18,
  },
];
