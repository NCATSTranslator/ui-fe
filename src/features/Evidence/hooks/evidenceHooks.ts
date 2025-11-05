import { HoverTarget, ResultSet, ResultEdge } from "@/features/ResultList/types/results.d";
import { useCallback, useState, useRef, useEffect, Dispatch, SetStateAction, useMemo } from "react";
import { PublicationObject, SortPreference, TableState, Provenance, TrialObject } from "@/features/Evidence/types/evidence";
import { Preferences } from "@/features/UserAuth/types/user";
import { PubmedMetadataMap } from "@/features/Evidence/types/evidence";
import { cloneDeep, chunk } from "lodash";
import { useQuery } from "@tanstack/react-query";
import { generatePubmedURL, updatePubdate, updateSnippet, updateJournal, updateTitle,
  isPublication, getFormattedEdgeLabel, flattenPublicationObject, flattenTrialObject } from "@/features/Evidence/utils/utilities";
import { getInitItemsPerPage, getSortingFunction, getSortingStateUpdate } from "@/features/Evidence/utils/evidenceModalFunctions";
import { sortDateYearHighLow, compareByKeyLexographic } from "@/features/Common/utils/sortingFunctions";
import { hasSupport } from '@/features/Common/utils/utilities';
import { useSeenStatus } from '@/features/ResultItem/hooks/resultHooks';

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

interface FetchResult {
  success: boolean;
  data?: PubmedMetadataMap;
  error?: string;
  processedCount: number;
}

/**
 * Custom hook to fetch and manage PubMed metadata for publications in the evidence modal.
 *
 * @param {boolean} isOpen - Whether the evidence modal is currently open.
 * @param {PublicationObject[]} publications - Array of publication objects to fetch metadata for.
 * @param {string | null} selectedEdgeId - ID of the currently selected edge.
 * @param {Preferences} prefs - User preferences container.
 * @param {Dispatch<SetStateAction<PublicationObject[]>>} setPublications - State setter for publications.
 * @param {(updates: Partial<TableState>) => void} updateState - Function to update table state.
 * @returns {void} - This function does not return a value but updates the state directly.
 */
