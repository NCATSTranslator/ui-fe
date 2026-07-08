import { HoverTarget, ResultSet, ResultEdge } from "@/features/ResultList/types/results.d";
import { useCallback, useState, useRef, useEffect, Dispatch, SetStateAction, useMemo, RefObject } from "react";
import { PublicationObject, SortPreference, TableState, Provenance, TrialObject } from "@/features/Evidence/types/evidence";
import { Preferences } from "@/features/UserAuth/types/user";
import { PubmedMetadataMap } from "@/features/Evidence/types/evidence";
import cloneDeep from "lodash/cloneDeep";
import chunk from "lodash/chunk";
import isEqual from "lodash/isEqual";
import { useQuery } from "@tanstack/react-query";
import { generatePubmedURL, updatePubdate, updateSnippet, updateJournal, updateTitle,
  getFormattedEdgeLabel, flattenPublicationObject, flattenTrialObject } from "@/features/Evidence/utils/utilities";
import { isPublication } from "@/features/Evidence/types/checkers";
import { getEdgeProvenance } from "@/features/ResultList/slices/resultsSlice";
import { getSortingFunction, getSortingStateUpdate } from "@/features/Evidence/utils/evidenceModalFunctions";
import { sortDateYearHighLow, compareByKeyLexographic } from "@/features/Core/utils/sortingFunctions";

const QUERY_AMOUNT = 200;
const PUBMED_API_URL = 'https://docmetadata.transltr.io/publications';
const REQUEST_ID = '26394fad-bfd9-4e32-bb90-ef9d5044f593';
export const DEFAULT_ITEMS_PER_PAGE = 5;

/**
 * Custom hook to track the index of hovered compressed edges in the evidence modal 
 *
 * @param {(target: HoverTarget) => void} setHoveredItem - Function to set the currently hovered item.
 * @returns {{hoveredIndex: number | null, getHoverHandlers: Function, resetHoveredIndex: Function}} Returns an object containing the hovered index, hover handlers, and reset function.
 */
export const useHoverPathObject = (setHoveredItem: (target: HoverTarget) => void) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getHoverHandlers = useCallback(
    (isEdge: boolean, id: string, index?: number) => ({
      onMouseEnter: () => {
        const type = isEdge ? 'edge' : 'node';
        setHoveredItem({ id: id, type: type});
        if(typeof index === 'number')
          setHoveredIndex(index);
      },
      onMouseLeave: () => {
        setHoveredItem(null);
        setHoveredIndex(null)
      },
    }),
    [setHoveredItem]
  );

  return {
    hoveredIndex,
    getHoverHandlers,
    resetHoveredIndex: () => setHoveredIndex(null),
  };
};

interface FetchState {
  isFetching: boolean;
  hasFetched: boolean;
  processedCount: number;
  totalItems: number;
  metadata: PubmedMetadataMap;
}

const INITIAL_FETCH_STATE: FetchState = {
  isFetching: false, hasFetched: false, processedCount: 0, totalItems: 0, metadata: {},
};

interface FetchResult {
  success: boolean;
  data?: PubmedMetadataMap;
  error?: string;
  processedCount: number;
}

export interface UsePubmedDataFetchProps {
  isOpen: boolean;
  publications: PublicationObject[];
  selectedEdgeId: string | null;
  prefs: Preferences;
  setPublications: Dispatch<SetStateAction<PublicationObject[]>>;
  updateState: (updates: Partial<TableState>) => void;
}

const insertAdditionalPubmedData = (data: PubmedMetadataMap, existing: PublicationObject[]): PublicationObject[] => {
  const newEvidence = cloneDeep(existing);
  newEvidence.forEach((element) => {
    const md = element?.id ? data[element.id] : false;
    if (md && element.id) {
      updateTitle(element, data);
      updateJournal(element, data);
      updateSnippet(element, data);
      updatePubdate(element, data);
      if (!element.url) {
        element.url = generatePubmedURL(element.id);
      }
    }
  });
  return newEvidence;
};

