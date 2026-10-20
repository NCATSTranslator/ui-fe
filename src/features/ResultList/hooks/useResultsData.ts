import { useState, useRef, useCallback, RefObject, Dispatch, SetStateAction } from "react";
import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";
import { setResultSet } from "@/features/ResultList/slices/resultsSlice";
import { getEvidenceCounts } from "@/features/Evidence/utils/utilities";
import { getPathCount } from "@/features/Core/utils/resultHelpers";
import { generatePathfinderScore, generateScore, recalculateResultSetScores } from "@/features/ResultList/utils/scoring";
import { useResultsPolling } from "@/features/ResultList/hooks/useResultsPolling";
import { useQuerySeen } from "@/features/ResultList/hooks/useQuerySeen";
import { useFreshResults } from "@/features/ResultList/hooks/useFreshResults";
import { useResultsLoadedTracking } from "@/features/ResultList/hooks/useResultsLoadedTracking";
import { useNodeDescription } from "@/features/ResultList/hooks/useNodeDescription";
import { useQueryStatusDispatch } from "@/features/ResultList/hooks/useQueryStatusDispatch";
import { useLatest } from "@/features/Core/hooks/useLatest";
import { handleResultsError } from "@/features/ResultList/utils/resultsInteractionFunctions";
import { ResultSet, Result, ARAStatusResponse, ScoreWeights } from "@/features/ResultList/types/results.d";
import { HandleUpdateResultsFn } from "@/features/ResultList/hooks/useResultFiltering";
import { AppDispatch } from "@/redux/store";

interface UseResultsDataArgs {
  currentQueryID: string | null;
  currentQuerySid: number | undefined;
  areUserQueriesLoaded: boolean;
  isPathfinder: boolean;
  presetIsLoading: boolean;
  initialResultSet: ResultSet | null;
  nodeIdParam: string | null;
  dispatch: AppDispatch;
  scoreWeights: ScoreWeights;
  handleUpdateResultsRef: RefObject<HandleUpdateResultsFn | null>;
}

type ResultStatusString = "error" | "running" | "success" | "unknown";

interface UseResultsDataReturn {
  // State
  formattedResults: Result[];
  setFormattedResults: Dispatch<SetStateAction<Result[]>>;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  isError: boolean;
  setIsError: Dispatch<SetStateAction<boolean>>;
  arsStatus: ARAStatusResponse | null;
  resultStatus: ResultStatusString;
  setResultStatus: Dispatch<SetStateAction<ResultStatusString>>;
  setFreshRawResults: Dispatch<SetStateAction<ResultSet | null>>;
  nodeDescription: string;
  setNodeDescription: Dispatch<SetStateAction<string>>;
  // Derived
  hasFreshResults: boolean;
  resultsComplete: boolean;
  // Refs
  rawResults: RefObject<ResultSet | null>;
  originalResults: RefObject<Result[]>;
  prevRawResults: RefObject<ResultSet | null>;
  firstLoad: RefObject<boolean>;
  // Fetching state (lifted from refs to ensure re-renders)
  isFetchingARAStatus: boolean | null;
  isFetchingResults: boolean;
  // Callbacks
  recalculateScores: (newWeights: ScoreWeights) => void;
  handleResultsRefresh: () => void;
  resetResultsData: () => void;
}

/**
 * Clones a raw result set, assigns ids to its edges and nodes, and precalculates
 * evidence counts, path counts, and scores for each result.
 */
const prepareResultSet = (resultSet: ResultSet, scoreWeights: ScoreWeights, isPathfinder: boolean): ResultSet => {
  const newResultSet = cloneDeep(resultSet);

  for (const [id, edge] of Object.entries(newResultSet.data.edges)) {
    edge.id = id;
  }
  for (const [id, node] of Object.entries(newResultSet.data.nodes))
    node.id = id;

  for (const result of newResultSet.data.results) {
    result.evidenceCount = getEvidenceCounts(newResultSet, result);
    result.pathCount = getPathCount(newResultSet, result.paths);
    result.score = (isPathfinder)
      ? generatePathfinderScore(newResultSet, result)
      : generateScore(result.scores, scoreWeights.confidenceWeight, scoreWeights.noveltyWeight, scoreWeights.clinicalWeight);
  }

  return newResultSet;
};

