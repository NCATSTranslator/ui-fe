import { useState, useRef, useCallback, useEffect, useMemo, RefObject } from "react";
import styles from './ResultList.module.scss';
import Query from "@/features/Query/components/Query/Query";
import ResultsFilter from "@/features/ResultFiltering/components/ResultsFilter/ResultsFilter";
import ResultItem from "@/features/ResultItem/components/ResultItem/ResultItem";
import LoadingBar from "@/features/Common/components/LoadingBar/LoadingBar";
import ResultListHeader from "@/features/ResultList/components/ResultListHeader/ResultListHeader";
import NavConfirmationPromptModal from "@/features/Common/components/NavConfirmationPromptModal/NavConfirmationPromptModal";
import StickyToolbar from "@/features/ResultList/components/StickyToolbar/StickyToolbar";
import { cloneDeep, isEqual } from "lodash";
import { useBlocker } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { setResultSet, getResultSetById, getResultById, getNodeById, getEdgeById }from "@/features/ResultList/slices/resultsSlice";
import { currentPrefs, currentUser }from "@/features/UserAuth/slices/userSlice";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { sortNameLowHigh, sortNameHighLow, sortEvidenceLowHigh, sortEvidenceHighLow, sortScoreLowHigh,
  sortScoreHighLow, sortByEntityStrings, sortPathsHighLow, sortPathsLowHigh, sortByNamePathfinderLowHigh,
  sortByNamePathfinderHighLow, filterCompare } from "@/features/Common/utils/sortingFunctions";
import {
  applyFilters,
  injectDynamicFilters,
  genPathFilterState,
  areEntityFiltersEqual,
  calculateFacetCounts,
  checkBookmarksForItem
} from "@/features/ResultList/utils/resultsInteractionFunctions";
import { getDataFromQueryVar, getPathCount, getCompressedEdge, findInSet } from "@/features/Common/utils/utilities";
import { getEvidenceCounts } from "@/features/Evidence/utils/utilities";
import { queryTypes } from "@/features/Query/utils/queryTypes";
import { getSaves, SaveGroup } from "@/features/UserAuth/utils/userApi";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BookmarkAddedMarkup, BookmarkRemovedMarkup, BookmarkErrorMarkup } from "@/features/ResultItem/components/BookmarkToasts/BookmarkToasts";
import QueryPathfinder from "@/features/Query/components/QueryPathfinder/QueryPathfinder";
import ResultListTableHead from "@/features/ResultList/components/ResultListTableHead/ResultListTableHead";
import ResultListModals from "@/features/ResultList/components/ResultListModals/ResultListModals";
import ResultListBottomPagination from "@/features/ResultList/components/ResultListBottomPagination/ResultListBottomPagination";
import { ResultSet, Result, ResultEdge, Path, PathFilterState, SharedItem } from "@/features/ResultList/types/results.d";
import { Filter } from "@/features/ResultFiltering/types/filters";
import { generateScore } from "@/features/ResultList/utils/scoring";
import { ResultContextObject } from "@/features/ResultList/utils/llm";
import { useResultsStatusQuery, useResultsDataQuery } from "@/features/ResultList/hooks/resultListHooks";
import { getDecodedParams } from '@/features/Common/utils/web';
import { useSidebarRegistration } from "@/features/Sidebar/hooks/sidebarHooks";
import FilterIcon from '@/assets/icons/navigation/Filter.svg?react';