const applySortingAndUpdate = (
  prefs: Preferences,
  dataToSort: PublicationObject[],
  setPublications: Dispatch<SetStateAction<PublicationObject[]>>,
  updateState: (updates: Partial<TableState>) => void
) => {
  const sortPreference = prefs?.evidence_sort?.pref_value as SortPreference;

  const sortFn = getSortingFunction(sortPreference);
  if (sortPreference && sortFn) {
    const sortedData = sortFn(dataToSort) as PublicationObject[];
    const newSortingState = getSortingStateUpdate(sortPreference);
    setPublications(sortedData);
    updateState({ sortingState: newSortingState });
  } else {
    const defaultSortedData = sortDateYearHighLow(dataToSort);
    setPublications(defaultSortedData);
    updateState({ sortingState: { title: null, journal: null, date: true } });
  }
};

const fetchChunk = async (ids: string[], signal: AbortSignal): Promise<FetchResult> => {
  try {
    const res = await fetch(
      `${PUBMED_API_URL}?pubids=${ids.join(',')}&request_id=${REQUEST_ID}`,
      { signal }
    );

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    return {
      success: true,
      data: data.results || {},
      processedCount: Object.keys(data.results || {}).length,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Fetch aborted for chunk:', ids, 'error:', error);
      return { success: false, error: 'aborted', processedCount: 0 };
    }

    console.warn('Error fetching PubMed data for chunk:', ids, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processedCount: 0
    };
  }
};

const processChunks = async (
  chunksArr: string[][],
  signal: AbortSignal,
  isOpen: boolean,
  setFetchState: Dispatch<SetStateAction<FetchState>>
): Promise<{ accumulatedMetadata: PubmedMetadataMap; totalProcessed: number }> => {
  let accumulatedMetadata: PubmedMetadataMap = {};
  let totalProcessed = 0;

  for (const idChunk of chunksArr) {
    if (signal.aborted || !isOpen) {
      console.warn('Fetch operation aborted');
      break;
    }

    const result = await fetchChunk(idChunk, signal);

    if (result.success && result.data) {
      accumulatedMetadata = { ...accumulatedMetadata, ...result.data };
      totalProcessed += result.processedCount;
      setFetchState(prev => ({
        ...prev,
        processedCount: prev.processedCount + result.processedCount,
        metadata: { ...prev.metadata, ...result.data },
      }));
    } else {
      console.warn('Failed to fetch chunk:', idChunk, result.error);
    }
  }

  return { accumulatedMetadata, totalProcessed };
};

const setupPubmedDataFetch = (
  evidence: PublicationObject[],
  setter: Dispatch<SetStateAction<string[][]>>,
  setFetchState: Dispatch<SetStateAction<FetchState>>
) => {
  const ids = evidence
    .map((e) => e.id)
    .filter((id): id is string => typeof id === 'string');

  setter(chunk(ids, QUERY_AMOUNT));
  setFetchState(prev => ({ ...prev, isFetching: true }));
};

const resetFetchState = (
  updateState: (updates: Partial<TableState>) => void,
  abortControllerRef: RefObject<AbortController | null>,
  setFetchState: Dispatch<SetStateAction<FetchState>>
) => {
  if (abortControllerRef.current) {
    console.warn('Aborting previous fetch operation due to edge change');
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
  }

  updateState({
    sortingState: { title: null, journal: null, date: null },
    knowledgeLevelFilter: 'all',
    isLoading: true,
  });

  setFetchState(INITIAL_FETCH_STATE);
};

/**
 * Custom hook to fetch and manage PubMed metadata for publications in the evidence modal.
 *
 * @param {UsePubmedDataFetchProps} props - Props containing modal state and callbacks.
 * @returns {void} - This function does not return a value but updates the state directly.
 */
