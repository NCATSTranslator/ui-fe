import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useResultListContext } from '@/features/ResultList/context/ResultListContext';
import { getResultById, getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { getFormattedPaths, getVisiblePaths, NO_PATH_FILTER_STATE } from '@/features/ResultItem/utils/utilities';
import { useOpenPathEvidence } from '@/features/ResultItem/hooks/useOpenPathEvidence';
import { getAdjacentItems, type StepperHandlers } from '@/features/Navigation/utils/stepperUtils';
import { trackEvent } from '@/features/Analytics/utils/dataLayer';
import type { StepDirection } from '@/features/Analytics/types/analytics.d';
import type { Path } from '@/features/ResultList/types/results.d';

/**
 * Steps from the path being viewed to its neighbours within the same result,
 * in the order the result's path list shows them: ranked, with excluded paths
 * left out unless they are being shown. A path that has been filtered out of
 * that list has no position in it, so it has no neighbours.
 *
 * Reads the result and path from the route, so it belongs on a path's evidence view.
 */
export const usePathStepper = (): StepperHandlers => {
  const { resultId, pathId } = useParams();
  const { pk, pathFilterState, pathRankState, showHiddenPaths } = useResultListContext();
  const openPathEvidence = useOpenPathEvidence();
  const resultSet = useSelector(getResultSetById(pk));
  const effectivePathFilterState = pathFilterState ?? NO_PATH_FILTER_STATE;

  const formattedPaths = useMemo(() => {
    const result = resultId ? getResultById(resultSet, resultId) : undefined;
    return getFormattedPaths(resultSet, result?.paths, effectivePathFilterState, pathRankState);
  }, [resultSet, resultId, effectivePathFilterState, pathRankState]);

  const { previous, next } = useMemo(() => {
    const { visiblePaths } = getVisiblePaths(formattedPaths, effectivePathFilterState, showHiddenPaths);
    // The route can name any member of a compressed path, which is listed once under its first member.
    return getAdjacentItems(
      visiblePaths,
      path => !!pathId && (path.id === pathId || !!path.compressedIDs?.includes(pathId)),
    );
  }, [formattedPaths, effectivePathFilterState, showHiddenPaths, pathId]);

  const goTo = useCallback((target: Path, direction: StepDirection) => {
    // Paths are numbered by their place among all of the result's paths, excluded ones included.
    const pathNumber = formattedPaths.indexOf(target) + 1;
    if (!openPathEvidence({ path: target, pathNumber, resultId })) return;

    trackEvent('view_stepped', {
      entity_type: 'path',
      step_direction: direction,
      path_rank: pathNumber,
    });
  }, [formattedPaths, openPathEvidence, resultId]);

  return {
    goToPrevious: previous ? () => goTo(previous, 'previous') : undefined,
    goToNext: next ? () => goTo(next, 'next') : undefined,
  };
};
