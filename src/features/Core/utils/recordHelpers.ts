/**
 * Returns `prev` when `next` has the same keys and the same value references, otherwise `next`.
 * Keeps React dependency arrays stable when a derived record is rebuilt with identical contents.
 */
export const reuseRecordIfEqual = <T>(
  prev: Record<string, T>,
  next: Record<string, T>,
): Record<string, T> => {
  const nextKeys = Object.keys(next);
  if (
    Object.keys(prev).length === nextKeys.length
    && nextKeys.every(key => prev[key] === next[key])
  ) {
    return prev;
  }
  return next;
};
