export interface AdjacentItems<T> {
  /** Position of the current item in the sequence, or -1 when it is not part of it. */
  index: number;
  previous: T | null;
  next: T | null;
}

/** What a stepper hook hands to StepperButtons. */
export interface StepperHandlers {
  /** Undefined when there is nothing before the current item to step to. */
  goToPrevious?: () => void;
  /** Undefined when there is nothing after the current item to step to. */
  goToNext?: () => void;
}

/**
 * Finds the items on either side of the current one in an ordered sequence.
 * There is no wrap-around: the first item has no previous and the last has no next.
 * When the current item is not in the sequence (e.g. it has been filtered out)
 * it has no position to step from, so both neighbours are null.
 */
export const getAdjacentItems = <T>(
  items: readonly T[],
  isCurrent: (item: T) => boolean,
): AdjacentItems<T> => {
  const index = items.findIndex(isCurrent);
  if (index === -1) return { index, previous: null, next: null };

  return {
    index,
    previous: index > 0 ? items[index - 1] : null,
    next: index < items.length - 1 ? items[index + 1] : null,
  };
};
