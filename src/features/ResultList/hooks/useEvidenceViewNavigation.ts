import { useCallback } from 'react';
import { Path } from '@/features/ResultList/types/results.d';
import { useResultsNavigate } from '@/features/Navigation/hooks/useResultsNavigate';
import { buildEvidenceUrl } from '@/features/Navigation/utils/navigationUtils';

export interface UseEvidenceViewNavigationReturn {
  navigateToEvidenceView: (selectedEdgeId: string, compressedEdgeSets: string[][], path: Path, pathKey: string) => void;
}

const useEvidenceViewNavigation = (resultId?: string): UseEvidenceViewNavigationReturn => {
  const resultsNavigate = useResultsNavigate();

  const navigateToEvidenceView = useCallback((selectedEdgeId: string, compressedEdgeSets: string[][], path: Path, pathKey: string) => {
    if (!resultId) return;
    const { path: url, params } = buildEvidenceUrl({
      resultId,
      pathId: path.id,
      primaryEdgeId: selectedEdgeId,
      compressedEdgeSets,
      pathKey,
    });
    resultsNavigate(url, params);
  }, [resultsNavigate, resultId]);

  return {
    navigateToEvidenceView,
  };
};

export default useEvidenceViewNavigation;
