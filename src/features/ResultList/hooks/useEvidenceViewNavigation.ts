import { useCallback } from 'react';
import { useResultsNavigate } from '@/features/Navigation/hooks/useResultsNavigate';
import { buildEvidenceUrl, extractCompressedEdgeSets } from '@/features/Navigation/utils/navigationUtils';
import { EvidenceNavigationOptions } from '@/features/Evidence/types/navigation';

export interface UseEvidenceViewNavigationReturn {
  navigateToEvidenceView: (options: EvidenceNavigationOptions) => void;
}

const useEvidenceViewNavigation = (resultId?: string): UseEvidenceViewNavigationReturn => {
  const resultsNavigate = useResultsNavigate();

  const navigateToEvidenceView = useCallback((options: EvidenceNavigationOptions) => {
    if (!resultId) return;
    const sets = options.compressedEdgeSets
      ?? (options.path ? extractCompressedEdgeSets(options.path) : []);
    const { path: url, params } = buildEvidenceUrl({
      resultId,
      pathId: options.path?.id,
      primaryEdgeId: options.edgeId,
      compressedEdgeSets: sets,
      pathKey: options.pathKey,
      tab: options.tab,
    });
    resultsNavigate(url, params);
  }, [resultsNavigate, resultId]);

  return {
    navigateToEvidenceView,
  };
};

export default useEvidenceViewNavigation;
