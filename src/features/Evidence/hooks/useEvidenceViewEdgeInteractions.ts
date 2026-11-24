import { useLatest } from '@/features/Core/hooks/useLatest';
import { useCallback, useState, useRef, useEffect, useMemo, RefObject } from 'react';
import { scrollToRef } from '@/features/Core/utils/arrayHelpers';
import { ResultSet, ResultEdge, Path } from '@/features/ResultList/types/results.d';
import { isResultEdge } from '@/features/ResultList/types/checkers';
import { getDataFromQueryVar } from '@/features/Core/utils/urlHelpers';
import { useSeenStatus } from '@/features/ResultItem/hooks/resultHooks';
import { useEvidenceData, useEdgeInitialization } from '@/features/Evidence/hooks/evidenceHooks';
import useInforesCatalogLookup from '@/features/Evidence/hooks/useInforesCatalogLookup';
import { resolveClickedEdge } from '@/features/Evidence/utils/utilities';
import { useResultsNavigate } from '@/features/Navigation/hooks/useResultsNavigate';
import { buildEvidenceUrl, extractCompressedEdgeSets } from '@/features/Navigation/utils/navigationUtils';
import {
  buildCompressedSubgraph,
  resolveSelectedEdgeGroup,
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

/**
 * IDs of every edge compressed into the same path slot as the given edge, the edge itself
 * included. An edge that is not part of a compressed slot is its own group.
 */
const getSeenGroupIds = (
  edgeId: string | undefined,
  path: Path | null,
  compressedEdgeSets: string[][],
): string[] => {
  const sets = path ? [...compressedEdgeSets, ...extractCompressedEdgeSets(path)] : compressedEdgeSets;
  return resolveSelectedEdgeGroup(edgeId, sets);
};

interface ToggleSeenParams {
  selectedEdge: ResultEdge | null;
  edgeSeen: boolean;
  path: Path | null;
  compressedEdgeSets: string[][];
  markEdgeSeen: (id: string) => void;
  markEdgeUnseen: (id: string) => void;
}

const useToggleSeenHandler = ({
  selectedEdge,
  edgeSeen,
  path,
  compressedEdgeSets,
  markEdgeSeen,
  markEdgeUnseen,
}: ToggleSeenParams) => {
  const selectedEdgeId = selectedEdge?.id;
  const seenGroupIds = useMemo(
    () => getSeenGroupIds(selectedEdgeId, path, compressedEdgeSets),
    [selectedEdgeId, path, compressedEdgeSets],
  );

  return useCallback(() => {
    if (!selectedEdgeId) {
      console.warn('Edge seen status cannot be toggled, selectedEdge is null.');
      return;
    }
    // A compressed edge counts as seen when any of its edges is, so un-marking has to clear them
    // all or the result list would keep showing it as seen.
    if (edgeSeen) seenGroupIds.forEach(id => markEdgeUnseen(id));
    else markEdgeSeen(selectedEdgeId);
  }, [selectedEdgeId, edgeSeen, seenGroupIds, markEdgeSeen, markEdgeUnseen]);
};

const useSelectedEdgeState = () => {
  const selectedEdgeDomRef = useRef<HTMLElement | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ResultEdge | null>(null);
  const selectedEdgeRef = useRef(selectedEdge);
  selectedEdgeRef.current = selectedEdge;
  return { selectedEdge, setSelectedEdge, selectedEdgeRef, selectedEdgeDomRef };
};

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
  nodeNameLookupSettled?: boolean;
}

// Wraps evidence handling with the lookups a canvas-only view uses in place of a result set: node names
// for the edge label, and infores catalog entries to name and link evidence sources.
const useEvidenceDataWithLookups = (
  handleEvidenceData: ReturnType<typeof useEvidenceData>['handleSelectedEdge'],
  nodeNameLookup: Record<string, string>,
  nodeNameLookupSettled: boolean,
  resolvedEdge: ResultEdge | null,
  isCanvasOnlyMode: boolean,
) => {
  const inforesCatalog = useInforesCatalogLookup(resolvedEdge, isCanvasOnlyMode);
  const handleEvidenceDataWithLookup = useCallback((
    rs: ResultSet | null,
    edge: ResultEdge,
  ) => {
    handleEvidenceData(rs, edge, nodeNameLookup, inforesCatalog.catalog);
  }, [handleEvidenceData, nodeNameLookup, inforesCatalog.catalog]);
  return {
    handleEvidenceDataWithLookup,
    canvasLookupsSettled: nodeNameLookupSettled && inforesCatalog.isSettled,
  };
};

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
  nodeNameLookupSettled = true,
}: EdgeInteractionParams) => {
  const resultsNavigate = useResultsNavigate();
  const decodedParamsRef = useLatest(decodedParams);
  const { selectedEdge, setSelectedEdge, selectedEdgeRef, selectedEdgeDomRef } = useSelectedEdgeState();

  const { isEdgeSeen, markEdgeSeen, markEdgeUnseen } = useSeenStatus(pk);
  const {
    publications,
    sources,
    clinicalTrials,
    drugLabels,
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

  const { handleEvidenceDataWithLookup, canvasLookupsSettled } = useEvidenceDataWithLookups(
    handleEvidenceData, nodeNameLookup, nodeNameLookupSettled, resolvedEdge, isCanvasOnlyMode,
  );

  useEdgeInitialization({
    edgeId,
    resolvedEdge,
    resultSet,
    isCanvasOnlyMode,
    canvasLookupsSettled,
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
  }, [selectedEdge, selectedEdgeDomRef]);

  const handleToggleSeen = useToggleSeenHandler({ selectedEdge, edgeSeen, path, compressedEdgeSets, markEdgeSeen, markEdgeUnseen });

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
    drugLabels,
    miscEvidence,
    sources,
  };
};

export default useEvidenceViewEdgeInteractions;
