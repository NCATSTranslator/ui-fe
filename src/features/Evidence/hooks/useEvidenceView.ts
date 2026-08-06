import { useContext } from 'react';
import ResultListContext from '@/features/ResultList/context/ResultListContext';
import { getIsPathIdFiltered } from '@/features/ResultItem/utils/utilities';
import useEvidenceViewRouteData from '@/features/Evidence/hooks/useEvidenceViewRouteData';
import useEvidenceViewEdgeInteractions from '@/features/Evidence/hooks/useEvidenceViewEdgeInteractions';
import { computeNonReadyStatus, resolveEvidenceSubtitle } from '@/features/Evidence/hooks/evidenceViewHelpers';
import type { EvidenceViewModel } from '@/features/Evidence/hooks/evidenceViewTypes';
import type { ResultEdge } from '@/features/ResultList/types/results.d';

export type { EvidenceViewContentProps, EvidenceViewModel } from '@/features/Evidence/hooks/evidenceViewTypes';

const NOOP = () => { return; };

/**
 * Custom hook encapsulating all data, derivation, and callbacks for EvidenceView.
 */
export const useEvidenceView = (): EvidenceViewModel => {
  const resultListContext = useContext(ResultListContext);
  const routeData = useEvidenceViewRouteData();
  const edgeData = useEvidenceViewEdgeInteractions(routeData);

  const nonReadyStatus = computeNonReadyStatus({
    queryId: routeData.queryId,
    resultSet: routeData.resultSet,
    queryStatus: routeData.queryStatus,
    result: routeData.result,
    selectedEdge: edgeData.selectedEdge,
    resolvedEdge: routeData.resolvedEdge,
    resultId: routeData.resultId,
    edgeId: routeData.edgeId,
    isCanvasOnlyMode: routeData.isCanvasOnlyMode,
    canvasEdgeLoading: routeData.canvasEdgeLoading,
    canvasEdgeError: routeData.canvasEdgeError,
  });

  if (nonReadyStatus) return nonReadyStatus;

  const isFilteredOut = !!routeData.pathId
    && getIsPathIdFiltered(
      routeData.resultSet,
      routeData.pathId,
      routeData.result?.paths,
      resultListContext?.pathFilterState ?? undefined,
    )
    && !resultListContext?.showHiddenPaths;

  return {
    status: 'ready',
    content: {
      edgeLabel: edgeData.edgeLabel,
      evidenceSubtitle: resolveEvidenceSubtitle(routeData.canvasId, routeData.pathKey),
      edgeSeen: edgeData.edgeSeen,
      handleToggleSeen: edgeData.handleToggleSeen,
      path: routeData.path,
      compressedSubgraph: edgeData.compressedSubgraph,
      handleEdgeClick: edgeData.handleEdgeClick,
      pk: routeData.pk,
      selectedEdge: edgeData.selectedEdge as ResultEdge,
      selectedEdgeDomRef: edgeData.selectedEdgeDomRef,
      isInferred: edgeData.isInferred,
      isFilteredOut,
      onClearFilters: resultListContext?.handleClearAllFilters ?? NOOP,
      publications: edgeData.publications,
      setPublications: edgeData.setPublications,
      clinicalTrials: edgeData.clinicalTrials,
      miscEvidence: edgeData.miscEvidence,
      sources: edgeData.sources,
      prefs: routeData.prefs,
      initialTab: routeData.initialTab,
      isCanvasOnlyMode: routeData.isCanvasOnlyMode,
    },
  };
};
