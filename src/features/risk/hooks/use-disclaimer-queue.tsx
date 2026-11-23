"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import type { Acknowledgement, Disclaimer } from "../api/risk.types";
import { acknowledgementOf } from "../lib/bands";
import { RiskDisclaimerDialog } from "../components/risk-disclaimer-dialog";

export interface DisclaimerRequest {
  segmentId: string;
  segmentName: string;
  disclaimer: Disclaimer;
}

interface QueueState {
  items: DisclaimerRequest[];
  index: number;
  acks: Map<string, Acknowledgement>;
}

/**
 * Show several disclaimers one after another and collect the user's
 * acceptances.
 *
 *   const acks = await queue.ask(requests); // null if the user backed out
 *
 * Render `queue.dialog` somewhere in the component.
 */
export function useDisclaimerQueue(): {
  ask: (
    items: DisclaimerRequest[],
  ) => Promise<Map<string, Acknowledgement> | null>;
  dialog: ReactNode;
} {
  const [state, setState] = useState<QueueState | null>(null);
  const resolver = useRef<
    ((value: Map<string, Acknowledgement> | null) => void) | null
  >(null);

  const ask = useCallback(
    (items: DisclaimerRequest[]) =>
      new Promise<Map<string, Acknowledgement> | null>((resolve) => {
        if (items.length === 0) {
          resolve(new Map());
          return;
        }
        resolver.current = resolve;
        setState({ items, index: 0, acks: new Map() });
      }),
    [],
  );

  const finish = (value: Map<string, Acknowledgement> | null) => {
    resolver.current?.(value);
    resolver.current = null;
    setState(null);
  };

  const current = state?.items[state.index];
  const dialog =
    state && current ? (
      <RiskDisclaimerDialog
        // A fresh dialog (unticked, empty phrase) for every disclaimer.
        key={`${state.index}-${current.disclaimer.statementSha256}`}
        disclaimer={current.disclaimer}
        segmentName={current.segmentName}
        position={{ current: state.index + 1, total: state.items.length }}
        onCancel={() => finish(null)}
        onAccept={(typed) => {
          const acks = new Map(state.acks);
          acks.set(
            current.segmentId,
            acknowledgementOf(current.disclaimer, typed),
          );
          if (state.index + 1 >= state.items.length) finish(acks);
          else setState({ ...state, index: state.index + 1, acks });
        }}
      />
    ) : null;

  return { ask, dialog };
}