export const usePubmedDataFetch = (
  isOpen: boolean,
  publications: PublicationObject[],
  selectedEdgeId: string | null,
  prefs: Preferences,
  setPublications: Dispatch<SetStateAction<PublicationObject[]>>,
  updateState: (updates: Partial<TableState>) => void
) => {
  const [processedEvidenceIDs, setProcessedEvidenceIDs] = useState<string[][]>([]);
  const [fetchState, setFetchState] = useState<FetchState>({
    isFetching: false,
    hasFetched: false,
    processedCount: 0,
    totalItems: 0,
    metadata: {},
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const didMountRef = useRef(false);
  const prevSelectedEdgeId = useRef<string | null>(null);

  /**
   * Inserts additional PubMed metadata into existing publication objects.
   *
   * @param {PubmedMetadataMap} data - PubMed metadata map containing publication information.
   * @param {PublicationObject[]} existing - Array of existing publication objects to update.
   * @returns {PublicationObject[]} Returns the updated array of publication objects with additional metadata.
   */
  const insertAdditionalPubmedData = useCallback((data: PubmedMetadataMap, existing: PublicationObject[]): PublicationObject[] => {
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
  }, []);

  /**
   * Applies sorting to publication data based on user preferences and updates the state.
   *
   * @param {Preferences} prefs - User preferences container containing sorting preferences.
   * @param {PublicationObject[]} dataToSort - Array of publication objects to sort.
   * @returns {void} - This function does not return a value but updates the state directly.
   */
  const applySortingAndUpdate = useCallback((
    prefs: Preferences,
    dataToSort: PublicationObject[]
  ) => {
    const sortPreference = prefs?.evidence_sort?.pref_value as SortPreference;
    
    if (sortPreference && getSortingFunction(sortPreference)) {
      const sortedData = getSortingFunction(sortPreference)(dataToSort) as PublicationObject[];
      const newSortingState = getSortingStateUpdate(sortPreference);
      
      setPublications(sortedData);
      updateState({ sortingState: newSortingState });
    } else {
      // Default sorting when no preference is set
      const defaultSortedData = sortDateYearHighLow(dataToSort);
      setPublications(defaultSortedData);
      updateState({ sortingState: { title: null, journal: null, date: true } });
    }
  }, [setPublications, updateState]);

  /**
   * Inserts additional evidence metadata and applies sorting to the publications.
   *
   * @param {Preferences} prefs - User preferences container containing sorting preferences.
   * @param {PubmedMetadataMap} metadata - PubMed metadata map containing publication information.
   * @returns {void} - This function does not return a value but updates the state directly.
   */
  const insertAdditionalEvidenceAndSort = useCallback((
    prefs: Preferences,
    metadata: PubmedMetadataMap
  ) => {
    const dataToSort = insertAdditionalPubmedData(metadata, publications);
    applySortingAndUpdate(prefs, dataToSort);
  }, [publications, applySortingAndUpdate, insertAdditionalPubmedData]);

  /**
   * Fetches PubMed metadata for a chunk of publication IDs with proper error handling.
   *
   * @param {string[]} ids - Array of publication IDs to fetch metadata for.
   * @param {AbortSignal} signal - Abort signal for cancelling the fetch request.
   * @returns {Promise<FetchResult>} Returns a promise that resolves to a fetch result object containing success status, data, and processed count.
   */
  const fetchChunk = useCallback(async (
    ids: string[],
    signal: AbortSignal
  ): Promise<FetchResult> => {
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
  }, []);

  /**
   * Fetches PubMed metadata for all publication chunks and updates the state accordingly.
   *
   * @param {string[][]} chunksArr - Array of publication ID chunks to fetch metadata for.
   * @param {number} totalItems - Total number of items being processed.
   * @returns {Promise<void>} Returns a promise that resolves when all chunks have been processed.
   */
  const fetchPubmedData = useCallback(async (
    chunksArr: string[][],
    totalItems: number
  ): Promise<void> => {
    if (!isOpen || chunksArr.length === 0) {
      return;
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setFetchState(prev => ({
      ...prev,
      isFetching: true,
      hasFetched: false,
      processedCount: 0,
      totalItems,
      metadata: {},
    }));

    try {
      let accumulatedMetadata: PubmedMetadataMap = {};
      let totalProcessed = 0;

      for (const chunk of chunksArr) {
        if (signal.aborted || !isOpen) {
          console.warn('Fetch operation aborted');
          return;
        }

        const result = await fetchChunk(chunk, signal);
        
        if (result.success && result.data) {
          accumulatedMetadata = { ...accumulatedMetadata, ...result.data };
          totalProcessed += result.processedCount;
          
          setFetchState(prev => ({
            ...prev,
            processedCount: prev.processedCount + result.processedCount,
            metadata: { ...prev.metadata, ...result.data },
          }));
        } else {
          console.warn('Failed to fetch chunk:', chunk, result.error);
        }
      }

      // All chunks processed successfully
      if (totalProcessed > 0)
        insertAdditionalEvidenceAndSort(prefs, accumulatedMetadata);

      setFetchState(prev => ({
        ...prev,
        isFetching: false,
        hasFetched: true,
      }));
      updateState({ isLoading: false });

    } catch (error) {
      console.error('Error in fetchPubmedData:', error);
      setFetchState(prev => ({
        ...prev,
        isFetching: false,
        hasFetched: true,
      }));
      updateState({ isLoading: false });
    } finally {
      abortControllerRef.current = null;
    }
  }, [isOpen, fetchChunk, insertAdditionalEvidenceAndSort, prefs, updateState]);

  /**
   * Sets up the PubMed data fetch by chunking publication IDs and initializing fetch state.
   *
   * @param {PublicationObject[]} evidence - Array of publication objects to process.
   * @param {Dispatch<SetStateAction<string[][]>>} setter - State setter for processed evidence IDs.
   * @returns {void} - This function does not return a value but updates the state directly.
   */
  const setupPubmedDataFetch = useCallback((
    evidence: PublicationObject[],
    setter: Dispatch<SetStateAction<string[][]>>
  ) => {
    const ids = evidence
      .map((e) => e.id)
      .filter((id): id is string => typeof id === 'string');

    setter(chunk(ids, QUERY_AMOUNT));
    setFetchState(prev => ({ ...prev, isFetching: true }));
  }, []);

  /**
   * Resets the fetch state and aborts any ongoing requests when the selected edge changes.
   *
   * @param {(updates: Partial<TableState>) => void} updateState - Function to update table state.
   * @returns {void} - This function does not return a value but updates the state directly.
   */
  const resetState = useCallback((updateState: (updates: Partial<TableState>) => void) => {
    // Abort any ongoing requests
    if (abortControllerRef.current) {
      console.warn('Aborting previous fetch operation due to edge change');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    updateState({
      currentPage: 0,
      itemOffset: 0,
      sortingState: { title: null, journal: null, date: null },
      knowledgeLevelFilter: 'all',
      isLoading: true,
    });
    
    setFetchState({
      isFetching: false,
      hasFetched: false,
      processedCount: 0,
      totalItems: 0,
      metadata: {},
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useQuery({
    queryKey: ['pubmedMetadata', processedEvidenceIDs, fetchState.isFetching],
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
        setupPubmedDataFetch(publications, setProcessedEvidenceIDs);
      }
    }
  }, [publications, isOpen, setupPubmedDataFetch, updateState, fetchState.hasFetched]);

  // Effect for handling selectedEdgeId changes
  useEffect(() => {
    if (selectedEdgeId !== null && prevSelectedEdgeId.current !== selectedEdgeId) {
      resetState(updateState);

      // Setup new fetch after a brief delay to ensure state is properly reset
      setTimeout(() => {
        if (publications.length > 0) {
          setupPubmedDataFetch(publications, setProcessedEvidenceIDs);
        }
      }, 0);

      prevSelectedEdgeId.current = selectedEdgeId;
    }
  }, [selectedEdgeId, publications, setupPubmedDataFetch, updateState, resetState]);

};

/**
 * Custom hook to manage the publication table state including pagination, sorting, and filtering.
 *
 * @param {Preferences} prefs - User preferences container.
 * @returns {[TableState, (updates: Partial<TableState>) => void]} Returns a tuple containing the current table state and a function to update it.
 */
export const usePubTableState = (prefs: Preferences): [TableState, (updates: Partial<TableState>) => void] => {
  const [state, setState] = useState<TableState>({
    itemsPerPage: getInitItemsPerPage(prefs, DEFAULT_ITEMS_PER_PAGE),
    currentPage: 0,
    itemOffset: 0,
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

    filteredEvidence.publications = new Set(flattenPublicationObject(resultSet, selEdge.publications));
    filteredEvidence.trials = new Set(flattenTrialObject(resultSet, selEdge.trials));
    filteredEvidence.sources = new Set(selEdge.provenance);

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

interface UseEvidenceModalStateProps {
  edge: ResultEdge | null;
  pk: string;
}

/**
 * Custom hook to manage the evidence modal state including selected edge, edge label, and seen status.
 *
 * @param {UseEvidenceModalStateProps} props - Object containing edge and pk (primary key).
 * @returns {Object} Returns an object containing modal state and utility functions for managing edge selection and seen status.
 */
export const useEvidenceModalState = ({ edge, pk }: UseEvidenceModalStateProps) => {
  const [selectedEdge, setSelectedEdge] = useState<ResultEdge | null>(edge);
  const [edgeLabel, setEdgeLabel] = useState<string | null>(null);
  const [isPathViewMinimized, setIsPathViewMinimized] = useState(false);

  const { isEdgeSeen, markEdgeSeen, markEdgeUnseen } = useSeenStatus(pk);
  
  const isInferred = useMemo(() => hasSupport(selectedEdge), [selectedEdge]);
  const edgeSeen = useMemo(() => 
    !!selectedEdge?.id && isEdgeSeen(selectedEdge.id), 
    [selectedEdge?.id, isEdgeSeen]
  );

  /**
   * Toggles the seen status of the currently selected edge.
   *
   * @returns {void} - This function does not return a value but updates the seen status directly.
   */
  const handleToggleSeen = useCallback(() => {
    if (!selectedEdge?.id) {
      console.warn("Edge seen status cannot be toggled, selectedEdge is null.");
      return;
    }
    
    if (edgeSeen) {
      markEdgeUnseen(selectedEdge.id);
    } else {
      markEdgeSeen(selectedEdge.id);
    }
  }, [selectedEdge?.id, edgeSeen, markEdgeSeen, markEdgeUnseen]);

  return {
    selectedEdge,
    edgeLabel,
    isPathViewMinimized,
    isInferred,
    edgeSeen,
    handleToggleSeen,
    setSelectedEdge,
    setEdgeLabel,
    setIsPathViewMinimized,
  };
}; 