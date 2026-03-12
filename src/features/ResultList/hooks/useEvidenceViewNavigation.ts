import { useCallback } from 'react';
import { Result, Path } from '@/features/ResultList/types/results.d';
import { useResultsNavigate } from '@/features/Navigation/hooks/useResultsNavigate';

export interface UseEvidenceViewNavigationReturn {
  navigateToEvidenceView: (item: Result, edgeID: string[], path: Path) => void;
}

const useEvidenceViewNavigation = (): UseEvidenceViewNavigationReturn => {
  const resultsNavigate = useResultsNavigate();

  const navigateToEvidenceView = useCallback((item: Result, edgeID: string[], path: Path) => {
    const primaryEdgeId = edgeID[0];
    const encodedEdgeId = encodeURIComponent(primaryEdgeId);

    if (path.id) {
      resultsNavigate(`/results/${item.id}/path/${path.id}/evidence/${encodedEdgeId}`);
    } else {
      resultsNavigate(`/results/${item.id}/evidence/${encodedEdgeId}`);
    }
  }, [resultsNavigate]);

  return {
    navigateToEvidenceView,
  };
};

export default useEvidenceViewNavigation;
