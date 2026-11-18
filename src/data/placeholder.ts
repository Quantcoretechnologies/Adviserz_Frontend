/**
 * PLACEHOLDER DATA. Every value in this file is static sample content taken
 * from the Figma designs, standing in for features whose backend does not
 * exist yet (market data, brokers, chat history, advisories). Replace each
 * export with a real API call as its endpoint is built, then delete it here.
 */

export interface MarketQuote {
  name: string;
  price: string;
  /** e.g. "+537.85 (+0.98%)" */
  change: string;
  direction: "up" | "down";
}

export const PLACEHOLDER_MARKET_QUOTES: MarketQuote[] = [
  {
    name: "Nifty Bank",
    price: "55,540.05",
    change: "+537.85 (+0.98%)",
    direction: "up",
  },
  {
    name: "Fin Nifty",
    price: "25,357.90",
    change: "-458.85 (-1.84%)",
    direction: "down",
  },
  {
    name: "GIFT Nifty",
    price: "23,781.00",
    change: "+21.00 (+0.09%)",
    direction: "up",
  },
  {
    name: "Sensex",
    price: "55,540.05",
    change: "+537.85 (+0.98%)",
    direction: "up",
  },
  {
    name: "Nifty Bank",
    price: "55,540.05",
    change: "+537.85 (+0.98%)",
    direction: "up",
  },
  {
    name: "Nifty Bank",
    price: "55,540.05",
    change: "+537.85 (+0.98%)",
    direction: "up",
  },
];

export interface ConnectedBroker {
  name: string;
  logo: string;
}

export const PLACEHOLDER_BROKERS: ConnectedBroker[] = [
  { name: "Zerodha", logo: "/images/brokers/zerodha.png" },
];

export const PLACEHOLDER_RECENT_SEARCHES: string[] = [
  "Find me a swing trade for this week",
];

/** Unread count shown beside "Advisories" in the sidebar. */
export const PLACEHOLDER_NEW_ADVISORIES = 2;

export interface PromptSuggestion {
  title: string;
  description: string;
}

export const PLACEHOLDER_PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  {
    title: "Find me a swing trade for this week",
    description: "Ranked by model confidence",
  },
  {
    title: "Is nifty overbought right now?",
    description: "Breath, VIX and flows",
  },
  {
    title: "Hedge my HDFC bank position",
    description: "Options structures for your capital",
  },
  {
    title: "What moved bank nifty today?",
    description: "News + Open interest read",
  },
];

/** The model shown in the chat box. */
export const PLACEHOLDER_CHAT_MODEL = "Quant V4";
