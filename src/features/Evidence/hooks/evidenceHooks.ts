import { ResultSet, ResultEdge } from "@/features/ResultList/types/results.d";
import { useCallback, useState, useRef, useEffect, Dispatch, SetStateAction, useMemo, RefObject } from "react";
import { PublicationObject, Provenance, ProvenanceCatalogEntry, TrialObject } from "@/features/Evidence/types/evidence";
import { PubmedMetadataMap } from "@/features/Evidence/types/evidence";
import cloneDeep from "lodash/cloneDeep";
import chunk from "lodash/chunk";
import isEqual from "lodash/isEqual";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { currentConfig } from "@/features/UserAuth/slices/userSlice";
import { fetchPublicationMetadata, PUBLICATION_METADATA_FALLBACK_ENDPOINT } from "@/features/Evidence/utils/publicationMetadataApi";
import { generatePubmedURL, updatePubdate, updateSnippet, updateJournal, updateTitle,
  flattenPublicationObject, flattenTrialObject, formatEvidenceEdgeLabel, getTrialSources } from "@/features/Evidence/utils/utilities";
import { classifyEvidenceLink } from "@/features/Evidence/types/checkers";
import { getEdgeProvenance } from "@/features/ResultList/slices/resultsSlice";
import { compareByKeyLexographic } from "@/features/Core/utils/sortingFunctions";

// The publications endpoint rejects any request for more than 100 ids with a 400
const QUERY_AMOUNT = 100;

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

