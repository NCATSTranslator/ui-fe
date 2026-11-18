import { useCallback, useMemo } from 'react';
import { useResultListContext } from '@/features/ResultList/context/ResultListContext';
import { getAdjacentItems, type StepperHandlers } from '@/features/Navigation/utils/stepperUtils';
import { trackEvent } from '@/features/Analytics/utils/dataLayer';
import type { StepDirection } from '@/features/Analytics/types/analytics.d';

/**
 * Steps from the result being viewed to its neighbours in the result list,
 * following the list's current sort and filters. A result that has been
 * filtered out has no position in the list, so it has no neighbours.
 */
export const useResultStepper = (resultId: string): StepperHandlers => {
  const { visibleResultIds, resultsNavigate } = useResultListContext();

  const { index, previous, next } = useMemo(
    () => getAdjacentItems([...visibleResultIds], id => id === resultId),
    [visibleResultIds, resultId],
  );

  const goTo = useCallback((targetId: string, direction: StepDirection, targetIndex: number) => {
    trackEvent('view_stepped', {
      entity_type: 'result',
      step_direction: direction,
      result_rank: targetIndex + 1,
    });
    resultsNavigate(`/results/${targetId}`);
  }, [resultsNavigate]);

  return {
    goToPrevious: previous === null ? undefined : () => goTo(previous, 'previous', index - 1),
    goToNext: next === null ? undefined : () => goTo(next, 'next', index + 1),
  };
};
