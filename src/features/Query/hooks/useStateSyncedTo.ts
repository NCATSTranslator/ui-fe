import { useEffect, useState } from 'react';

/**
 * State that resets whenever `source` or optional `resetKey` changes (e.g. URL params).
 */
export const useStateSyncedTo = <T,>(source: T, resetKey?: unknown) => {
  const [state, setState] = useState(source);
  const syncKey = resetKey ?? source;

  useEffect(() => {
    setState(source);
  }, [syncKey, source]);

  return [state, setState] as const;
};
