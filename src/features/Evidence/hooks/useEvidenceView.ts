import { useCallback, useState, useRef, useEffect, Dispatch, SetStateAction, useMemo, useContext, RefObject } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getResultSetById, getResultById, getPathById } from '@/features/ResultList/slices/resultsSlice';
import { getQueryStatusById } from '@/features/ResultList/slices/queryStatusSlice';
import { getDataFromQueryVar } from '@/features/Core/utils/urlHelpers';
import { scrollToRef } from '@/features/Core/utils/arrayHelpers';
import { getCompressedSubgraph, getCompressedEdge } from '@/features/Core/utils/resultHelpers';
import { ResultSet, ResultEdge, ResultNode, Path } from '@/features/ResultList/types/results.d';
import { isResultEdge } from '@/features/ResultList/types/checkers';
import { useDecodedParams } from '@/features/Core/hooks/useDecodedParams';
import { currentPrefs } from '@/features/UserAuth/slices/userSlice';
import { useSeenStatus } from '@/features/ResultItem/hooks/resultHooks';
import { useEvidenceData, useEdgeInitialization } from '@/features/Evidence/hooks/evidenceHooks';
import { resolveClickedEdge } from '@/features/Evidence/utils/utilities';
import { useResultsNavigate } from '@/features/Navigation/hooks/useResultsNavigate';
import { derivePathKey, resolveEdgeFromPath, buildEvidenceUrl } from '@/features/Navigation/utils/navigationUtils';
import { isNodeIndex } from '@/features/ResultList/utils/resultsInteractionFunctions';
import { EvidenceTabName } from '@/features/Evidence/types/navigation';
import { isValidEvidenceTabName } from '@/features/Evidence/types/checkers';
import ResultListContext from '@/features/ResultList/context/ResultListContext';
import { PublicationObject, Provenance, TrialObject } from '@/features/Evidence/types/evidence';
import { Preferences } from '@/features/UserAuth/types/user';

const NOOP = () => { return; };

type CompressedSubgraph = (ResultNode | ResultEdge | ResultEdge[])[] | false;

export interface EvidenceViewContentProps {
  edgeLabel: string | null;
  pathKey: string;
  edgeSeen: boolean;
  handleToggleSeen: () => void;
  path: Path | null;
  compressedSubgraph: CompressedSubgraph;
  handleEdgeClick: (edgeIDs: string[]) => void;
  pk: string;
  selectedEdge: ResultEdge;
  selectedEdgeDomRef: RefObject<HTMLElement | null>;
  isInferred: boolean;
  isFilteredOut: boolean;
  onClearFilters: () => void;
  publications: PublicationObject[];
  setPublications: Dispatch<SetStateAction<PublicationObject[]>>;
  clinicalTrials: TrialObject[];
  miscEvidence: PublicationObject[];
  sources: Provenance[];
  prefs: Preferences;
  initialTab: EvidenceTabName | undefined;
}

export type EvidenceViewModel =
  | { status: 'no-query' }
  | { status: 'loading' }
  | { status: 'no-result'; resultId?: string }
  | { status: 'no-edge'; edgeId?: string }
  | { status: 'ready'; content: EvidenceViewContentProps };

type DecodedParams = ReturnType<typeof useDecodedParams>;

const parseCompressedEdgeSets = (decodedParams: DecodedParams): string[][] => {
  const ceidsParam = getDataFromQueryVar("ceids", decodedParams);
  if (!ceidsParam) return [];
  return ceidsParam.split('|').map(group => group.split(','));
};

const resolveSelectedEdgeGroup = (decodedEdgeId: string | undefined, compressedEdgeSets: string[][]): string[] => {
  if (!decodedEdgeId) return [];
  const match = compressedEdgeSets.find(g => g.includes(decodedEdgeId));
  return match ?? [decodedEdgeId];
};

const resolveEvidenceEdge = (
  resultSet: ResultSet | null | undefined,
  path: Path | null,
  decodedEdgeId: string | undefined,
  selectedEdgeGroup: string[],
): ResultEdge | null => {
  if (!resultSet || !decodedEdgeId) return null;
  if (selectedEdgeGroup.length > 1) {
    const ordered = [decodedEdgeId, ...selectedEdgeGroup.filter(id => id !== decodedEdgeId)];
    return getCompressedEdge(resultSet, ordered);
  }
  return resolveEdgeFromPath(resultSet, path, decodedEdgeId);
};

