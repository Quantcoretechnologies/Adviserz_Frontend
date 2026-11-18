import { useMemo, useSyncExternalStore } from "react";

/**
 * A typed value kept in sessionStorage: it survives a page reload but is
 * scoped to the tab and gone when the tab closes. Used for short-lived,
 * multi-step flow state (for example "which number are we verifying").
 */
export interface SessionStore<T> {
  get: () => T | null;
  set: (value: T) => void;
  clear: () => void;
  /** Subscribe a component to the value. Is `null` during server rendering. */
  useValue: () => T | null;
}

export function createSessionStore<T>(key: string): SessionStore<T> {
  const listeners = new Set<() => void>();

  const readRaw = (): string | null => {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      // Storage can be unavailable (private mode, blocked site data).
      return null;
    }
  };

  const parse = (raw: string | null): T | null => {
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  };

  const notify = () => listeners.forEach((listener) => listener());

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    get: () => parse(readRaw()),
    set: (value) => {
      try {
        window.sessionStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Nothing to do: the flow simply will not survive a reload.
      }
      notify();
    },
    clear: () => {
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        // Ignore: see above.
      }
      notify();
    },
    useValue: () => {
      const raw = useSyncExternalStore(subscribe, readRaw, () => null);
      return useMemo(() => parse(raw), [raw]);
    },
  };
}
