import { env } from "./env";

export const siteConfig = {
  name: "Adviserz",
  description:
    "Adviserz helps traders set up a disciplined risk profile and trade within it.",
  url: env.NEXT_PUBLIC_APP_URL,
} as const;
