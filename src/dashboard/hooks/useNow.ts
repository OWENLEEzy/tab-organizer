import { useEffect, useState } from 'react';

/**
 * Provides a stable timestamp that updates every second.
 * Used for time-dependent filtering (e.g., /stale command) where calling
 * Date.now() directly in useMemo would violate react-hooks/purity.
 */
export function useNow(): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000) * 1000);

  useEffect(() => {
    // Update once per second — sufficient for stale tab detection.
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000) * 1000);
    }, 1_000);

    return () => clearInterval(interval);
  }, []);

  return now;
}