export const usePubmedDataFetch = ({
  isOpen,
  publications,
  selectedEdgeId,
  prefs,
  setPublications,
  updateState,
}: UsePubmedDataFetchProps) => {
  const [processedEvidenceIDs, setProcessedEvidenceIDs] = useState<string[][]>([]);
  const [fetchState, setFetchState] = useState<FetchState>(INITIAL_FETCH_STATE);
  const abortControllerRef = useRef<AbortController | null>(null);
  const didMountRef = useRef(false);
  const prevSelectedEdgeId = useRef<string | null>(null);

  const fetchPubmedData = useCallback(async (
    chunksArr: string[][],
    totalItems: number
  ): Promise<void> => {
    if (!isOpen || chunksArr.length === 0) return;

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setFetchState(prev => ({
      ...prev, isFetching: true, hasFetched: false, processedCount: 0, totalItems, metadata: {},
    }));

    try {
      const { accumulatedMetadata, totalProcessed } =
        await processChunks(chunksArr, signal, isOpen, setFetchState);

      if (totalProcessed > 0) {
        const dataToSort = insertAdditionalPubmedData(accumulatedMetadata, publications);
        applySortingAndUpdate(prefs, dataToSort, setPublications, updateState);
      }

      setFetchState(prev => ({ ...prev, isFetching: false, hasFetched: true }));
      updateState({ isLoading: false });
    } catch (error) {
      console.error('Error in fetchPubmedData:', error);
      setFetchState(prev => ({ ...prev, isFetching: false, hasFetched: true }));
      updateState({ isLoading: false });
    } finally {
      abortControllerRef.current = null;
    }
  }, [isOpen, publications, prefs, setPublications, updateState]);

  useEffect(() => {
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
  }, []);

  useQuery({
    queryKey: ['pubmedMetadata', processedEvidenceIDs, fetchState.isFetching, publications.length],
    queryFn: () => fetchPubmedData(processedEvidenceIDs, publications.length),
    enabled: fetchState.isFetching && processedEvidenceIDs.length > 0,
    retry: 1,
    retryDelay: 2000,
  });

  useEffect(() => {
    if (publications.length === 0 && didMountRef.current) {
      updateState({ isLoading: false });
      return;
    }
    didMountRef.current = true;
    if (publications.length > 0) {
      if (fetchState.hasFetched) {
        updateState({ isLoading: false });
      } else {
        setupPubmedDataFetch(publications, setProcessedEvidenceIDs, setFetchState);
      }
    }
  }, [publications, isOpen, updateState, fetchState.hasFetched]);

  useEffect(() => {
    if (selectedEdgeId !== null && prevSelectedEdgeId.current !== selectedEdgeId) {
      resetFetchState(updateState, abortControllerRef, setFetchState);
      setTimeout(() => {
        if (publications.length > 0) {
          setupPubmedDataFetch(publications, setProcessedEvidenceIDs, setFetchState);
        }
      }, 0);
      prevSelectedEdgeId.current = selectedEdgeId;
    }
  }, [selectedEdgeId, publications, updateState]);
};

/**
 * Custom hook to manage the publication table state including sorting and filtering.
 * Pagination is handled separately by usePagination.
 *
 * @returns {[TableState, (updates: Partial<TableState>) => void]} Returns a tuple containing the current table state and a function to update it.
 */
