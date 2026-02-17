import { useState, useRef, useCallback, useEffect, useMemo, RefObject, Dispatch, SetStateAction } from "react";
import { cloneDeep, isEqual } from "lodash";
import { setResultSet } from "@/features/ResultList/slices/resultsSlice";
import { getEvidenceCounts } from "@/features/Evidence/utils/utilities";
import { getPathCount } from "@/features/Common/utils/utilities";
import { generatePathfinderScore, generateScore, recalculateResultSetScores } from "@/features/ResultList/utils/scoring";
import { useResultsStatusQuery, useResultsDataQuery } from "@/features/ResultList/hooks/resultListHooks";
import { ResultSet, Result, ARAStatusResponse, ScoreWeights } from "@/features/ResultList/types/results.d";
import { Filter } from "@/features/ResultFiltering/types/filters";
import { SaveGroup } from "@/features/UserAuth/utils/userApi";
import { HandleUpdateResultsFn } from "@/features/ResultList/hooks/useResultFiltering";
import { AppDispatch } from "@/redux/store";

interface UseResultsDataArgs {
  currentQueryID: string | null;
  currentQuerySid: string | undefined;
  isPathfinder: boolean;
  presetIsLoading: boolean;
  initialResultSet: ResultSet | null;
  nodeIdParam: string | null;
  dispatch: AppDispatch;
  scoreWeights: ScoreWeights;
  activeFiltersRef: RefObject<Filter[]>;
  activeEntityFiltersRef: RefObject<string[]>;
  currentSortString: RefObject<string>;
  userSavesRef: RefObject<SaveGroup | null>;
  handleUpdateResultsRef: RefObject<HandleUpdateResultsFn | null>;
}

interface UseResultsDataReturn {
  // State
  formattedResults: Result[];
  setFormattedResults: Dispatch<SetStateAction<Result[]>>;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  isError: boolean;
  setIsError: Dispatch<SetStateAction<boolean>>;
  arsStatus: ARAStatusResponse | null;
  setArsStatus: Dispatch<SetStateAction<ARAStatusResponse | null>>;
  resultStatus: "error" | "running" | "success" | "unknown";
  setResultStatus: Dispatch<SetStateAction<"error" | "running" | "success" | "unknown">>;
  freshRawResults: ResultSet | null;
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
  numberOfStatusChecks: RefObject<number>;
  firstLoad: RefObject<boolean>;
  // Fetching state (lifted from refs to ensure re-renders)
  isFetchingARAStatus: boolean | null;
  setIsFetchingARAStatus: Dispatch<SetStateAction<boolean | null>>;
  isFetchingResults: boolean;
  setIsFetchingResults: Dispatch<SetStateAction<boolean>>;
  // Callbacks
  recalculateScores: (newWeights: ScoreWeights) => void;
  handleResultsRefresh: () => void;
}

