import { HoverTarget, ResultSet, ResultEdge } from "@/features/ResultList/types/results.d";
import { useCallback, useState, useRef, useEffect, Dispatch, SetStateAction, useMemo } from "react";
import { PublicationObject, SortPreference, TableState, Provenance, TrialObject } from "@/features/Evidence/types/evidence";
import { PreferencesContainer } from "@/features/UserAuth/types/user";
import { PubmedMetadataMap } from "@/features/Evidence/types/evidence";
import { cloneDeep, chunk } from "lodash";
import { useQuery } from "react-query";
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

export const usePubmedDataFetch = (
  isOpen: boolean,
  publications: PublicationObject[],
  selectedEdgeId: string | null,
  prefs: PreferencesContainer,
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

  const applySortingAndUpdate = useCallback((
    prefs: PreferencesContainer,
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

  const insertAdditionalEvidenceAndSort = useCallback((
    prefs: PreferencesContainer,
    metadata: PubmedMetadataMap
  ) => {
    const dataToSort = insertAdditionalPubmedData(metadata, publications);
    applySortingAndUpdate(prefs, dataToSort);
  }, [publications, applySortingAndUpdate, insertAdditionalPubmedData]);

  // Individual chunk fetch function with proper error handling
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

  const setupPubmedDataFetch = useCallback((
    evidence: PublicationObject[],
    setter: React.Dispatch<React.SetStateAction<string[][]>>
  ) => {
    const ids = evidence
      .map((e) => e.id)
      .filter((id): id is string => typeof id === 'string');

    setter(chunk(ids, QUERY_AMOUNT));
    setFetchState(prev => ({ ...prev, isFetching: true }));
  }, []);

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

  return {};
};

export const usePubTableState = (prefs: PreferencesContainer): [TableState, (updates: Partial<TableState>) => void] => {
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
  resultSet: ResultSet | null;
  selectedEdge: ResultEdge | null;
  setEdgeLabel: (label: string) => void;
}

interface EvidenceData {
  publications: PublicationObject[];
  sources: Provenance[];
  clinicalTrials: TrialObject[];
  miscEvidence: PublicationObject[];
}

export const useEvidenceData = ({ resultSet, selectedEdge, setEdgeLabel }: UseEvidenceDataProps) => {
  const [publications, setPublications] = useState<PublicationObject[]>([]);
  const [sources, setSources] = useState<Provenance[]>([]);
  const [clinicalTrials, setClinicalTrials] = useState<TrialObject[]>([]);
  const [miscEvidence, setMiscEvidence] = useState<PublicationObject[]>([]);

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