export interface UsePubmedDataFetchProps {
  publications: PublicationObject[];
  selectedEdgeId: string | null;
  setPublications: Dispatch<SetStateAction<PublicationObject[]>>;
  /** Reports whether metadata is still being fetched, so the caller can hold the list back until it is. */
  setIsLoading: (isLoading: boolean) => void;
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

const processChunks = async (
  endpoint: string,
  chunksArr: string[][],
  signal: AbortSignal,
  setFetchState: Dispatch<SetStateAction<FetchState>>
): Promise<{ accumulatedMetadata: PubmedMetadataMap; totalProcessed: number }> => {
  let accumulatedMetadata: PubmedMetadataMap = {};
  let totalProcessed = 0;

  for (const idChunk of chunksArr) {
    if (signal.aborted) {
      console.warn('Fetch operation aborted');
      break;
    }

    const result = await fetchPublicationMetadata(endpoint, idChunk, signal);

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
  setIsLoading: (isLoading: boolean) => void,
  abortControllerRef: RefObject<AbortController | null>,
  setFetchState: Dispatch<SetStateAction<FetchState>>
) => {
  if (abortControllerRef.current) {
    console.warn('Aborting previous fetch operation due to edge change');
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
  }

  setIsLoading(true);

  setFetchState(INITIAL_FETCH_STATE);
};

/**
 * Custom hook that resolves the publication metadata endpoint from config, falling back to the
 * production annotator when config is unavailable or does not supply one.
 *
 * @returns {string} The publication metadata endpoint URL.
 */
export const usePublicationMetadataEndpoint = (): string => {
  const config = useSelector(currentConfig);
  return config?.publication_metadata?.endpoint || PUBLICATION_METADATA_FALLBACK_ENDPOINT;
};

/**
 * Custom hook to fetch and manage PubMed metadata for publications in the evidence view. It fills
 * in details only; the evidence view orders the list (see sortPublications).
 *
 * @param {UsePubmedDataFetchProps} props - The publications to enrich and the callbacks that receive the results.
 * @returns {void} - This function does not return a value but updates the state directly.
 */
export const usePubmedDataFetch = ({
  publications,
  selectedEdgeId,
  setPublications,
  setIsLoading,
}: UsePubmedDataFetchProps) => {
  const [processedEvidenceIDs, setProcessedEvidenceIDs] = useState<string[][]>([]);
  const [fetchState, setFetchState] = useState<FetchState>(INITIAL_FETCH_STATE);
  const abortControllerRef = useRef<AbortController | null>(null);
  const didMountRef = useRef(false);
  const prevSelectedEdgeId = useRef<string | null>(null);
  const metadataEndpoint = usePublicationMetadataEndpoint();

  const fetchPubmedData = useCallback(async (
    chunksArr: string[][],
    totalItems: number
  ): Promise<void> => {
    if (chunksArr.length === 0) return;

    // A newer run supersedes any run still in flight, so that run can never be orphaned un-aborted.
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    setFetchState(prev => ({
      ...prev, isFetching: true, hasFetched: false, processedCount: 0, totalItems, metadata: {},
    }));

    try {
      const { accumulatedMetadata, totalProcessed } =
        await processChunks(metadataEndpoint, chunksArr, signal, setFetchState);

      // An aborted run belongs to a previous edge (or an unmounted modal); whoever aborted it owns
      // the state from here, so its partial metadata must not be written over the current one.
      if (signal.aborted) return;

      if (totalProcessed > 0) {
        setPublications(insertAdditionalPubmedData(accumulatedMetadata, publications));
      }

      setFetchState(prev => ({ ...prev, isFetching: false, hasFetched: true }));
      setIsLoading(false);
    } catch (error) {
      console.error('Error in fetchPubmedData:', error);
      setFetchState(prev => ({ ...prev, isFetching: false, hasFetched: true }));
      setIsLoading(false);
    } finally {
      // Only clear our own controller: a newer run may already have replaced it.
      if (abortControllerRef.current === controller) abortControllerRef.current = null;
    }
  }, [publications, setPublications, setIsLoading, metadataEndpoint]);

  useEffect(() => {
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
  }, []);

  useQuery({
    queryKey: ['pubmedMetadata', metadataEndpoint, processedEvidenceIDs, fetchState.isFetching, publications.length],
    queryFn: () => fetchPubmedData(processedEvidenceIDs, publications.length),
    enabled: fetchState.isFetching && processedEvidenceIDs.length > 0,
    retry: 1,
    retryDelay: 2000,
  });

  useEffect(() => {
    if (publications.length === 0 && didMountRef.current) {
      setIsLoading(false);
      return;
    }
    didMountRef.current = true;
    if (publications.length > 0) {
      if (fetchState.hasFetched) {
        setIsLoading(false);
      } else {
        setupPubmedDataFetch(publications, setProcessedEvidenceIDs, setFetchState);
      }
    }
  }, [publications, setIsLoading, fetchState.hasFetched]);

  useEffect(() => {
    if (selectedEdgeId !== null && prevSelectedEdgeId.current !== selectedEdgeId) {
      resetFetchState(setIsLoading, abortControllerRef, setFetchState);
      setTimeout(() => {
        if (publications.length > 0) {
          setupPubmedDataFetch(publications, setProcessedEvidenceIDs, setFetchState);
        }
      }, 0);
      prevSelectedEdgeId.current = selectedEdgeId;
    }
  }, [selectedEdgeId, publications, setIsLoading]);
};

interface EvidenceData {
  publications: PublicationObject[];
  sources: Provenance[];
  clinicalTrials: TrialObject[];
  drugLabels: PublicationObject[];
  miscEvidence: PublicationObject[];
  edgeLabel: string | null;
}

/**
 * Custom hook to manage evidence data including publications, sources, clinical trials, drug labels, and miscellaneous evidence.
 */
export const useEvidenceData = () => {
  const [publications, setPublications] = useState<PublicationObject[]>([]);
  const [sources, setSources] = useState<Provenance[]>([]);
  const [clinicalTrials, setClinicalTrials] = useState<TrialObject[]>([]);
  const [drugLabels, setDrugLabels] = useState<PublicationObject[]>([]);
  const [miscEvidence, setMiscEvidence] = useState<PublicationObject[]>([]);
  const [edgeLabel, setEdgeLabel] = useState<string | null>(null);

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
    const items = [...evidence.publications];
    const pubmedItems = items.filter(item => classifyEvidenceLink(item) === 'publication');
    const trialItems = [...evidence.trials];
    const linkItems = items
      .filter(item => classifyEvidenceLink(item) !== 'publication')
      .filter((v, i, a) => a.findIndex(v2 => v2.id === v.id) === i);
    const labelItems = linkItems.filter(item => classifyEvidenceLink(item) === 'drugLabel');
    const miscItems = linkItems.filter(item => classifyEvidenceLink(item) === 'misc');
    
    const sortedSources = [...evidence.sources].sort(compareByKeyLexographic('name'));

    setPublications(pubmedItems);
    setClinicalTrials(trialItems);
    setDrugLabels(labelItems);
    setMiscEvidence(miscItems);
    setSources(sortedSources);
  }, []);

