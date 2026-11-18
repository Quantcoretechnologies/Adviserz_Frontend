"use client";

import { useState } from "react";
import {
  PLACEHOLDER_CHAT_MODEL,
  PLACEHOLDER_MARKET_QUOTES,
  PLACEHOLDER_PROMPT_SUGGESTIONS,
  type PromptSuggestion,
} from "@/data/placeholder";
import { useCurrentUser } from "@/features/auth/hooks/use-session";
import { MarketTicker } from "@/features/market/components/market-ticker";
import { useGreeting } from "../hooks/use-greeting";
import { ChatComposer } from "./chat-composer";

/** The app's home: a greeting, suggested questions and the message box. */
export function ChatHome() {
  const [message, setMessage] = useState("");
  const greeting = useGreeting();
  const { data } = useCurrentUser();
  const firstName = data?.user.fullName.split(" ")[0];

  return (
    <div className="flex w-full flex-1 flex-col">
      <MarketTicker quotes={PLACEHOLDER_MARKET_QUOTES} />

      <div className="flex w-full flex-1 flex-col items-center gap-6 px-6 py-[100px]">
        <div className="flex w-full flex-col items-center gap-2 text-center font-semibold">
          <h1 className="max-w-[820px] font-display text-[32px] leading-[1.2] text-foreground sm:text-[46px]">
            {greeting}
            {firstName ? `, ${firstName}` : ""}! 👋
            <br />
            I&apos;m <span className="text-brand-gradient">Zevi,</span> your AI
            trading companion.
          </h1>
          <p className="text-base tracking-[-0.24px] text-muted-foreground">
            How can I help you today?
          </p>
        </div>

        <ul className="grid w-full max-w-[830px] grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
          {PLACEHOLDER_PROMPT_SUGGESTIONS.map((suggestion) => (
            <li key={suggestion.title}>
              <SuggestionCard
                suggestion={suggestion}
                onSelect={() => setMessage(suggestion.title)}
              />
            </li>
          ))}
        </ul>

        <div className="w-full max-w-[830px]">
          <ChatComposer
            value={message}
            onChange={setMessage}
            model={PLACEHOLDER_CHAT_MODEL}
            // The conversation screen is not built yet, so sending has nowhere to go.
            onSend={() => {}}
          />
        </div>
      </div>
    </div>
  );
}

/** A suggested question. Choosing it puts the question in the message box. */
function SuggestionCard({
  suggestion,
  onSelect,
}: {
  suggestion: PromptSuggestion;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full cursor-pointer flex-col items-start gap-1 rounded-xl bg-background px-6 py-4 text-left font-semibold"
    >
      <span className="font-display text-lg text-foreground">
        {suggestion.title}
      </span>
      <span className="text-sm tracking-[-0.21px] text-muted-foreground">
        {suggestion.description}
      </span>
    </button>
  );
}
