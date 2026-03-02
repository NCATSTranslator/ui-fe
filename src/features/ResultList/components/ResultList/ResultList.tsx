import { useRef, useCallback, useEffect, useMemo, RefObject } from "react";
import styles from './ResultList.module.scss';
import Query from "@/features/Query/components/Query/Query";
import ResultItem from "@/features/ResultItem/components/ResultItem/ResultItem";
import ResultListLoadingArea from "@/features/ResultList/components/ResultListLoadingArea/ResultListLoadingArea";
import ResultListHeader from "@/features/ResultList/components/ResultListHeader/ResultListHeader";
import { cloneDeep } from "lodash";
import { useSelector, useDispatch } from 'react-redux';
import { getResultSetById, getResultById, getNodeById }from "@/features/ResultList/slices/resultsSlice";
import { currentPrefs, currentUser }from "@/features/UserAuth/slices/userSlice";
import { applyFilters, injectDynamicFilters, genPathFilterState, areEntityFiltersEqual, calculateFacetCounts } from "@/features/ResultList/utils/resultsInteractionFunctions";
import { getDataFromQueryVar } from "@/features/Common/utils/utilities";
import { queryTypes } from "@/features/Query/utils/queryTypes";
import { SaveGroup } from "@/features/UserAuth/utils/userApi";
import QueryPathfinder from "@/features/Query/components/QueryPathfinder/QueryPathfinder";
import ResultListTableHead from "@/features/ResultList/components/ResultListTableHead/ResultListTableHead";
import ResultListModals from "@/features/ResultList/components/ResultListModals/ResultListModals";
import ResultListBottomPagination from "@/features/ResultList/components/ResultListBottomPagination/ResultListBottomPagination";
import { ResultSet, Result, PathFilterState, ScoreWeights } from "@/features/ResultList/types/results.d";
import { Filter } from "@/features/ResultFiltering/types/filters";
import useScoreWeights from "@/features/ResultList/hooks/useScoreWeights";
import { useQueryChangeReset } from "@/features/ResultList/hooks/resultListHooks";
import useZoomKey from "@/features/ResultList/hooks/useZoomKey";
import useEvidenceModal from "@/features/ResultList/hooks/useEvidenceModal";
import useSortState from "@/features/ResultList/hooks/useSortState";
import usePagination from "@/features/ResultList/hooks/usePagination";
import useShareState from "@/features/ResultList/hooks/useShareState";
import useResultFiltering, { HandleUpdateResultsFn } from "@/features/ResultList/hooks/useResultFiltering";
import useUserBookmarks from "@/features/ResultList/hooks/useUserBookmarks";
import useResultsData from "@/features/ResultList/hooks/useResultsData";
import { useDecodedParams } from '@/features/Core/hooks/useDecodedParams';
import { useNotesModal } from '@/features/ResultItem/hooks/useNotesModal';
import { bookmarkAddedToast, bookmarkRemovedToast, bookmarkErrorToast } from "@/features/Core/utils/toastMessages";
import useSidebarPanels from "@/features/ResultList/hooks/useSidebarPanels";
import { useUserQueries, useGetQueryCardTitle } from "@/features/Projects/hooks/customHooks";
import { UserQueryObject } from "@/features/Projects/types/projects";
import { ResultListProvider, ResultListContextValue } from "@/features/ResultList/context/ResultListContext";