const useResultsData = ({
  currentQueryID,
  currentQuerySid,
  isPathfinder,
  presetIsLoading,
  initialResultSet,
  nodeIdParam,
  dispatch,
  scoreWeights,
  activeFiltersRef,
  activeEntityFiltersRef,
  currentSortString,
  userSavesRef,
  handleUpdateResultsRef,
}: UseResultsDataArgs): UseResultsDataReturn => {

  // State
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(presetIsLoading);
  const [arsStatus, setArsStatus] = useState<ARAStatusResponse | null>(null);
  const [resultStatus, setResultStatus] = useState<"error" | "running" | "success" | "unknown">("unknown");
  const [freshRawResults, setFreshRawResults] = useState<ResultSet | null>(null);
  const [formattedResults, setFormattedResults] = useState<Result[]>([]);
  const [nodeDescription, setNodeDescription] = useState("");

  // Refs
  const rawResults = useRef<ResultSet | null>(initialResultSet);
  const originalResults = useRef<Result[]>([]);
  const prevRawResults = useRef<ResultSet | null>(initialResultSet);
  const numberOfStatusChecks = useRef(0);
  const firstLoad = useRef(true);

  // Fetching state (lifted from refs so updates trigger re-renders for sidebar/status)
  const [isFetchingARAStatus, setIsFetchingARAStatus] = useState<boolean | null>(presetIsLoading ? true : null);
  const [isFetchingResults, setIsFetchingResults] = useState(false);

  // Refs for values read inside handleNewResults to keep the callback stable
  const isFetchingARAStatusRef = useRef(isFetchingARAStatus);
  isFetchingARAStatusRef.current = isFetchingARAStatus;
  const scoreWeightsRef = useRef(scoreWeights);
  scoreWeightsRef.current = scoreWeights;
  const isPathfinderRef = useRef(isPathfinder);
  isPathfinderRef.current = isPathfinder;

  // Derived
  const hasFreshResults = useMemo(() => freshRawResults !== null, [freshRawResults]);
  const resultsComplete = !isError && freshRawResults === null && !isFetchingARAStatus && !isFetchingResults;

  // --- Callbacks ---

  const handleNewResults = useCallback((resultSet: ResultSet) => {
    setResultStatus(resultSet.status);

    if (resultSet == null || isEqual(resultSet, prevRawResults.current))
      return;

    if (resultSet.status === 'error' || resultSet.data.results === undefined)
      return;

    let newResultSet = cloneDeep(resultSet);
    prevRawResults.current = newResultSet;

    const currentScoreWeights = scoreWeightsRef.current;
    const currentIsPathfinder = isPathfinderRef.current;

    // Precalculate evidence and path counts
    for (const result of newResultSet.data.results) {
      result.evidenceCount = getEvidenceCounts(newResultSet, result);
      result.pathCount = getPathCount(newResultSet, result.paths);
      result.score = (currentIsPathfinder)
        ? generatePathfinderScore(newResultSet, result)
        : generateScore(result.scores, currentScoreWeights.confidenceWeight, currentScoreWeights.noveltyWeight, currentScoreWeights.clinicalWeight);
    }
    // Assign ids to edges
    for (const [id, edge] of Object.entries(newResultSet.data.edges))
      edge.id = id;
    // Assign ids to nodes
    for (const [id, node] of Object.entries(newResultSet.data.nodes))
      node.id = id;

    dispatch(setResultSet({ pk: currentQueryID || "", resultSet: newResultSet }));

    if (!handleUpdateResultsRef.current) return;

    const newFormattedResults = handleUpdateResultsRef.current(
      activeFiltersRef.current, activeEntityFiltersRef.current, newResultSet,
      [], false, currentSortString.current, currentIsPathfinder, userSavesRef.current
    );

    if (newFormattedResults.length > 0)
      setIsLoading(false);

    if (newResultSet && newResultSet.data.results && newResultSet.data.results.length === 0 && !isFetchingARAStatusRef.current)
      setIsLoading(false);
  }, [dispatch, currentQueryID, activeFiltersRef, activeEntityFiltersRef, currentSortString, userSavesRef, handleUpdateResultsRef]);

  const recalculateScores = useCallback((newWeights: ScoreWeights) => {
    if (!rawResults.current || !rawResults.current.data?.results?.length) return;

    const currentIsPathfinder = isPathfinderRef.current;
    const resultSetData = recalculateResultSetScores(rawResults.current, newWeights, currentIsPathfinder);
    rawResults.current = resultSetData;

    if (!handleUpdateResultsRef.current) return;

    handleUpdateResultsRef.current(
      activeFiltersRef.current,
      activeEntityFiltersRef.current,
      resultSetData,
      [],
      false,
      currentSortString.current,
      currentIsPathfinder,
      userSavesRef.current
    );
  }, [activeFiltersRef, activeEntityFiltersRef, currentSortString, userSavesRef, handleUpdateResultsRef]);

  const handleResultsRefresh = useCallback(() => {
    if (!!freshRawResults)
      handleNewResults(freshRawResults);
    setFreshRawResults(null);
  }, [freshRawResults, handleNewResults]);

  // --- React Query calls ---

  useResultsStatusQuery(
    currentQueryID,
    isFetchingARAStatus,
    setIsFetchingARAStatus,
    numberOfStatusChecks,
    formattedResults,
    setIsError,
    setIsLoading,
    isFetchingResults,
    setIsFetchingResults,
    arsStatus,
    setArsStatus
  );

  useResultsDataQuery(
    currentQueryID,
    isFetchingResults,
    formattedResults,
    setFreshRawResults,
    handleNewResults,
    numberOfStatusChecks,
    isFetchingARAStatus,
    setIsFetchingARAStatus,
    setIsError,
    setIsLoading,
    setIsFetchingResults,
    currentQuerySid
  );

  // Node description effect
  useEffect(() => {
    if (!nodeIdParam)
      return;

    let node = rawResults.current?.data?.nodes[nodeIdParam];
    if (rawResults.current && node) {
      if (node.descriptions.length > 0) {
        setNodeDescription(node.descriptions[0].replaceAll('"', ''));
      }
    }
  }, [formattedResults, nodeIdParam]);

  return {
    formattedResults,
    setFormattedResults,
    isLoading,
    setIsLoading,
    isError,
    setIsError,
    arsStatus,
    setArsStatus,
    resultStatus,
    setResultStatus,
    freshRawResults,
    setFreshRawResults,
    nodeDescription,
    setNodeDescription,
    hasFreshResults,
    resultsComplete,
    rawResults,
    originalResults,
    prevRawResults,
    isFetchingARAStatus,
    setIsFetchingARAStatus,
    isFetchingResults,
    setIsFetchingResults,
    numberOfStatusChecks,
    firstLoad,
    recalculateScores,
    handleResultsRefresh,
  };
};

export default useResultsData;
