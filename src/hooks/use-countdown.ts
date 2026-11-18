import { useEffect, useState } from "react";

/**
 * Whole seconds remaining until `targetTime` (epoch milliseconds), ticking
 * once a second and stopping at 0.
 */
export function useCountdown(targetTime: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [targetTime]);

  return Math.max(0, Math.ceil((targetTime - now) / 1000));
}
