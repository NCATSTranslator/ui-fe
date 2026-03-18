import { useCallback } from 'react';
import { Path } from '@/features/ResultList/types/results.d';
import { useResultsNavigate } from '@/features/Navigation/hooks/useResultsNavigate';

export interface UseEvidenceViewNavigationReturn {
  navigateToEvidenceView: (edgeID: string[], path: Path, pathKey: string) => void;
}

const useEvidenceViewNavigation = (resultId?: string): UseEvidenceViewNavigationReturn => {
  const resultsNavigate = useResultsNavigate();

  const navigateToEvidenceView = useCallback((edgeID: string[], path: Path, pathKey: string) => {
    if (!resultId) return;
    const primaryEdgeId = edgeID[0];
    const encodedEdgeId = encodeURIComponent(primaryEdgeId);
    const extraParams = pathKey ? { pkey: pathKey } : undefined;

    if (path.id) {
      resultsNavigate(`/results/${resultId}/path/${path.id}/evidence/${encodedEdgeId}`, extraParams);
    } else {
      resultsNavigate(`/results/${resultId}/evidence/${encodedEdgeId}`, extraParams);
    }
  }, [resultsNavigate, resultId]);

  return {
    navigateToEvidenceView,
  };
};

export default useEvidenceViewNavigation;
