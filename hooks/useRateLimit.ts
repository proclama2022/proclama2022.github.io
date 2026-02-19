import { useState, useEffect, useCallback } from 'react';
import { canIdentify, incrementIdentificationCount } from '@/services/rateLimiter';

/**
 * Hook to manage rate limiting state for plant identification.
 *
 * - `allowed`: whether the user can make another identification today
 * - `remaining`: how many identifications remain today
 * - `limit`: the daily cap (5)
 * - `checkLimit()`: re-query the rate limit state (e.g. on resume)
 * - `useScan()`: atomically check + increment; returns true if scan is allowed
 */
export function useRateLimit() {
  const [allowed, setAllowed] = useState(true);
  const [remaining, setRemaining] = useState(5);
  const [limit, setLimit] = useState(5);

  const checkLimit = useCallback(async () => {
    const result = await canIdentify();
    setAllowed(result.allowed);
    setRemaining(result.remaining);
    setLimit(result.limit);
    return result;
  }, []);

  /**
   * Attempt to consume a scan slot.
   * Returns true if the scan is allowed and the count was incremented.
   * Returns false if the daily limit has already been reached.
   */
  const useScan = useCallback(async (): Promise<boolean> => {
    const result = await checkLimit();
    if (result.allowed) {
      await incrementIdentificationCount();
      // Decrement remaining locally so UI updates immediately
      setRemaining((prev) => Math.max(0, prev - 1));
      return true;
    }
    return false;
  }, [checkLimit]);

  // Check limit on mount
  useEffect(() => {
    checkLimit();
  }, [checkLimit]);

  return { allowed, remaining, limit, checkLimit, useScan };
}
