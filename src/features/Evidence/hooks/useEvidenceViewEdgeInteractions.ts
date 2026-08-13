import { useCallback, useState, useRef, useEffect, useMemo, RefObject } from 'react';
import { scrollToRef } from '@/features/Core/utils/arrayHelpers';
import { ResultSet, ResultEdge, Path } from '@/features/ResultList/types/results.d';
import { isResultEdge } from '@/features/ResultList/types/checkers';
import { getDataFromQueryVar } from '@/features/Core/utils/urlHelpers';
import { useSeenStatus } from '@/features/ResultItem/hooks/resultHooks';
import { useEvidenceData, useEdgeInitialization } from '@/features/Evidence/hooks/evidenceHooks';
import { resolveClickedEdge } from '@/features/Evidence/utils/utilities';
import { useResultsNavigate } from '@/features/Navigation/hooks/useResultsNavigate';
import { buildEvidenceUrl } from '@/features/Navigation/utils/navigationUtils';
import {
  buildCompressedSubgraph,
  type DecodedParams,
} from '@/features/Evidence/hooks/evidenceViewHelpers';
import type { CompressedSubgraph } from '@/features/Evidence/hooks/evidenceViewTypes';

interface EdgeClickHandlerParams {
  resultSet: ResultSet | null | undefined;
  compressedSubgraph: CompressedSubgraph;
  compressedEdgeSets: string[][];
  resultId?: string;
  pathId?: string;
  decodedParamsRef: RefObject<DecodedParams>;
  selectedEdgeRef: RefObject<ResultEdge | null>;
  setSelectedEdge: (edge: ResultEdge) => void;
  handleEvidenceData: (
    resultSet: ResultSet | null,
    edge: ResultEdge,
    nodeNameLookup?: Record<string, string>,
  ) => void;
  markEdgeSeen: (id: string) => void;
  resultsNavigate: ReturnType<typeof useResultsNavigate>;
  nodeNameLookup: Record<string, string>;
}

const useEvidenceEdgeClickHandler = ({
  resultSet,
  compressedSubgraph,
  compressedEdgeSets,
  resultId,
  pathId,
  decodedParamsRef,
  selectedEdgeRef,
  setSelectedEdge,
  handleEvidenceData,
  markEdgeSeen,
  resultsNavigate,
  nodeNameLookup,
}: EdgeClickHandlerParams) => useCallback((edgeIDs: string[]) => {
  if (!resultSet) return;

  const edge = resolveClickedEdge(resultSet, compressedSubgraph, edgeIDs);
  if (!isResultEdge(edge) || !selectedEdgeRef.current) return;
  if (edge.id === selectedEdgeRef.current.id) return;

  setSelectedEdge(edge);
  handleEvidenceData(resultSet, edge, nodeNameLookup);
  markEdgeSeen(edge.id);

  if (resultId) {
    const { path: url, params } = buildEvidenceUrl({
      resultId,
      pathId,
      primaryEdgeId: edge.id,
      compressedEdgeSets,
      pathKey: getDataFromQueryVar('pkey', decodedParamsRef.current) ?? undefined,
    });
    resultsNavigate(url, params, { replace: true });
  }
}, [
  resultSet,
  compressedSubgraph,
  compressedEdgeSets,
  handleEvidenceData,
  markEdgeSeen,
  resultsNavigate,
  resultId,
  pathId,
  decodedParamsRef,
  selectedEdgeRef,
  setSelectedEdge,
  nodeNameLookup,
]);

const useToggleSeenHandler = (
  selectedEdge: ResultEdge | null,
  edgeSeen: boolean,
  markEdgeSeen: (id: string) => void,
  markEdgeUnseen: (id: string) => void,
) => useCallback(() => {
  if (!selectedEdge?.id) {
    console.warn('Edge seen status cannot be toggled, selectedEdge is null.');
    return;
  }
  if (edgeSeen) markEdgeUnseen(selectedEdge.id);
  else markEdgeSeen(selectedEdge.id);
}, [selectedEdge?.id, edgeSeen, markEdgeSeen, markEdgeUnseen]);

interface EdgeInteractionParams {
  edgeId?: string;
  pathId?: string;
  resultId?: string;
  decodedParams: DecodedParams;
  resultSet: ResultSet | null | undefined;
  path: Path | null;
  resolvedEdge: ResultEdge | null;
  compressedEdgeSets: string[][];
  pk: string;
  isCanvasOnlyMode?: boolean;
  nodeNameLookup?: Record<string, string>;
}

const useEvidenceViewEdgeInteractions = ({
  edgeId,
  pathId,
  resultId,
  decodedParams,
  resultSet,
  path,
  resolvedEdge,
  compressedEdgeSets,
  pk,
  isCanvasOnlyMode = false,
  nodeNameLookup = {},
}: EdgeInteractionParams) => {
  const resultsNavigate = useResultsNavigate();
  const decodedParamsRef = useRef(decodedParams);
  decodedParamsRef.current = decodedParams;

  const selectedEdgeDomRef = useRef<HTMLElement | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ResultEdge | null>(null);
  const selectedEdgeRef = useRef(selectedEdge);
  selectedEdgeRef.current = selectedEdge;

  const { isEdgeSeen, markEdgeSeen, markEdgeUnseen } = useSeenStatus(pk);
  const {
    publications,
    sources,
    clinicalTrials,
    miscEvidence,
    handleSelectedEdge: handleEvidenceData,
    setPublications,
    edgeLabel,
  } = useEvidenceData();

  const edgeSeen = !!selectedEdge?.id && isEdgeSeen(selectedEdge.id);
  const compressedSubgraph = useMemo(
    () => buildCompressedSubgraph(path, resultSet, compressedEdgeSets),
    [path, resultSet, compressedEdgeSets],
  );

  const handleEvidenceDataWithLookup = useCallback((
    rs: ResultSet | null,
    edge: ResultEdge,
  ) => {
    handleEvidenceData(rs, edge, nodeNameLookup);
  }, [handleEvidenceData, nodeNameLookup]);

  useEdgeInitialization({
    edgeId,
    resolvedEdge,
    resultSet,
    isCanvasOnlyMode,
    setSelectedEdge,
    handleEvidenceData: handleEvidenceDataWithLookup,
    markEdgeSeen,
  });

  const handleEdgeClick = useEvidenceEdgeClickHandler({
    resultSet,
    compressedSubgraph,
    compressedEdgeSets,
    resultId,
    pathId,
    decodedParamsRef,
    selectedEdgeRef,
    setSelectedEdge,
    handleEvidenceData,
    markEdgeSeen,
    resultsNavigate,
    nodeNameLookup,
  });

  useEffect(() => {
    if (selectedEdge) scrollToRef(selectedEdgeDomRef);
  }, [selectedEdge]);

  const handleToggleSeen = useToggleSeenHandler(selectedEdge, edgeSeen, markEdgeSeen, markEdgeUnseen);

  return {
    selectedEdge,
    selectedEdgeDomRef,
    edgeLabel,
    edgeSeen,
    compressedSubgraph,
    handleEdgeClick,
    handleToggleSeen,
    publications,
    setPublications,
    clinicalTrials,
    miscEvidence,
    sources,
  };
};

export default useEvidenceViewEdgeInteractions;
