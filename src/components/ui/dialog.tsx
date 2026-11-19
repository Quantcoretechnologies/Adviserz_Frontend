"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const sizes = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
} as const;

interface DialogProps {
  open: boolean;
  /** Called when the dialog asks to close (Escape, backdrop, or a button). */
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** Buttons at the bottom, e.g. Cancel and Save. */
  footer?: ReactNode;
  size?: keyof typeof sizes;
  /**
   * When false, Escape and a click outside do not close it: the person has
   * to use a button. For content that must not be dismissed by accident.
   */
  dismissible?: boolean;
}

/**
 * A modal window. Built on the browser's own <dialog>, which keeps keyboard
 * focus inside, closes on Escape and blocks the page behind it.
 *
 * The content is only mounted while open, so every opening starts fresh.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // The latest props, for the native "close" event below.
  const latest = useRef({ open, dismissible, onClose });
  useEffect(() => {
    latest.current = { open, dismissible, onClose };
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Tells the browser which ways of closing are allowed. Without it,
      // Chrome and Edge close any dialog on a second Escape press even when
      // the first one was refused.
      {...{ closedby: dismissible ? "any" : "none" }}
      // Fallback for browsers that close the dialog themselves anyway: keep
      // the page in step with what is on screen.
      onClose={() => {
        const current = latest.current;
        const dialog = ref.current;
        if (!current.open || !dialog) return; // closed by us, as asked
        if (current.dismissible) current.onClose();
        else dialog.showModal();
      }}
      // Escape: the browser fires "cancel" and then closes the dialog itself.
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
      // A click that lands on the dialog element itself is on the backdrop.
      onClick={(event) => {
        if (dismissible && event.target === ref.current) onClose();
      }}
      className={cn(
        // The window itself never scrolls: only the content area inside does.
        // `clip` rather than `hidden`: a hidden overflow can still be scrolled
        // by the browser (e.g. to show a focused field), which would push the
        // title and buttons out of view.
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-clip rounded-2xl border border-hairline bg-background p-0 text-foreground shadow-xl backdrop:bg-black/40",
        sizes[size],
      )}
    >
      {open ? (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <header className="flex flex-col gap-1 px-6 pt-6 pb-4">
            <h2
              id={titleId}
              className="font-display text-[22px] leading-7 font-semibold text-foreground"
            >
              {title}
            </h2>
            {description ? (
              <div className="text-base tracking-[-0.24px] text-muted-foreground">
                {description}
              </div>
            ) : null}
          </header>
          {children ? (
            // The browser puts keyboard focus on this scrolling area when the
            // window opens; it needs no outline of its own.
            <div className="flex min-h-0 flex-col gap-5 overflow-y-auto px-6 pb-2 outline-none">
              {children}
            </div>
          ) : null}
          {footer ? (
            <footer className="flex flex-wrap justify-end gap-3 px-6 pt-4 pb-6">
              {footer}
            </footer>
          ) : (
            <div className="pb-4" />
          )}
        </div>
      ) : null}
    </dialog>
  );
}

/** Shared sizing for the compact buttons used in dialogs, headers and rows. */
export const compactButtonClassName =
  "w-auto px-5 py-3 font-sans text-base leading-5 tracking-[-0.24px]";

/** An outline button coloured as a destructive action (delete, block). */
export const dangerButtonClassName =
  "border-destructive/40 text-destructive hover:bg-destructive/5";
