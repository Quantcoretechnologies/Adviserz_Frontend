"use client";

import Image from "next/image";
import type { FormEvent, KeyboardEvent } from "react";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  /** Called with the trimmed message; never called for an empty one. */
  onSend: (message: string) => void;
  /** Name of the model answering, shown as a chip. */
  model: string;
}

/** The message box: text, attach, model, voice and send. */
export function ChatComposer({
  value,
  onChange,
  onSend,
  model,
}: ChatComposerProps) {
  const send = () => {
    const message = value.trim();
    if (message) onSend(message);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    send();
  };

  // Enter sends; Shift+Enter starts a new line.
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-[151px] w-full flex-col justify-between rounded-xl border border-primary bg-background px-4 py-[18px]"
    >
      <label htmlFor="chat-message" className="sr-only">
        Message
      </label>
      <textarea
        id="chat-message"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about a stock, Index or strategy"
        rows={2}
        className="w-full flex-1 resize-none bg-transparent text-base font-semibold tracking-[-0.24px] text-foreground placeholder:text-subtle focus:outline-none"
      />
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Attach a file"
            className="flex size-6 cursor-pointer items-center justify-center rounded-md"
          >
            <Image src="/icons/app/attach.svg" alt="" width={22} height={22} />
          </button>
          <span className="rounded-xl bg-surface-subtle px-3 py-2 text-base font-semibold tracking-[-0.24px] text-subtle">
            {model}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Speak your message"
            className="flex size-6 cursor-pointer items-center justify-center rounded-md"
          >
            <Image src="/icons/app/mic.svg" alt="" width={20} height={20} />
          </button>
          <button
            type="submit"
            aria-label="Send message"
            className="cursor-pointer rounded-xl bg-brand-gradient px-3 py-2.5 transition-opacity hover:opacity-90"
          >
            <Image src="/icons/app/send.svg" alt="" width={24} height={24} />
          </button>
        </div>
      </div>
    </form>
  );
}