  /**
   * Handles the selection of an edge by processing its associated evidence data.
   *
   * @param {ResultSet} resultSet - Result set containing the edge data.
   * @param {ResultEdge} selEdge - Selected edge object.
   * @param {Record<string, ProvenanceCatalogEntry>} provenanceCatalog - Infores catalog entries used to name sources when there is no result set.
   * @returns {void} - This function does not return a value but updates the state directly.
   */
  const handleSelectedEdge = useCallback((
    resultSet: ResultSet | null,
    selEdge: ResultEdge,
    nodeNameLookup: Record<string, string> = {},
    provenanceCatalog: Record<string, ProvenanceCatalogEntry> = {},
  ) => {
    if (!selEdge) return;

    const filteredEvidence = {
      publications: new Set<PublicationObject>(),
      sources: new Set<Provenance>(),
      trials: new Set<TrialObject>(),
    };

    filteredEvidence.publications = new Set(flattenPublicationObject(resultSet, selEdge.publications, selEdge, provenanceCatalog));
    const trialSources = getTrialSources(resultSet, selEdge, provenanceCatalog);
    filteredEvidence.trials = new Set(
      flattenTrialObject(resultSet, selEdge.trials).map(trial => ({ ...trial, sources: trialSources })),
    );
    filteredEvidence.sources = new Set(getEdgeProvenance(resultSet, selEdge, provenanceCatalog));

    processEvidence(filteredEvidence);
    setEdgeLabel(formatEvidenceEdgeLabel(selEdge, resultSet, nodeNameLookup));
  }, [processEvidence]);

  // Memoized evidence data for performance
  const evidenceData = useMemo((): EvidenceData => ({
    publications,
    sources,
    clinicalTrials,
    drugLabels,
    miscEvidence,
    edgeLabel,
  }), [publications, sources, clinicalTrials, drugLabels, miscEvidence, edgeLabel]);

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
  isCanvasOnlyMode?: boolean;
  // Canvas-only evidence waits for node-name and infores catalog lookups so labels/sources are
  // correct on first render; evidence state is built once per edge (later enriched with PubMed),
  // so it can't be rebuilt after those lookups finish.
  canvasLookupsSettled?: boolean;
  setSelectedEdge: (edge: ResultEdge) => void;
  handleEvidenceData: (resultSet: ResultSet | null, edge: ResultEdge) => void;
  markEdgeSeen: (id: string) => void;
}

/**
 * Custom hook to initialize and sync the selected edge when the edgeId param changes.
 * Prevents re-initialization for the same edgeId by tracking the last processed value.
 * @param {string | undefined} edgeId - The edge ID to initialize.
 * @param {ResultEdge | null} resolvedEdge - The resolved edge object.
 * @param {ResultSet | null | undefined} resultSet - The result set containing the edge data.
 * @param {boolean} canvasLookupsSettled - Whether canvas-only node-name and infores lookups have finished.
 * @param {Function} setSelectedEdge - Function to set the selected edge.
 * @param {Function} handleEvidenceData - Function to handle the evidence data.
 * @param {Function} markEdgeSeen - Function to mark the edge as seen.
 * @returns {void} - This function does not return a value but updates the state directly.
 */
export const useEdgeInitialization = ({
  edgeId,
  resolvedEdge,
  resultSet,
  isCanvasOnlyMode = false,
  canvasLookupsSettled = true,
  setSelectedEdge,
  handleEvidenceData,
  markEdgeSeen,
}: UseEdgeInitializationProps) => {
  const lastInitEdge = useRef<ResultEdge | null>(null);

  useEffect(() => {
    const canInit = resolvedEdge && (resultSet || (isCanvasOnlyMode && canvasLookupsSettled));
    if (canInit && !isEqual(lastInitEdge.current, resolvedEdge)) {
      setSelectedEdge(resolvedEdge);
      handleEvidenceData(resultSet ?? null, resolvedEdge);
      markEdgeSeen(resolvedEdge.id);
      lastInitEdge.current = resolvedEdge;
    }
  }, [edgeId, resolvedEdge, resultSet, isCanvasOnlyMode, canvasLookupsSettled, setSelectedEdge, handleEvidenceData, markEdgeSeen]);
};