const buildCompressedSubgraph = (
  path: Path | null,
  resultSet: ResultSet | null | undefined,
  compressedEdgeSets: string[][],
): CompressedSubgraph => {
  if (path?.compressedSubgraph && resultSet) {
    return getCompressedSubgraph(resultSet, path.compressedSubgraph);
  }
  if (path && resultSet && compressedEdgeSets.length > 0) {
    const compressedRaw: (string | string[])[] = path.subgraph.map((id, index) => {
      if (!isNodeIndex(index)) {
        const match = compressedEdgeSets.find(g => g.includes(id));
        if (match) return match;
      }
      return id;
    });
    return getCompressedSubgraph(resultSet, compressedRaw);
  }
  return false;
};

const parseInitialTab = (decodedParams: DecodedParams): EvidenceTabName | undefined => {
  const rawTabParam = getDataFromQueryVar("tab", decodedParams);
  return isValidEvidenceTabName(rawTabParam ?? "") ? rawTabParam as EvidenceTabName : undefined;
};

interface StatusParams {
  queryId: string | null | undefined;
  resultSet: ResultSet | null | undefined;
  queryStatus: { isLoading?: boolean } | null | undefined;
  result: ReturnType<typeof getResultById> | undefined;
  selectedEdge: ResultEdge | null;
  resolvedEdge: ResultEdge | null;
  resultId?: string;
  edgeId?: string;
}

const computeNonReadyStatus = ({
  queryId,
  resultSet,
  queryStatus,
  result,
  selectedEdge,
  resolvedEdge,
  resultId,
  edgeId,
}: StatusParams): Exclude<EvidenceViewModel, { status: 'ready' }> | null => {
  if (!queryId) return { status: 'no-query' };
  if (!resultSet && (!queryStatus || queryStatus.isLoading)) return { status: 'loading' };
  if (!result) return { status: 'no-result', resultId };
  if (!selectedEdge) {
    if (!resolvedEdge) return { status: 'no-edge', edgeId };
    return { status: 'loading' };
  }
  return null;
};

const useEvidenceViewRouteData = () => {
  const { resultId, edgeId, pathId } = useParams();
  const decodedParams = useDecodedParams();
  const queryId = getDataFromQueryVar("q", decodedParams);

  const prefs = useSelector(currentPrefs);
  const resultSet = useSelector(getResultSetById(queryId));
  const queryStatus = useSelector(getQueryStatusById(queryId));

  const result = useMemo(() => resultId ? getResultById(resultSet, resultId) : undefined, [resultSet, resultId]);
  const path = useMemo(() => {
    if (!resultSet || !pathId) return null;
    return getPathById(resultSet, pathId);
  }, [resultSet, pathId]);

  const decodedEdgeId = useMemo(() => edgeId ? decodeURIComponent(edgeId) : undefined, [edgeId]);
  const compressedEdgeSets = useMemo(() => parseCompressedEdgeSets(decodedParams), [decodedParams]);
  const selectedEdgeGroup = useMemo(
    () => resolveSelectedEdgeGroup(decodedEdgeId, compressedEdgeSets),
    [decodedEdgeId, compressedEdgeSets],
  );
  const resolvedEdge = useMemo(
    () => resolveEvidenceEdge(resultSet, path, decodedEdgeId, selectedEdgeGroup),
    [resultSet, path, decodedEdgeId, selectedEdgeGroup],
  );
  const pathKey = useMemo(
    () => getDataFromQueryVar("pkey", decodedParams) ?? derivePathKey(resultSet, result, pathId) ?? "",
    [decodedParams, resultSet, result, pathId],
  );
  const initialTab = parseInitialTab(decodedParams);

  return {
    resultId,
    edgeId,
    pathId,
    decodedParams,
    queryId,
    prefs,
    resultSet,
    queryStatus,
    result,
    path,
    decodedEdgeId,
    compressedEdgeSets,
    selectedEdgeGroup,
    resolvedEdge,
    pathKey,
    initialTab,
    pk: queryId || "",
  };
};