const ResultList = () => {

  const user = useSelector(currentUser);
  const prefs = useSelector(currentPrefs);
  const dispatch = useDispatch();
  let blocker = useBlocker(true);

  // URL search params
  const decodedParams = getDecodedParams();
  const loadingParam = getDataFromQueryVar("loading", decodedParams);
  const currentQueryID = getDataFromQueryVar("q", decodedParams);
  const presetTypeID = getDataFromQueryVar("t", decodedParams);
  const isPathfinder = (presetTypeID === "p");
  let presetTypeObject = (!!presetTypeID)
    ? queryTypes.find(type => type.id === parseInt(presetTypeID)) ?? null
    : null;

  const nodeLabelParam = getDataFromQueryVar("l", decodedParams);
  const nodeIdParam = getDataFromQueryVar("i", decodedParams);
  const [resultIdParam, setResultIdParam] = useState(getDataFromQueryVar("r", decodedParams));
  const firstLoad = useRef(true);
  const [nodeDescription, setNodeDescription] = useState("");
  const shareResultID = useRef<string | null>(null);
  const setShareResultID = (newID: string | null) => shareResultID.current = newID;

  let resultSet = useSelector(getResultSetById(currentQueryID));
  // Bool, did the results return an error
  const [isError, setIsError] = useState(false);
  const loading = (loadingParam === 'true') ? true : false;
  // Bool, are the results still loading
  const presetIsLoading = (currentQueryID) ? true : loading;
  const [isLoading, setIsLoading] = useState(presetIsLoading);
  // Bool/null , should ara status be fetched
  // const [isFetchingARAStatus, setIsFetchingARAStatus] = useState(presetIsLoading);
  const isFetchingARAStatus = useRef<boolean | null>(presetIsLoading);
  // Bool, should results be fetched
  // const [isFetchingResults, setIsFetchingResults] = useState(false);
  const isFetchingResults = useRef(false);

  // set to not sort by score for Pathfinder, set to false to sort score high low for MVP queries
  const initSortByScore = (isPathfinder) ? null : false;
  // set to sort by name for Pathfinder, set to null for MVP queries
  const initSortByName = (isPathfinder) ? true : null;
  // ALSO REQUIRED TO SET INITSORTSTRING BELOW, along with useEffect for catching changes to prefs

  // Bool, are the results currently sorted by name (true/false for asc/desc, null for not set)
  const [isSortedByName, setIsSortedByName] = useState<boolean | null>(initSortByName);
  // Bool, are the results currently sorted by evidence count (true/false for asc/desc, null for not set)
  const [isSortedByEvidence, setIsSortedByEvidence] = useState<boolean | null>(null);
  // Bool, are the results currently sorted by path count (true/false for asc/desc, null for not set)
  const [isSortedByPaths, setIsSortedByPaths] = useState<boolean | null>(null);
  // Bool, are the results currently sorted by score
  const [isSortedByScore, setIsSortedByScore] = useState<boolean | null>(initSortByScore);
  // Bool, is evidence modal open?
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [sharedItem, setSharedItem] = useState<SharedItem>({index: 0, page: 0, name: '', type: ''});
  const [autoScrollToResult, setAutoScrollToResult] = useState(false);
  const [expandSharedResult, setExpandSharedResult] = useState(false);
  const sharedItemRef = useRef<HTMLDivElement | null>(null);
  const noteLabel = useRef("");
  const currentBookmarkID = useRef<string | null>(null);
  // Result, the currently selected item
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);

  const [selectedEdge, setSelectedEdge] = useState<ResultEdge | null>(null);
  // Path, path represented in current evidence
  const [selectedPath, setSelectedPath] = useState<Path | null>(null);
  // string, represents the selected path's key (1, 1.a, 1.a.i, etc.)
  const [selectedPathKey, setSelectedPathKey] = useState<string>("");
  // Obj, represents the filter state of all paths
  const [pathFilterState, setPathFilterState] = useState<PathFilterState | null>(null);
  // number, current page
  const currentPage = useRef(0);
  // number, current item offset (ex: on page 3, offset would be 30 based on itemsPerPage of 10)
  const [itemOffset, setItemOffset] = useState(0);

  const calculateItemsPerPage = useCallback((prefValue: string | number): number => {
    return ((!!prefValue) ? (typeof prefValue === "string") ? parseInt(prefValue) : prefValue : 10) as number;
  }, []);
  // number, how many items per page
  const [itemsPerPage, setItemsPerPage] = useState<number>(calculateItemsPerPage(prefs.result_per_screen.pref_value));
  // number, last result item index
  const [endResultIndex, setEndResultIndex] = useState<number>(itemsPerPage);
  // ResultSet, original raw result set from the BE
  const rawResults = useRef<ResultSet | null>(resultSet);
  // Obj, original, unfiltered results from the BE
  const originalResults = useRef<Result[]>([]);
  // Obj, fresh results from the BE to replace existing rawResults
  const [freshRawResults, setFreshRawResults] = useState<ResultSet | null>(null);
  // ResultSet Ref, used to track changes in results
  const prevRawResults = useRef<ResultSet | null>(resultSet);
  // Array, results formatted by any active filters, sorted by any active sorting
  const [formattedResults, setFormattedResults] = useState<Result[]>([]);
  // Array, results meant to display based on the pagination
  const displayedResults: Result[] = useMemo(()=>formattedResults.slice(itemOffset, endResultIndex), [formattedResults, itemOffset, endResultIndex]);
  const initSortString: string = (isPathfinder)
    ? 'nameLowHigh'
    : (prefs?.result_sort?.pref_value) ? prefs.result_sort.pref_value as string : 'scoreHighLow';
  const currentSortString = useRef(initSortString);
  // Int, number of pages
  const pageCount = Math.ceil(formattedResults.length / itemsPerPage);
  // Array, currently active filters
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [availableFilters, setAvailableFilters] = useState<{[key: string]: Filter}>({});
  // Array, currently active string filters
  const [activeEntityFilters, setActiveEntityFilters] = useState<string[]>([]);
  // Array, aras that have returned data
  const returnedARAs = useRef<{aras: string[], status: string}>({aras: [], status: ''});
  // Bool, is share modal open
  const [shareModalOpen, setShareModalOpen] = useState(false);
  // Bool, is the shift key being held down
  const [zoomKeyDown, setZoomKeyDown] = useState(false);
  // Float, weight for confidence score
  const [confidenceWeight] = useState(1.0);
  // Float, weight for novelty score
  const [noveltyWeight] = useState(0.1);
  // Float, weight for clinical score
  const [clinicalWeight] = useState(1.0);
  const scoreWeights = useMemo(()=> { return {confidenceWeight: confidenceWeight, noveltyWeight: noveltyWeight, clinicalWeight: clinicalWeight}}, [confidenceWeight, noveltyWeight, clinicalWeight]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [userSaves, setUserSaves] = useState<SaveGroup | null>(null);
  const bookmarkAddedToast = () => toast.success(<BookmarkAddedMarkup/>);
  const bookmarkRemovedToast = () => toast.success(<BookmarkRemovedMarkup/>);
  const handleBookmarkError = () => toast.error(<BookmarkErrorMarkup/>);
  const [showHiddenPaths, setShowHiddenPaths] = useState(false);
  const shouldUpdateResultsAfterBookmark = useRef(false);

  // update defaults when prefs change, including when they're loaded from the db since the call for new prefs
  // comes asynchronously in useEffect (which is at the end of the render cycle) in App.js
  useEffect(() => {
    currentSortString.current = (isPathfinder) ? 'nameLowHigh' : (prefs?.result_sort?.pref_value) ? prefs.result_sort.pref_value as string : 'scoreHighLow';
    const tempItemsPerPage = calculateItemsPerPage(prefs.result_per_screen.pref_value);
    setItemsPerPage(tempItemsPerPage);
    setEndResultIndex(tempItemsPerPage);
  }, [prefs, isPathfinder, calculateItemsPerPage]);

  useEffect(() => {
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "z") {
        setZoomKeyDown(true);
      }
    };

    const handleKeyUp = (ev: KeyboardEvent) => {
      if (ev.key === "z") {
        setZoomKeyDown(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const getUserSaves = useCallback(async () => {
    let temp = await getSaves();
    for(const queryID of Object.keys(temp)){
      if(queryID === currentQueryID) {
        setUserSaves(temp[queryID]);
      }
    }
  }, [currentQueryID])

  useEffect(() => {
    if(!user)
      return;

    getUserSaves();
  }, [user, getUserSaves]);

  // Update results after bookmark to reflect new user saves in bookmark/note filter
  useEffect(() => {
    if(!shouldUpdateResultsAfterBookmark.current)
      return;

    shouldUpdateResultsAfterBookmark.current = false;
    const tempUserSaves = cloneDeep(userSaves)
    handleUpdateResults(activeFilters, activeEntityFilters, prevRawResults.current, [], false, currentSortString.current, tempUserSaves);
  }, [userSaves, activeFilters, activeEntityFilters, prevRawResults, currentSortString])

  useEffect(() => {
    if (!autoScrollToResult)
      return;

    const yOffset = -40;
    if(!!sharedItemRef.current) {
      const y = sharedItemRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
      setAutoScrollToResult(false);
    }
  }, [autoScrollToResult]);

  // Int, number of times we've checked for ARA status. Used to determine how much time has elapsed for a timeout on ARA status.
  const numberOfStatusChecks = useRef(0);
  // Initialize queryClient for React Query to fetch results
  const queryClient = new QueryClient();

  // Handles direct page click
  const handlePageClick = useCallback((event: { selected: number}, newItemsPerPage: number | false = false, resultsLength = formattedResults.length, currentNumItemsPerPage = itemsPerPage ) => {
    let perPageNum = (newItemsPerPage) ? newItemsPerPage : currentNumItemsPerPage;
    currentPage.current = event.selected;
    const newOffset = isNaN((event.selected * perPageNum) % resultsLength) ? 0 : (event.selected * perPageNum) % resultsLength;
    const endOffset = (newOffset + perPageNum > resultsLength)
      ? resultsLength
      : newOffset + perPageNum;
    setItemOffset(newOffset);
    setEndResultIndex(endOffset);
  }, [formattedResults.length, itemsPerPage]);

  const handleUpdateResults = (
    filters: Filter[],
    asFilters: string[],
    summary: ResultSet | null,
    or: Result[] = [],
    justSort = false,
    sortType: string,
    userSavesGroup: SaveGroup | null = null,
    pfState: PathFilterState | null = null,
    fr: Result[] = [],
  ): Result[] => {
    if (!summary) return [];

    let newFormattedResults: Result[] = [];
    let newOriginalResults: Result[] = [];
    let newPathFilterState = pfState ? cloneDeep(pfState) : {};

    // Initial population of result state
    if (or.length === 0) {
      newFormattedResults = summary.data.results;
      newOriginalResults = cloneDeep(newFormattedResults);
      newPathFilterState = genPathFilterState(summary);
    } else {
      newFormattedResults = justSort ? cloneDeep(fr) : or;
      newOriginalResults = or;
    }

    // Inject bookmark and note tag filters
    [summary, newFormattedResults, newOriginalResults] = injectDynamicFilters(summary,
        newFormattedResults, newOriginalResults, userSavesGroup);

    // Filtering
    if (!justSort) {
      const {
        results,
        updatedEntityFilters,
        updatedPathFilterState,
        facetCounts,
        shouldResetPage
      } = applyFilters(
        filters,
        newFormattedResults,
        newOriginalResults,
        summary,
        newPathFilterState
      );

      newFormattedResults = results;
      newPathFilterState = updatedPathFilterState;

      // Update entity filters if changed
      if (!areEntityFiltersEqual(updatedEntityFilters, asFilters))
        setActiveEntityFilters(updatedEntityFilters);

      // Update available facet filters
      const newFilters = calculateFacetCounts(
        facetCounts.results,
        summary,
        facetCounts.negatedResults,
        facetCounts.resultFacets,
        facetCounts.negatedResultFacets
      );
      setAvailableFilters(newFilters);

      // Reset pagination if needed
      if (shouldResetPage && currentPage.current !== 0)
        handlePageReset(false, newFormattedResults.length);

      originalResults.current = newOriginalResults;
    }

    // Sorting
    newFormattedResults = getSortedResults(summary, newFormattedResults, sortType);

    // State assignment
    setFormattedResults(newFormattedResults);
    setPathFilterState(newPathFilterState);

    // First-load modal setup
    if (firstLoad.current && newFormattedResults.length > 0) {
      firstLoad.current = false;
      if (resultIdParam !== '0') {
        const sharedItemIndex = newFormattedResults.findIndex(result => result.id === resultIdParam);
        if (sharedItemIndex !== -1) {
          const sharedItemNode = getNodeById(summary, newFormattedResults[sharedItemIndex].subject);
          const sharedItemType = sharedItemNode ? sharedItemNode.types[0] : "";
          setSharedItem({
            index: sharedItemIndex,
            page: Math.floor(sharedItemIndex / itemsPerPage),
            name: newFormattedResults[sharedItemIndex].drug_name,
            type: sharedItemType
          });
          setFocusModalOpen(true);
        }
      }
    }

    rawResults.current = summary;
    return newFormattedResults;
  };


  const handleNewResults = (resultSet: ResultSet) => {
    // if we have no results, or the results aren't actually new, return
    if(resultSet == null || isEqual(resultSet, prevRawResults.current))
      return;

    // if the results status is error, or there is no results property in the data obj, return
    if(resultSet.status === 'error' || resultSet.data.results === undefined)
      return;

    // if rawResults are new, set prevRawResults for future comparison
    let newResultSet = cloneDeep(resultSet);
    prevRawResults.current = newResultSet;
    // precalculate evidence and path counts
    for(const result of newResultSet.data.results) {
      result.evidenceCount = getEvidenceCounts(newResultSet, result);
      result.pathCount = getPathCount(newResultSet, result.paths);
      result.score = generateScore(result.scores, scoreWeights.confidenceWeight, scoreWeights.noveltyWeight, scoreWeights.clinicalWeight)
    }
    // assign ids to edges
    for(const [id, edge] of Object.entries(newResultSet.data.edges))
      edge.id = id;
    // assign ids to nodes
    for(const [id, node] of Object.entries(newResultSet.data.nodes))
      node.id = id;

    dispatch(setResultSet({pk: currentQueryID || "", resultSet: newResultSet}));

    const newFormattedResults = handleUpdateResults(activeFilters, activeEntityFilters, newResultSet, [], false, currentSortString.current, userSaves);

    // we have results to show, set isLoading to false
    if (newFormattedResults.length > 0)
      setIsLoading(false);

    // If no results have returned from any ARAs, and ARA status is complete, set isLoading to false
    if(newResultSet && newResultSet.data.results && newResultSet.data.results.length === 0 && !isFetchingARAStatus.current)
      setIsLoading(false);
  }

  // React Query call for status of results
  useResultsStatusQuery(
    currentQueryID,
    isFetchingARAStatus,
    returnedARAs,
    numberOfStatusChecks,
    formattedResults,
    setIsError,
    setIsLoading,
    isFetchingResults
  );

  // React Query call for results
  useResultsDataQuery(
    currentQueryID,
    isFetchingResults,
    formattedResults,
    setFreshRawResults,
    handleNewResults,
    numberOfStatusChecks,
    isFetchingARAStatus,
    setIsError,
    setIsLoading
  );

  // Handle the sorting
  const getSortedResults = useCallback((summary: ResultSet, resultsToSort: Result[], sortName: string) => {
    if(!summary) {
      console.warn("No result set provided to getSortedResults");
      return summary;
    }

    let newSortedResults = cloneDeep(resultsToSort);
    switch (sortName) {
      case 'nameLowHigh':
        newSortedResults = (isPathfinder) ? sortByNamePathfinderLowHigh(newSortedResults) as Result[] : sortNameLowHigh(newSortedResults) as Result[];
        setIsSortedByName(true);
        setIsSortedByScore(null)
        setIsSortedByEvidence(null);
        setIsSortedByPaths(null);
        break;
      case 'nameHighLow':
        newSortedResults = (isPathfinder) ? sortByNamePathfinderHighLow(newSortedResults) as Result[] : sortNameHighLow(newSortedResults) as Result[];
        setIsSortedByName(false);
        setIsSortedByScore(null)
        setIsSortedByEvidence(null);
        setIsSortedByPaths(null);
        break;
      case 'evidenceLowHigh':
        newSortedResults = sortEvidenceLowHigh(summary, newSortedResults);
        setIsSortedByEvidence(true);
        setIsSortedByScore(null)
        setIsSortedByName(null);
        setIsSortedByPaths(null);
        break;
      case 'evidenceHighLow':
        newSortedResults = sortEvidenceHighLow(summary, newSortedResults);
        setIsSortedByEvidence(false);
        setIsSortedByScore(null)
        setIsSortedByName(null);
        setIsSortedByPaths(null);
        break;
      case 'scoreLowHigh':
        newSortedResults = sortScoreLowHigh(newSortedResults, scoreWeights);
        setIsSortedByScore(true)
        setIsSortedByEvidence(null);
        setIsSortedByName(null);
        setIsSortedByPaths(null);
        break;
      case 'scoreHighLow':
        newSortedResults = sortScoreHighLow(newSortedResults, scoreWeights);
        setIsSortedByScore(false)
        setIsSortedByEvidence(null);
        setIsSortedByName(null);
        setIsSortedByPaths(null);
        break;
      case 'pathsLowHigh':
        newSortedResults = sortPathsLowHigh(summary, newSortedResults);
        setIsSortedByPaths(true)
        setIsSortedByScore(null)
        setIsSortedByEvidence(null);
        setIsSortedByName(null);
        break;
      case 'pathsHighLow':
        newSortedResults = sortPathsHighLow(summary, newSortedResults);
        setIsSortedByPaths(false)
        setIsSortedByScore(null)
        setIsSortedByEvidence(null);
        setIsSortedByName(null);
        break;
      case 'entityString':
        newSortedResults = sortByEntityStrings(newSortedResults, activeEntityFilters);
        setIsSortedByPaths(null);
        setIsSortedByEvidence(null);
        setIsSortedByName(null);
        break;
      default:
        break;
    }

    return newSortedResults;
  }, [activeEntityFilters, isPathfinder, scoreWeights]);

  /**
   * Sets the evidence information and opens the evidence modal
   */
  const activateEvidence = useCallback((item: Result, edgeID: string | string[], path: Path, pathKey: string) => {
    if(!resultSet)
      return;
    let edge;
    if(!Array.isArray(edgeID))
      edge = getEdgeById(resultSet, edgeID);
    else
      edge = getCompressedEdge(resultSet, edgeID);

    if(!!edge) {
      setSelectedResult(item);
      setSelectedEdge(edge);
      setSelectedPath(path);
      setSelectedPathKey(pathKey);
      setEvidenceModalOpen(true);
    }
  },[resultSet])

  const activateNotes = (label: string, bookmarkID: string) => {
    noteLabel.current = label;
    currentBookmarkID.current = bookmarkID;
    setNotesModalOpen(true);
  }

  const handlePageReset = (newItemsPerPage: number | false, resultsLength: number) => {
    handlePageClick({selected: 0}, newItemsPerPage, resultsLength);
  }

  // Handle the addition and removal of individual filters. Keep the invariant that
  // filters of the same type are grouped together.
  const handleFilter = (filter: Filter) => {
    // Try to find a filter with same {id, value, negated} — for toggle-off
    const exactMatchIndex = activeFilters.findIndex(
      (f) =>
        f.id === filter.id &&
        f.value === filter.value &&
        f.negated === filter.negated
    );

    if (exactMatchIndex !== -1) {
      // Exact match found → toggle off by removing it
      const updatedFilters = activeFilters.filter((_, i) => i !== exactMatchIndex);
      handleApplyFilterAndCleanup(
        updatedFilters,
        activeEntityFilters,
        rawResults.current,
        originalResults.current,
        currentSortString.current,
        userSaves
      );
      return;
    }

    // Try to find a filter with same {id, value} but different negated — for update
    const sameIdValueIndex = activeFilters.findIndex(
      (f) =>
        f.id === filter.id &&
        f.value === filter.value &&
        f.negated !== filter.negated
    );

    let updatedFilters: Filter[];
    if (sameIdValueIndex !== -1) {
      // Replace old filter with new one (different negated)
      updatedFilters = activeFilters.map((f, i) =>
        i === sameIdValueIndex ? { ...filter } : f
      );
    } else {
      // Add new filter
      updatedFilters = [...activeFilters, { ...filter }];
    }

    updatedFilters.sort(filterCompare);

    handleApplyFilterAndCleanup(
      updatedFilters,
      activeEntityFilters,
      rawResults.current,
      originalResults.current,
      currentSortString.current,
      userSaves
    );
  };

  const handleApplyFilterAndCleanup = (filtersToActivate: Filter[], activeEntityFilters: string[], rawResults: ResultSet | null, originalResults: Result[], sortString: string, userSaves: SaveGroup | null = null) => {
    if(!rawResults)
      return;

    setActiveFilters(filtersToActivate);
    let newFormattedResults = handleUpdateResults(filtersToActivate, activeEntityFilters, rawResults, originalResults, false, sortString, userSaves);
    handlePageReset(false, newFormattedResults.length);
  }

  const handleClearAllFilters = () => {
    handleApplyFilterAndCleanup([], activeEntityFilters, rawResults.current, originalResults.current, currentSortString.current, userSaves);
  }

  useEffect(() => {
    if(!nodeIdParam)
      return;

    let node = rawResults.current?.data?.nodes[nodeIdParam];
    if(rawResults.current && node) {
      if(node.descriptions.length > 0) {
        setNodeDescription(node.descriptions[0].replaceAll('"', ''));
      }
    }

  },[formattedResults, nodeIdParam]);

  const handleResultMatchClick = useCallback((match: ResultContextObject) => {
    if(!match)
      return;

    let sharedItemIndex = formattedResults.findIndex(result => result.id === match.id);
    if(sharedItemIndex === -1)
      return;

    setResultIdParam(match.id);
    const newPage = Math.floor(sharedItemIndex / itemsPerPage);
    const resultSubjectNode = getNodeById(resultSet, formattedResults[sharedItemIndex].id);
    const resultSubjectType = (resultSubjectNode?.types[0]) ? resultSubjectNode?.types[0] : "";
    setSharedItem({
      index: sharedItemIndex,
      page: newPage,
      name: formattedResults[sharedItemIndex].drug_name,
      type: resultSubjectType
    });
    handlePageClick({selected: newPage}, false, formattedResults.length);
    setExpandSharedResult(true);
    setAutoScrollToResult(true);
  }, [formattedResults, itemsPerPage, handlePageClick, resultSet]);

  const handleResultsRefresh = () => {
    // Update rawResults with the fresh data
    if(!!freshRawResults)
      handleNewResults(freshRawResults);
    setFreshRawResults(null);
  }

  useSidebarRegistration({
    ariaLabel: "Filters",
    icon: <FilterIcon />,
    id: 'filters',
    label: "Filters",
    panelComponent: () => (
      <ResultsFilter
        activeFilters={activeFilters}
        onFilter={handleFilter}
        onClearAll={handleClearAllFilters}
        setExpanded={setFiltersExpanded}
        availableFilters={availableFilters}
        isPathfinder={isPathfinder}
      />
    ),
    tooltipText: "Filters",
    dependencies: [
      activeFilters,
      availableFilters,
      isPathfinder
    ],
    // autoOpen: true // Uncomment to auto-open when landing on Results
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ResultListModals
        shareResultID={shareResultID.current ? shareResultID.current : ""}
        presetTypeID={presetTypeID ? presetTypeID : ""}
        handlePageClick={handlePageClick}
        shareModalOpen={shareModalOpen}
        setShareModalOpen={setShareModalOpen}
        notesModalOpen={notesModalOpen}
        setNotesModalOpen={setNotesModalOpen}
        noteLabel={noteLabel.current}
        currentBookmarkID={currentBookmarkID}
        pk={currentQueryID ? currentQueryID : ""}
        focusModalOpen={focusModalOpen}
        setFocusModalOpen={setFocusModalOpen}
        evidenceModalOpen={evidenceModalOpen}
        setEvidenceModalOpen={setEvidenceModalOpen}
        selectedEdge={selectedEdge}
        selectedResult={selectedResult}
        selectedPath={selectedPath}
        selectedPathKey={selectedPathKey}
        sharedItem={sharedItem}
        formattedResultsLength={formattedResults.length}
        setExpandSharedResult={setExpandSharedResult}
        setAutoScrollToResult={setAutoScrollToResult}
        shouldUpdateResultsAfterBookmark={shouldUpdateResultsAfterBookmark}
        updateUserSaves={setUserSaves}
      />
      <div className={styles.resultList}>
        {
          isPathfinder
          ?
            <QueryPathfinder
              isResults
              loading={isLoading}
              setShareModalFunction={setShareModalOpen}
              results={formattedResults}
              handleResultMatchClick={handleResultMatchClick}
              pk={!!currentQueryID ? currentQueryID : ""}
            />
          :
            <Query
              isResults
              loading={isLoading}
              initPresetTypeObject={presetTypeObject}
              initNodeIdParam={nodeIdParam}
              initNodeLabelParam={nodeLabelParam}
              nodeDescription={nodeDescription}
              setShareModalFunction={setShareModalOpen}
              results={formattedResults}
              handleResultMatchClick={handleResultMatchClick}
              pk={!!currentQueryID ? currentQueryID : ""}
            />
        }
        <div className={`${styles.resultsContainer} container`}>
          {
            isLoading &&
            <LoadingBar
              useIcon
              disclaimerText={<>
                <p className={styles.loadingText}>We will start showing you results as soon as we have them. You'll be prompted to refresh the page as we load more results. <strong>Please note that refreshing the results page may cause the order of answers to change.</strong></p>
                <p className={styles.loadingText}>Navigating away from this page will cancel your search.</p></>
              }
            />
          }
          {
            !isLoading &&
            <>
              <div>
                <ResultListHeader
                  data={{
                    formattedResultsLength: formattedResults.length,
                    originalResultsLength: originalResults.current.length,
                    itemOffset: itemOffset,
                    endResultIndex: endResultIndex,
                    activeFilters: activeFilters,
                    handleFilter: handleFilter,
                    shareModalOpen: shareModalOpen,
                    setShareModalOpen: setShareModalOpen,
                    shareResultID: shareResultID.current,
                    setShareResultID: setShareResultID,
                    currentQueryID: currentQueryID,
                    isError: isError,
                    currentPage: currentPage.current,
                    ResultListStyles: styles,
                    pageCount: pageCount,
                    handlePageClick: handlePageClick,
                  }}
                />
                <div className={`${styles.resultsTableContainer} ${isPathfinder ? styles.pathfinder : ''}`}>
                  <div className={styles.resultsTable}>
                    <div className={styles.tableBody}>
                      <ResultListTableHead
                        parentStyles={styles}
                        currentSortString={currentSortString}
                        isPathfinder={isPathfinder}
                        isSortedByEvidence={isSortedByEvidence}
                        isSortedByName={isSortedByName}
                        isSortedByPaths={isSortedByPaths}
                        isSortedByScore={isSortedByScore}
                        handleUpdateResults={()=>handleUpdateResults(activeFilters, activeEntityFilters, rawResults.current as ResultSet, originalResults.current, true, currentSortString.current, userSaves, pathFilterState, formattedResults)}
                      />
                      {
                        isError &&
                        <h5 className={styles.errorText}>There was an error when processing your query. Please try again.</h5>
                      }
                      {
                        !isLoading &&
                        !isError &&
                        displayedResults.length === 0 &&
                        <h5 className={styles.errorText}>No results available.</h5>
                      }
                      {
                        !isLoading &&
                        !isError &&
                        displayedResults.length > 0 &&
                        displayedResults.map((item, i) => {
                          const result = getResultById(resultSet, item.id);
                          if(!result || !pathFilterState)
                            return null;

                          let bookmarkID = (userSaves === null) ? null : checkBookmarksForItem(item.id, userSaves);
                          let bookmarkItem = userSaves?.saves ? findInSet(userSaves.saves, save => save.id ? save.id.toString() === bookmarkID : false) : undefined;
                          return (
                            <ResultItem
                              isEven={i % 2 !== 0}
                              isPathfinder={isPathfinder}
                              key={item.id}
                              queryType={presetTypeObject}
                              result={result}
                              pathFilterState={pathFilterState}
                              activateEvidence={activateEvidence}
                              activateNotes={activateNotes}
                              activeEntityFilters={activeEntityFilters}
                              zoomKeyDown={zoomKeyDown}
                              pk={currentQueryID}
                              queryNodeID={nodeIdParam}
                              queryNodeLabel={nodeLabelParam}
                              queryNodeDescription={nodeDescription}
                              bookmarkItem={bookmarkItem}
                              handleBookmarkError={handleBookmarkError}
                              bookmarkAddedToast={bookmarkAddedToast}
                              bookmarkRemovedToast={bookmarkRemovedToast}
                              availableFilters={availableFilters}
                              handleFilter={handleFilter}
                              activeFilters={activeFilters}
                              sharedItemRef={item.id === resultIdParam ? sharedItemRef as RefObject<HTMLDivElement> : null}
                              startExpanded={item.id === resultIdParam && expandSharedResult}
                              setExpandSharedResult={setExpandSharedResult}
                              setShareModalOpen={setShareModalOpen}
                              setShareResultID={setShareResultID}
                              resultsComplete={(!isError && freshRawResults === null && !isFetchingARAStatus.current && !isFetchingResults.current)}
                              scoreWeights={scoreWeights}
                              showHiddenPaths={showHiddenPaths}
                              shouldUpdateResultsAfterBookmark={shouldUpdateResultsAfterBookmark}
                              setShowHiddenPaths={setShowHiddenPaths}
                              updateUserSaves={setUserSaves}
                            />
                          )
                        })
                      }
                    </div>
                  </div>
                  {
                    formattedResults.length > 0 &&
                    <ResultListBottomPagination
                      parentStyles={styles}
                      itemsPerPage={itemsPerPage}
                      setItemsPerPage={setItemsPerPage}
                      handlePageReset={handlePageReset}
                      handlePageClick={handlePageClick}
                      formattedResultsLength={formattedResults.length}
                      pageCount={pageCount}
                      currentPage={currentPage.current}
                    />
                  }
                </div>
              </div>
            </>
          }
        </div>
        {
          formattedResults.length > 0 &&
          <StickyToolbar
            loadingButtonData={{
              handleResultsRefresh: handleResultsRefresh,
              isFetchingARAStatus: isFetchingARAStatus.current,
              isFetchingResults: isFetchingResults.current,
              showDisclaimer: true,
              containerClassName: styles.shareLoadingButtonContainer,
              buttonClassName: styles.loadingButton,
              hasFreshResults: (freshRawResults !== null)
            }}
            isError={isError}
            returnedARAs={returnedARAs.current}
          />
        }
      </div>
      {
        blocker &&
        <NavConfirmationPromptModal
          blocker={blocker}
          title="Are you sure you want to leave this page?"
          message="If you leave this page, you may lose your results and have to run this query again."
          subtitle="Note: You can revisit this query later by visiting the Search History page."
          proceedButtonText="Navigate away from the results page"
          stayButtonText="Stay on the results page"
        />
      }
    </QueryClientProvider>
  );
}

export default ResultList;