const ResultList = () => {

  const user = useSelector(currentUser);
  const prefs = useSelector(currentPrefs);
  const dispatch = useDispatch();

  // URL search params - reactive to URL changes
  const decodedParams = useDecodedParams();
  const loadingParam = getDataFromQueryVar("loading", decodedParams);
  const currentQueryID = getDataFromQueryVar("q", decodedParams);
  // Track previous query ID to detect changes
  const prevQueryID = useRef<string | null>(currentQueryID);
  const presetTypeID = getDataFromQueryVar("t", decodedParams);
  const isPathfinder = (presetTypeID === "p");
  const presetTypeObject = (!!presetTypeID)
    ? queryTypes.find(type => type.id === parseInt(presetTypeID)) ?? null
    : null;

  const { data: queries = [] } = useUserQueries();
  const currentQuerySid: string | undefined = useMemo(() => queries.find((q: UserQueryObject) => q.data.qid === currentQueryID)?.sid, [queries, currentQueryID]);
  const currentQueryObject = useMemo(() => queries.find((q: UserQueryObject) => q.data.qid === currentQueryID) || null, [queries, currentQueryID]);
  const { title: resolvedQueryTitle } = useGetQueryCardTitle(currentQueryObject);

  const nodeLabelParam = getDataFromQueryVar("l", decodedParams);
  const nodeIdParam = getDataFromQueryVar("i", decodedParams);

  // Build query title for downloads - use resolved title if available, otherwise build from URL params
  const queryTitle = useMemo(() => {
    if (resolvedQueryTitle) return resolvedQueryTitle;
    // Fallback: construct title from URL parameters
    if (nodeLabelParam) {
      const typeLabel = isPathfinder ? 'Pathfinder' : (presetTypeObject?.targetType || 'Query');
      return `${nodeLabelParam} — ${typeLabel}s`;
    }
    return '';
  }, [resolvedQueryTitle, nodeLabelParam, isPathfinder, presetTypeObject]);
  const resultSet = useSelector(getResultSetById(currentQueryID));
  const loading = (loadingParam === 'true') ? true : false;
  const presetIsLoading = (currentQueryID) ? true : loading;

  // start with user pref or default to score high low as default sort
  const initSortString: string = (prefs?.result_sort?.pref_value) ? prefs.result_sort.pref_value as string : 'scoreHighLow';

  // Evidence modal state management via hook
  const {
    evidenceModalOpen,
    setEvidenceModalOpen,
    selectedResult,
    selectedEdge,
    selectedPath,
    selectedPathKey,
    activateEvidence,
    resetEvidenceModal,
  } = useEvidenceModal(resultSet);

  const { scoreWeights, noveltyBoost, handleToggleNoveltyBoost } = useScoreWeights({
    onWeightsChange: (newWeights: ScoreWeights) => {
      recalculateScores(newWeights);
    }
  });

  // Notes modal state management via hook
  const {
    isOpen: notesModalOpen,
    noteLabel,
    currentBookmarkID,
    openNotes: activateNotes,
    closeNotes,
  } = useNotesModal();

  // Sort state management via hook (declared before data/filtering since filtering reads currentSortString via ref)
  const {
    isSortedByName,
    isSortedByEvidence,
    isSortedByPaths,
    isSortedByScore,
    currentSortString,
    activeEntityFiltersRef,
    getSortedResults,
    resetSort,
  } = useSortState({ scoreWeights, initSortString });

  // Shared refs — created before hooks that need them, synced via effects after hook calls return
  const userSavesRef = useRef<SaveGroup | null>(null);
  const handleUpdateResultsRef = useRef<HandleUpdateResultsFn | null>(null);
  const activeFiltersRef = useRef<Filter[]>([]);
  const resultIdParamRef = useRef<string | null>(null);
  const itemsPerPageRef = useRef<number>(0);
  const decodedParamsRef = useRef<string>(decodedParams);

  // Data lifecycle hook — state, refs, fetching, and data processing
  const {
    formattedResults, setFormattedResults,
    isLoading, setIsLoading, isError, setIsError,
    arsStatus, setArsStatus, resultStatus, setResultStatus,
    setFreshRawResults,
    nodeDescription, setNodeDescription,
    hasFreshResults, resultsComplete,
    rawResults, originalResults, prevRawResults,
    isFetchingARAStatus, setIsFetchingARAStatus, isFetchingResults, setIsFetchingResults,
    numberOfStatusChecks, firstLoad,
    recalculateScores, handleResultsRefresh,
  } = useResultsData({
    currentQueryID, currentQuerySid, isPathfinder,
    presetIsLoading, initialResultSet: resultSet, nodeIdParam,
    dispatch, scoreWeights, activeFiltersRef, activeEntityFiltersRef,
    currentSortString, userSavesRef, handleUpdateResultsRef,
  });

  // Pagination state management via hook
  const initialItemsPerPage = ((!!prefs.results_per_page.pref_value) ? (typeof prefs.results_per_page.pref_value === "string") ? parseInt(prefs.results_per_page.pref_value) : prefs.results_per_page.pref_value : 10) as number;
  const {
    itemOffset,
    setItemOffset,
    itemsPerPage,
    setItemsPerPage,
    endResultIndex,
    setEndResultIndex,
    currentPage,
    displayedResults,
    pageCount,
    handlePageClick,
    handlePageReset,
    calculateItemsPerPage,
  } = usePagination({ formattedResults, initialItemsPerPage });

  // Share state management via hook
  const {
    shareResultID,
    setShareResultID,
    sharedItem,
    setSharedItem,
    setAutoScrollToResult,
    expandSharedResult,
    setExpandSharedResult,
    sharedItemRef,
    shareModalOpen,
    setShareModalOpen,
    focusModalOpen,
    setFocusModalOpen,
    resultIdParam,
    setResultIdParam,
    resetShareState,
  } = useShareState({
    initialResultIdParam: getDataFromQueryVar("r", decodedParams),
  });

  // Bool, is the zoom key being held down
  const { zoomKeyDown } = useZoomKey();

  // Result filtering state management via hook
  const {
    activeFilters,
    availableFilters,
    setAvailableFilters,
    activeEntityFilters,
    setActiveEntityFilters,
    pathFilterState,
    setPathFilterState,
    handleFilter,
    handleClearAllFilters,
    resetFilters,
  } = useResultFiltering({
    handlePageReset,
    rawResults,
    originalResults,
    currentSortString,
    isPathfinder,
    userSavesRef,
    handleUpdateResultsRef,
  });
  // Keep the sort hook's entity filters ref in sync
  activeEntityFiltersRef.current = activeEntityFilters;

  // User bookmarks state management via hook
  const {
    userSaves,
    setUserSaves,
    showHiddenPaths,
    setShowHiddenPaths,
    shouldUpdateResultsAfterBookmark,
    resetBookmarks,
  } = useUserBookmarks({
    user: user ?? null,
    currentQueryID,
    activeFilters,
    activeEntityFilters,
    prevRawResults,
    currentSortString,
    isPathfinder,
    handleUpdateResultsRef,
  });
  // Sync shared refs after hook calls
  userSavesRef.current = userSaves;
  activeFiltersRef.current = activeFilters;
  resultIdParamRef.current = resultIdParam;
  itemsPerPageRef.current = itemsPerPage;
  decodedParamsRef.current = decodedParams;

  // Reset state when the query ID changes (e.g., navigating to a different query)
  useQueryChangeReset({
    currentQueryID,
    decodedParamsRef,
    itemsPerPageRef,
    prevQueryID,
    rawResults,
    prevRawResults,
    originalResults,
    numberOfStatusChecks,
    currentPage,
    firstLoad,
    setIsFetchingARAStatus,
    setIsFetchingResults,
    setIsLoading,
    setIsError,
    setFormattedResults,
    setFreshRawResults,
    resetFilters,
    setArsStatus,
    setResultStatus,
    setItemOffset,
    setEndResultIndex,
    resetEvidenceModal,
    closeNotesModal: closeNotes,
    resetShareState,
    resetBookmarks,
    setResultIdParam,
    setNodeDescription,
  });

  // update defaults when prefs change
  useEffect(() => {
    const newSortString = (prefs?.result_sort?.pref_value) ? prefs.result_sort.pref_value as string : 'scoreHighLow';
    resetSort(newSortString);
    const tempItemsPerPage = calculateItemsPerPage(prefs.results_per_page.pref_value as string | number);
    setItemsPerPage(tempItemsPerPage);
    setEndResultIndex(tempItemsPerPage);
  }, [prefs, calculateItemsPerPage, resetSort]);

  const handleUpdateResults = useCallback((
    filters: Filter[],
    asFilters: string[],
    summary: ResultSet | null,
    or: Result[] = [],
    justSort = false,
    sortType: string,
    isPathfinder: boolean = false,
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
      newFormattedResults = justSort ? fr : or;
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
    newFormattedResults = getSortedResults(summary, newFormattedResults, sortType, isPathfinder);

    // State assignment
    setFormattedResults(newFormattedResults);
    setPathFilterState(newPathFilterState);

    // First-load modal setup
    if (firstLoad.current && newFormattedResults.length > 0) {
      firstLoad.current = false;
      if (resultIdParamRef.current && resultIdParamRef.current !== '0') {
        const sharedItemIndex = newFormattedResults.findIndex(result => result.id === resultIdParamRef.current);
        if (sharedItemIndex !== -1) {
          const sharedItemNode = getNodeById(summary, newFormattedResults[sharedItemIndex].subject);
          const sharedItemType = sharedItemNode ? sharedItemNode.types[0] : "";
          setSharedItem({
            index: sharedItemIndex,
            page: Math.floor(sharedItemIndex / itemsPerPageRef.current),
            name: newFormattedResults[sharedItemIndex].drug_name,
            type: sharedItemType
          });
          setFocusModalOpen(true);
        }
      }
    }

    rawResults.current = summary;
    return newFormattedResults;
  }, [handlePageReset, getSortedResults, setFormattedResults, setPathFilterState, setActiveEntityFilters, setAvailableFilters, setSharedItem, setFocusModalOpen,]);

  // Wire up the handleUpdateResults ref — runs synchronously during render
  // to ensure the ref is available before any callbacks fire.
  handleUpdateResultsRef.current = handleUpdateResults;

  // Sidebar panel registrations (status, filters, download)
  useSidebarPanels({
    styles,
    arsStatus, resultStatus, formattedResults,
    isFetchingARAStatus,
    isFetchingResults,
    hasFreshResults, isError,
    handleResultsRefresh, setIsLoading, isLoading,
    activeFilters, handleFilter, handleClearAllFilters, availableFilters,
    isPathfinder, resultSet: resultSet ?? null, userSaves, queryTitle,
  });

  // Extracted callback for sort-triggered updates (avoids inline arrow in JSX)
  const handleSortUpdate = useCallback(() => {
    handleUpdateResults(
      activeFilters, activeEntityFilters, rawResults.current as ResultSet,
      originalResults.current, true, currentSortString.current,
      isPathfinder, userSaves, pathFilterState, formattedResults
    );
  }, [handleUpdateResults, activeFilters, activeEntityFilters, isPathfinder, userSaves, pathFilterState, formattedResults]);

  // Memoized data prop for ResultListHeader
  // Note: currentPage is a ref — it updates in sync with itemOffset/endResultIndex
  // via handlePageClick, so those state deps keep this memo current.
  const headerData = useMemo(() => ({
    formattedResultsLength: formattedResults.length,
    originalResultsLength: originalResults.current.length,
    itemOffset,
    endResultIndex,
    currentPage: currentPage.current,
    ResultListStyles: styles,
    pageCount,
    handlePageClick,
    noveltyBoost,
    onToggleNoveltyBoost: handleToggleNoveltyBoost,
  }), [formattedResults, itemOffset, endResultIndex, pageCount, handlePageClick, noveltyBoost, handleToggleNoveltyBoost]);

  const resultListContextValue: ResultListContextValue = useMemo(() => ({
    activateEvidence,
    activateNotes,
    activeEntityFilters,
    activeFilters,
    availableFilters,
    handleFilter,
    bookmarkAddedToast,
    bookmarkRemovedToast,
    handleBookmarkError: bookmarkErrorToast,
    isPathfinder,
    pathFilterState,
    pk: currentQueryID,
    queryNodeID: nodeIdParam,
    queryNodeLabel: nodeLabelParam,
    queryNodeDescription: nodeDescription,
    queryType: presetTypeObject,
    resultsComplete,
    scoreWeights,
    setExpandSharedResult,
    setShareModalOpen,
    setShareResultID,
    showHiddenPaths,
    setShowHiddenPaths,
    shouldUpdateResultsAfterBookmark,
    updateUserSaves: setUserSaves,
    zoomKeyDown,
  }), [
    activateEvidence, activateNotes, activeEntityFilters, activeFilters,
    availableFilters, handleFilter, isPathfinder, pathFilterState,
    currentQueryID, nodeIdParam, nodeLabelParam, nodeDescription,
    presetTypeObject, resultsComplete, scoreWeights,
    showHiddenPaths, zoomKeyDown,
  ]);

  return (
    <>
      <ResultListModals
        shareResultID={shareResultID.current ? shareResultID.current : ""}
        presetTypeID={presetTypeID ? presetTypeID : ""}
        handlePageClick={handlePageClick}
        shareModalOpen={shareModalOpen}
        setShareModalOpen={setShareModalOpen}
        notesModalOpen={notesModalOpen}
        onCloseNotesModal={closeNotes}
        noteLabel={noteLabel}
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
              setShareModalFunction={setShareModalOpen}
              pk={!!currentQueryID ? currentQueryID : ""}
            />
          :
            <Query
              isResults
              initPresetTypeObject={presetTypeObject}
              initNodeIdParam={nodeIdParam}
              initNodeLabelParam={nodeLabelParam}
              nodeDescription={nodeDescription}
              setShareModalFunction={setShareModalOpen}
              pk={!!currentQueryID ? currentQueryID : ""}
            />
        }
        <div className={`${styles.resultsContainer} container`}>
          {
            isLoading &&
            <ResultListLoadingArea />
          }
          {
            !isLoading &&
            <ResultListProvider value={resultListContextValue}>
              <div>
                <ResultListHeader data={headerData} />
                <div className={`${styles.resultsTableContainer} ${isPathfinder ? styles.pathfinder : ''}`}>
                  <div className={styles.resultsTable}>
                    <div className={styles.tableBody}>
                      <ResultListTableHead
                        parentStyles={styles}
                        currentSortString={currentSortString}
                        isSortedByEvidence={isSortedByEvidence}
                        isSortedByName={isSortedByName}
                        isSortedByPaths={isSortedByPaths}
                        isSortedByScore={isSortedByScore}
                        handleUpdateResults={handleSortUpdate}
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

                          const bookmarkItem = userSaves?.saves.get(item.id) ?? null;
                          return (
                            <ResultItem
                              key={item.id}
                              result={result}
                              isEven={i % 2 !== 0}
                              bookmarkItem={bookmarkItem}
                              sharedItemRef={item.id === resultIdParam ? sharedItemRef as RefObject<HTMLDivElement> : null}
                              startExpanded={item.id === resultIdParam && expandSharedResult}
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
            </ResultListProvider>
          }
        </div>
      </div>
    </>
  );
}

export default ResultList;
