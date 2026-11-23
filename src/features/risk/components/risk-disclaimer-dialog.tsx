"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { compactButtonClassName, Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import type { Disclaimer } from "../api/risk.types";
import { matchesConfirmationPhrase } from "../lib/bands";
import { DisclaimerText, parseDisclaimer } from "./disclaimer-text";

interface RiskDisclaimerDialogProps {
  disclaimer: Disclaimer;
  /** e.g. "Equity Intraday", shown above the text. */
  segmentName: string;
  /** "1 of 2" when several disclaimers are shown in turn. */
  position?: { current: number; total: number };
  onAccept: (typedConfirmation?: string) => void;
  onCancel: () => void;
}

/**
 * The disclaimer for a risk above the suggested level (caution) or above the
 * maximum (strict). The text comes from the API, filled in with the user's
 * own numbers. Caution: tick the declaration. Strict: tick it AND type the
 * confirmation phrase. Cancel goes back so the user can lower the risk.
 */
export function RiskDisclaimerDialog({
  disclaimer,
  segmentName,
  position,
  onAccept,
  onCancel,
}: RiskDisclaimerDialogProps) {
  const id = useId();
  const [ticked, setTicked] = useState(false);
  const [typed, setTyped] = useState("");
  const strict = disclaimer.level === "above_maximum";
  const { paragraphs, declaration } = parseDisclaimer(disclaimer.statement);
  const phraseOk = !strict || matchesConfirmationPhrase(typed);
  const canAccept = ticked && phraseOk;

  return (
    <Dialog
      open
      onClose={onCancel}
      size="lg"
      title={disclaimer.title}
      description={
        <span>
          {segmentName}
          {position && position.total > 1
            ? ` · Disclaimer ${position.current} of ${position.total}`
            : null}
        </span>
      }
      footer={
        <>
          <Button
            variant="outline"
            className={compactButtonClassName}
            onClick={onCancel}
          >
            Change my risk
          </Button>
          <Button
            className={compactButtonClassName}
            disabled={!canAccept}
            onClick={() => onAccept(strict ? typed : undefined)}
          >
            {strict ? "I accept the risk" : "I agree"}
          </Button>
        </>
      }
    >
      <div
        className={
          strict
            ? "rounded-xl border border-destructive/40 bg-destructive/5 p-4"
            : "rounded-xl bg-surface-subtle p-4"
        }
      >
        <DisclaimerText paragraphs={paragraphs} />
      </div>
      <Checkbox
        id={`${id}-declaration`}
        checked={ticked}
        onChange={(event) => setTicked(event.target.checked)}
      >
        {declaration ?? "I have read and understood this disclaimer."}
      </Checkbox>
      {strict && disclaimer.confirmationPhrase ? (
        <TextField
          id={`${id}-phrase`}
          label={`Type ${disclaimer.confirmationPhrase} to continue`}
          autoComplete="off"
          spellCheck={false}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          error={
            typed.trim() && !phraseOk
              ? `Type exactly: ${disclaimer.confirmationPhrase}`
              : undefined
          }
        />
      ) : null}
    </Dialog>
  );
}
