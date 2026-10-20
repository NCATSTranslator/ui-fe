import { useRef, RefObject } from 'react';

/**
 * A ref that always holds the latest value, for reading current props or state
 * from stable callbacks and effects without listing them as dependencies.
 */
export const useLatest = <T,>(value: T): RefObject<T> => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};
