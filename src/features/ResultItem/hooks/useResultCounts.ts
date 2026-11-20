import { useMemo } from 'react';
import { Result, ResultBookmark, ResultSet } from '@/features/ResultList/types/results';
import { getEvidenceCounts, getMaxEvidenceTotal } from '@/features/Evidence/utils/utilities';
import { getPathCount } from '@/features/Core/utils/resultHelpers';

/**
 * Evidence and path counts for a result, preferring the values precalculated
 * on the result set and falling back to computing them from its paths. Also
 * returns the largest evidence total of any result in the set, for sizing the
 * result's evidence bar relative to the rest of the query.
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
  // Cached per result set, so every result row shares a single pass over the results
  const maxEvidenceTotal = getMaxEvidenceTotal(resultSet);
  return { evidenceCounts, pathCount, maxEvidenceTotal };
};
