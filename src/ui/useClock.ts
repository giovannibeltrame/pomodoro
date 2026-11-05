import { useEffect, useState } from 'react';

/**
 * Current time, refreshed on each whole second left until `endsAt` while a
 * timer runs, and on each minute boundary otherwise so day and week views
 * roll over without interaction.
 */
export function useClock(endsAt: number | null): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    let id = 0;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const delay = endsAt === null ? 60_000 - (t % 60_000) : (endsAt - t) % 1000 || 1000;
      id = window.setTimeout(tick, Math.max(delay, 20));
    };
    tick();
    return () => clearTimeout(id);
  }, [endsAt]);
  return now;
}
