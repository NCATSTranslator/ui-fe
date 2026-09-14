import { useEffect, useState } from 'react';
import { LOOKUP_SETTLE_TIMEOUT_MS } from '@/features/Core/utils/lookupTimeout';

export { LOOKUP_SETTLE_TIMEOUT_MS } from '@/features/Core/utils/lookupTimeout';

/**
 * Becomes true after `timeoutMs` while `isWaiting` stays true. Resets when waiting ends
 * so a later wait starts a fresh timer.
 */
const useSettleTimeout = (
  isWaiting: boolean,
  timeoutMs: number = LOOKUP_SETTLE_TIMEOUT_MS,
): boolean => {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isWaiting) {
      setTimedOut(false);
      return;
    }
    const id = window.setTimeout(() => setTimedOut(true), timeoutMs);
    return () => window.clearTimeout(id);
  }, [isWaiting, timeoutMs]);

  return timedOut;
};

export default useSettleTimeout;