interface EdgeClickHandlerParams {
  resultSet: ResultSet | null | undefined;
  compressedSubgraph: CompressedSubgraph;
  compressedEdgeSets: string[][];
  resultId?: string;
  pathId?: string;
  decodedParamsRef: RefObject<DecodedParams>;
  selectedEdgeRef: RefObject<ResultEdge | null>;
  setSelectedEdge: (edge: ResultEdge) => void;
  handleEvidenceData: (resultSet: ResultSet, edge: ResultEdge) => void;
  markEdgeSeen: (id: string) => void;
  resultsNavigate: ReturnType<typeof useResultsNavigate>;
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
}: EdgeClickHandlerParams) => useCallback((edgeIDs: string[]) => {
  if (!resultSet) return;

  const edge = resolveClickedEdge(resultSet, compressedSubgraph, edgeIDs);
  if (!isResultEdge(edge) || !selectedEdgeRef.current) return;
  if (edge.id === selectedEdgeRef.current.id) return;

  setSelectedEdge(edge);
  handleEvidenceData(resultSet, edge);
  markEdgeSeen(edge.id);

  if (resultId) {
    const { path: url, params } = buildEvidenceUrl({
      resultId,
      pathId,
      primaryEdgeId: edge.id,
      compressedEdgeSets,
      pathKey: getDataFromQueryVar("pkey", decodedParamsRef.current) ?? undefined,
    });
    resultsNavigate(url, params, { replace: true });
  }
}, [resultSet, compressedSubgraph, compressedEdgeSets, handleEvidenceData, markEdgeSeen, resultsNavigate, resultId, pathId, decodedParamsRef, selectedEdgeRef, setSelectedEdge]);

const useToggleSeenHandler = (
  selectedEdge: ResultEdge | null,
  edgeSeen: boolean,
  markEdgeSeen: (id: string) => void,
  markEdgeUnseen: (id: string) => void,
) => useCallback(() => {
  if (!selectedEdge?.id) {
    console.warn("Edge seen status cannot be toggled, selectedEdge is null.");
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
}: EdgeInteractionParams) => {
  const resultsNavigate = useResultsNavigate();
  const decodedParamsRef = useRef(decodedParams);
  decodedParamsRef.current = decodedParams;

  const selectedEdgeDomRef = useRef<HTMLElement | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ResultEdge | null>(null);
  const selectedEdgeRef = useRef(selectedEdge);
  selectedEdgeRef.current = selectedEdge;
  const [edgeLabel, setEdgeLabel] = useState<string | null>(null);

  const { isEdgeSeen, markEdgeSeen, markEdgeUnseen } = useSeenStatus(pk);
  const {
    publications,
    sources,
    clinicalTrials,
    miscEvidence,
    handleSelectedEdge: handleEvidenceData,
    setPublications,
  } = useEvidenceData({ setEdgeLabel });

  const isInferred = selectedEdge?.inferred ?? false;
  const edgeSeen = !!selectedEdge?.id && isEdgeSeen(selectedEdge.id);
  const compressedSubgraph = useMemo(
    () => buildCompressedSubgraph(path, resultSet, compressedEdgeSets),
    [path, resultSet, compressedEdgeSets],
  );

  useEdgeInitialization({
    edgeId,
    resolvedEdge,
    resultSet,
    setSelectedEdge,
    handleEvidenceData,
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
  });

  useEffect(() => {
    if (selectedEdge) scrollToRef(selectedEdgeDomRef);
  }, [selectedEdge]);

  const handleToggleSeen = useToggleSeenHandler(selectedEdge, edgeSeen, markEdgeSeen, markEdgeUnseen);

  return {
    selectedEdge,
    selectedEdgeDomRef,
    edgeLabel,
    isInferred,
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
  });

  if (nonReadyStatus) return nonReadyStatus;

  const isFilteredOut = !!routeData.pathId
    && resultListContext?.pathFilterState?.[routeData.pathId] === true
    && !resultListContext.showHiddenPaths;

  return {
    status: 'ready',
    content: {
      edgeLabel: edgeData.edgeLabel,
      pathKey: routeData.pathKey,
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
    },
  };
};
