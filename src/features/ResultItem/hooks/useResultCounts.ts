import { useMemo } from 'react';
import { Result, ResultBookmark, ResultSet } from '@/features/ResultList/types/results';
import { getEvidenceCounts } from '@/features/Evidence/utils/utilities';
import { getPathCount } from '@/features/Core/utils/resultHelpers';

/**
 * Evidence and path counts for a result, preferring the values precalculated
 * on the result set and falling back to computing them from its paths.
 */
export const useResultCounts = (resultSet: ResultSet | null, result: Result | ResultBookmark | undefined) => {
  const evidenceCounts = useMemo(
    () => result ? (result.evidenceCount ?? getEvidenceCounts(resultSet, result)) : null,
    [resultSet, result]
  );
  const pathCount = useMemo(() => {
    if (result?.pathCount !== undefined) return result.pathCount;
    if (!resultSet || !result) return 0;
    return getPathCount(resultSet, result.paths);
  }, [resultSet, result]);
  return { evidenceCounts, pathCount };
};