export const usePubTableState = (): [TableState, (updates: Partial<TableState>) => void] => {
  const [state, setState] = useState<TableState>({
    knowledgeLevelFilter: 'all',
    sortingState: { title: null, journal: null, date: null },
    isLoading: true,
  });

  const updateState = useCallback((updates: Partial<TableState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return [state, updateState];
};

interface UseEvidenceDataProps {
  setEdgeLabel: (label: string) => void;
}

interface EvidenceData {
  publications: PublicationObject[];
  sources: Provenance[];
  clinicalTrials: TrialObject[];
  miscEvidence: PublicationObject[];
}

/**
 * Custom hook to manage evidence data including publications, sources, clinical trials, and miscellaneous evidence.
 *
 * @param {UseEvidenceDataProps} props - Object containing setEdgeLabel function.
 * @returns {EvidenceData & {handleSelectedEdge: Function, setPublications: Function}} Returns evidence data and utility functions.
 */
export const useEvidenceData = ({ setEdgeLabel }: UseEvidenceDataProps) => {
  const [publications, setPublications] = useState<PublicationObject[]>([]);
  const [sources, setSources] = useState<Provenance[]>([]);
  const [clinicalTrials, setClinicalTrials] = useState<TrialObject[]>([]);
  const [miscEvidence, setMiscEvidence] = useState<PublicationObject[]>([]);

  /**
   * Processes evidence data by filtering and sorting publications, trials, and sources.
   *
   * @param {Object} evidence - Object containing sets of publications, sources, and trials.
   * @param {Set<PublicationObject>} evidence.publications - Set of publication objects.
   * @param {Set<Provenance>} evidence.sources - Set of provenance objects.
   * @param {Set<TrialObject>} evidence.trials - Set of trial objects.
   * @returns {void} - This function does not return a value but updates the state directly.
   */
  const processEvidence = useCallback((evidence: {
    publications: Set<PublicationObject>;
    sources: Set<Provenance>;
    trials: Set<TrialObject>;
  }) => {
    const pubmedItems = [...evidence.publications].filter(item => isPublication(item));
    const trialItems = [...evidence.trials];
    const miscItems = [...evidence.publications]
      .filter(item => !isPublication(item))
      .filter((v, i, a) => a.findIndex(v2 => v2.id === v.id) === i);
    
    const sortedSources = [...evidence.sources].sort(compareByKeyLexographic('name'));

    setPublications(pubmedItems);
    setClinicalTrials(trialItems);
    setMiscEvidence(miscItems);
    setSources(sortedSources);
  }, []);

  /**
   * Handles the selection of an edge by processing its associated evidence data.
   *
   * @param {ResultSet} resultSet - Result set containing the edge data.
   * @param {ResultEdge} selEdge - Selected edge object.
   * @returns {void} - This function does not return a value but updates the state directly.
   */
  const handleSelectedEdge = useCallback((resultSet: ResultSet, selEdge: ResultEdge) => {
    if (!selEdge) return;

    const filteredEvidence = {
      publications: new Set<PublicationObject>(),
      sources: new Set<Provenance>(),
      trials: new Set<TrialObject>()
    };

    filteredEvidence.publications = new Set(flattenPublicationObject(resultSet, selEdge.publications, selEdge));
    filteredEvidence.trials = new Set(flattenTrialObject(resultSet, selEdge.trials));
    filteredEvidence.sources = new Set(getEdgeProvenance(resultSet, selEdge));

    processEvidence(filteredEvidence);
    
    const formatted = getFormattedEdgeLabel(resultSet, selEdge).replaceAll("|", " ");
    setEdgeLabel(formatted);
  }, [processEvidence, setEdgeLabel]);

  // Memoized evidence data for performance
  const evidenceData = useMemo((): EvidenceData => ({
    publications,
    sources,
    clinicalTrials,
    miscEvidence,
  }), [publications, sources, clinicalTrials, miscEvidence]);

  return {
    ...evidenceData,
    handleSelectedEdge,
    setPublications,
  };
}; 

interface UseEdgeInitializationProps {
  edgeId: string | undefined;
  resolvedEdge: ResultEdge | null;
  resultSet: ResultSet | null | undefined;
  setSelectedEdge: (edge: ResultEdge) => void;
  handleEvidenceData: (resultSet: ResultSet, edge: ResultEdge) => void;
  markEdgeSeen: (id: string) => void;
}

/**
 * Custom hook to initialize and sync the selected edge when the edgeId param changes.
 * Prevents re-initialization for the same edgeId by tracking the last processed value.
 * @param {string | undefined} edgeId - The edge ID to initialize.
 * @param {ResultEdge | null} resolvedEdge - The resolved edge object.
 * @param {ResultSet | null | undefined} resultSet - The result set containing the edge data.
 * @param {Function} setSelectedEdge - Function to set the selected edge.
 * @param {Function} handleEvidenceData - Function to handle the evidence data.
 * @param {Function} markEdgeSeen - Function to mark the edge as seen.
 * @returns {void} - This function does not return a value but updates the state directly.
 */
export const useEdgeInitialization = ({
  edgeId,
  resolvedEdge,
  resultSet,
  setSelectedEdge,
  handleEvidenceData,
  markEdgeSeen,
}: UseEdgeInitializationProps) => {
  const lastInitEdge = useRef<ResultEdge | null>(null);

  useEffect(() => {
    if ((resolvedEdge && resultSet) && !isEqual(lastInitEdge.current, resolvedEdge)) {
      setSelectedEdge(resolvedEdge);
      handleEvidenceData(resultSet, resolvedEdge);
      markEdgeSeen(resolvedEdge.id);
      lastInitEdge.current = resolvedEdge;
    }
  }, [edgeId, resolvedEdge, resultSet, setSelectedEdge, handleEvidenceData, markEdgeSeen]);
};