// Composition root for result-list data: owns the result state and composes the
// polling, seen-tracking, analytics, and status hooks. Splitting it further would
// only relocate the wiring into ResultList.
// eslint-disable-next-line max-lines-per-function, max-statements
const useResultsData = ({
  currentQueryID,
  currentQuerySid,
  areUserQueriesLoaded,
  isPathfinder,
  presetIsLoading,
  initialResultSet,
  nodeIdParam,
  dispatch,
  scoreWeights,
  handleUpdateResultsRef,
}: UseResultsDataArgs): UseResultsDataReturn => {
  // State
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(presetIsLoading);
  const [resultStatus, setResultStatus] = useState<ResultStatusString>("unknown");
  const [formattedResults, setFormattedResults] = useState<Result[]>([]);

  // Refs
  const rawResults = useRef<ResultSet | null>(initialResultSet);
  const originalResults = useRef<Result[]>([]);
  const prevRawResults = useRef<ResultSet | null>(initialResultSet);
  const firstLoad = useRef(true);

  // Latest values for the stable callbacks below
  const formattedResultsRef = useLatest(formattedResults);
  const scoreWeightsRef = useLatest(scoreWeights);
  const isPathfinderRef = useLatest(isPathfinder);

  // --- Fetch pipeline ---

  // handleNewResults is declared below; the pipeline reaches it through this ref
  const handleNewResultsRef = useRef<(resultSet: ResultSet) => void>(() => {});
  const { freshRawResults, hasFreshResults, setFreshRawResults, receiveResults, handleResultsRefresh } =
    useFreshResults(formattedResultsRef, handleNewResultsRef);
  const markQuerySeen = useQuerySeen(currentQueryID, currentQuerySid, areUserQueriesLoaded);

  const handleResultsResponse = useCallback((data: ResultSet) => {
    receiveResults(data);
    markQuerySeen();
  }, [receiveResults, markQuerySeen]);

  // A failed fetch is only an error state if there is nothing on screen yet
  const handlePollingError = useCallback(() => {
    if (formattedResultsRef.current.length <= 0)
      handleResultsError(true, setIsError, setIsLoading);
  }, [formattedResultsRef]);

  const {
    arsStatus,
    isFetchingARAStatus, isFetchingARAStatusRef,
    isFetchingResults,
    resetPolling,
  } = useResultsPolling({ currentQueryID, presetIsLoading, onResults: handleResultsResponse, onError: handlePollingError });

  const resultsComplete = !isError && freshRawResults === null && !isFetchingARAStatus && !isFetchingResults;
  const reportResultsLoaded = useResultsLoadedTracking(currentQueryID, isPathfinderRef, isFetchingARAStatusRef);
  const [nodeDescription, setNodeDescription] = useNodeDescription(rawResults, nodeIdParam, formattedResults);
  useQueryStatusDispatch(dispatch, currentQueryID, { isLoading, isError, araCount: arsStatus?.data?.aras?.length ?? 0, resultStatus });

  // --- Callbacks ---

  const handleNewResults = useCallback((resultSet: ResultSet) => {
    setResultStatus(resultSet.status);

    // If the result set is null or the result set is the same as the previous result set and doesn't have 0 results, early return
    if (resultSet === null || (isEqual(resultSet, prevRawResults.current) && resultSet.data.results.length > 0))
      return;

    // If the result set is an error or has no results, early return
    if (resultSet.status === 'error' || resultSet.data.results === undefined)
      return;

    const currentIsPathfinder = isPathfinderRef.current;
    const newResultSet = prepareResultSet(resultSet, scoreWeightsRef.current, currentIsPathfinder);
    prevRawResults.current = newResultSet;

    dispatch(setResultSet({ pk: currentQueryID || "", resultSet: newResultSet }));

    if (!handleUpdateResultsRef.current) return;

    const newFormattedResults = handleUpdateResultsRef.current({ mode: 'rebuild', summary: newResultSet });

    // If the result set has results, set the loading state to false
    if (newFormattedResults.length > 0)
      setIsLoading(false);

    // If the result set has no results and the ARA status is finished, set the loading state to false
    if (newResultSet && newResultSet.data.results && newResultSet.data.results.length === 0 && !isFetchingARAStatusRef.current)
      setIsLoading(false);

    reportResultsLoaded(newResultSet, newFormattedResults.length);
  }, [dispatch, currentQueryID, handleUpdateResultsRef, reportResultsLoaded, isFetchingARAStatusRef, isPathfinderRef, scoreWeightsRef]);
  handleNewResultsRef.current = handleNewResults;

  const recalculateScores = useCallback((newWeights: ScoreWeights) => {
    if (!rawResults.current || !rawResults.current.data?.results?.length) return;

    const currentIsPathfinder = isPathfinderRef.current;
    const resultSetData = recalculateResultSetScores(rawResults.current, newWeights, currentIsPathfinder);
    rawResults.current = resultSetData;

    if (!handleUpdateResultsRef.current) return;

    handleUpdateResultsRef.current({ mode: 'rebuild', summary: resultSetData });
  }, [handleUpdateResultsRef, isPathfinderRef]);

  // Clears everything this hook owns so a different query starts from a blank slate.
  const resetResultsData = useCallback(() => {
    setIsLoading(true);
    setIsError(false);
    setFormattedResults([]);
    setFreshRawResults(null);
    rawResults.current = null;
    prevRawResults.current = null;
    originalResults.current = [];
    resetPolling();
    setResultStatus("unknown");
    // Re-arm the shared-result modal for the new query
    firstLoad.current = true;
    setNodeDescription("");
  }, [resetPolling, setFreshRawResults, setNodeDescription]);

  return {
    formattedResults,
    setFormattedResults,
    isLoading,
    setIsLoading,
    isError,
    setIsError,
    arsStatus,
    resultStatus,
    setResultStatus,
    setFreshRawResults,
    nodeDescription,
    setNodeDescription,
    hasFreshResults,
    resultsComplete,
    rawResults,
    originalResults,
    prevRawResults,
    isFetchingARAStatus,
    isFetchingResults,
    firstLoad,
    recalculateScores,
    handleResultsRefresh,
    resetResultsData,
  };
};

export default useResultsData;
