/**
 * Shared immutable defaults. Returning a fresh literal from a render or a selector
 * gives consumers a new reference every time, which invalidates memoized children
 * and re-runs `useSelector` subscribers. Reach for these instead.
 */

export const noop = () => undefined;

export const EMPTY_STRING_ARRAY: string[] = [];
