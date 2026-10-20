import { useRef, useCallback, useEffect, useLayoutEffect, useMemo, FC, ReactNode } from "react";
import styles from './ResultList.module.scss';
import ResultListRows from "@/features/ResultList/components/ResultListRows/ResultListRows";
import ResultListLoadingArea from "@/features/ResultList/components/ResultListLoadingArea/ResultListLoadingArea";
import ResultListHeader from "@/features/ResultList/components/ResultListHeader/ResultListHeader";
import ResultListSubheading from "@/features/ResultList/components/ResultListSubheading/ResultListSubheading";
import { useSelector, useDispatch } from 'react-redux';
import { getResultSetById, getNodeById } from "@/features/ResultList/slices/resultsSlice";
import { currentPrefs, currentUser }from "@/features/UserAuth/slices/userSlice";
import { areEntityFiltersEqual } from "@/features/ResultList/utils/resultsInteractionFunctions";
import { computeResultsUpdate } from "@/features/ResultList/utils/resultsUpdate";
import { getDataFromQueryVar } from "@/features/Core/utils/urlHelpers";
import { SaveGroup } from "@/features/UserAuth/utils/userApi";
import ResultListTableHead from "@/features/ResultList/components/ResultListTableHead/ResultListTableHead";
import ResultListModals from "@/features/ResultList/components/ResultListModals/ResultListModals";
import ResultListBottomPagination from "@/features/ResultList/components/ResultListBottomPagination/ResultListBottomPagination";
import { Result, ResultSet, PathFilterState, ScoreWeights } from "@/features/ResultList/types/results.d";
import { Filter } from "@/features/ResultFiltering/types/filters";
import useScoreWeights from "@/features/ResultList/hooks/useScoreWeights";
import { useQueryChangeReset } from "@/features/ResultList/hooks/resultListHooks";
import useSortState from "@/features/ResultList/hooks/useSortState";
import useResultPagination, { parseItemsPerPage } from "@/features/ResultList/hooks/useResultPagination";
import useShareState from "@/features/ResultList/hooks/useShareState";
import useResultFiltering, { HandleUpdateResultsFn, ResultsUpdate } from "@/features/ResultList/hooks/useResultFiltering";
import useUserBookmarks from "@/features/ResultList/hooks/useUserBookmarks";
import useResultsData from "@/features/ResultList/hooks/useResultsData";
import { useResultsUrlParams, useQueryTitle } from "@/features/ResultList/hooks/useResultsUrlParams";
import { useDecodedParams } from '@/features/Core/hooks/useDecodedParams';
import { useNotesModal } from '@/features/ResultItem/hooks/useNotesModal';
import { bookmarkErrorToast, bookmarkRemovalErrorToast } from "@/features/Core/utils/toastMessages";
import { BookmarkOperation } from "@/features/ResultItem/utils/bookmarkFunctions";
import useSidebarPanels from "@/features/ResultList/hooks/useSidebarPanels";
import { useUserQueries, useGetQueryCardTitle } from "@/features/Projects/hooks/customHooks";
import { UserQueryObject } from "@/features/Projects/types/projects";
import { ResultListProvider, ResultListContextValue } from "@/features/ResultList/context/ResultListContext";
import useEvidenceViewNavigation from "@/features/ResultList/hooks/useEvidenceViewNavigation";
import { useResultsNavigate } from "@/features/Navigation/hooks/useResultsNavigate";
import { useParams } from "react-router-dom";

interface ResultListProps {
  children?: ReactNode;
  hidden?: boolean;
}

// Bookmark saves are applied optimistically, so a toast only appears when one fails.
const handleBookmarkError = (operation: BookmarkOperation) => {
  if (operation === 'remove') bookmarkRemovalErrorToast();
  else bookmarkErrorToast();
};

// Composition root for the results page: it wires ~12 hooks into one context and layout.
// Everything separable has been extracted; what remains is the composition itself.
// eslint-disable-next-line max-lines-per-function
const ResultList: FC<ResultListProps> = ({ children, hidden = false }) => {

  const user = useSelector(currentUser);
  const prefs = useSelector(currentPrefs);
  const dispatch = useDispatch();

  // URL search params - reactive to URL changes
  const decodedParams = useDecodedParams();
  const urlParams = useResultsUrlParams(decodedParams);
  const {
    currentQueryID, loading, presetTypeID, isPathfinder, isLookup, presetTypeObject,
    nodeIdParam, pathfinderIdOne, pathfinderLabelOne, pathfinderIdTwo, pathfinderLabelTwo,
    constraintText, lookupCategory, effectiveNodeLabel, effectiveNodeId,
  } = urlParams;
  // Track previous query ID to detect changes
  const prevQueryID = useRef<string | null>(currentQueryID);

  const { data: queries = [], isSuccess: areUserQueriesLoaded } = useUserQueries();
  const currentQuerySid: number | undefined = useMemo(() => queries.find((q: UserQueryObject) => q.data.qid === currentQueryID)?.sid, [queries, currentQueryID]);
  const currentQueryObject = useMemo(() => queries.find((q: UserQueryObject) => q.data.qid === currentQueryID) || null, [queries, currentQueryID]);
  const { title: resolvedQueryTitle } = useGetQueryCardTitle(currentQueryObject);
  // Build query title for downloads - use resolved title if available, otherwise build from URL params
  const queryTitle = useQueryTitle(resolvedQueryTitle, urlParams);
  const resultSet = useSelector(getResultSetById(currentQueryID));
  const presetIsLoading = (currentQueryID) ? true : loading;

  // start with user pref or default to score high low as default sort
  const initSortString: string = (prefs?.result_sort?.pref_value) ? prefs.result_sort.pref_value as string : 'scoreHighLow';

  // Route params and navigation available to child components via context
  const { resultId } = useParams();
  const resultsNavigate = useResultsNavigate();

  // Evidence navigation via hook
  const {
    navigateToEvidenceView,
  } = useEvidenceViewNavigation(resultId);

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
    currentSortString,
    activeEntityFiltersRef,
    getSortedResults,
  } = useSortState({ scoreWeights, initSortString });

  // Shared refs — created before hooks that need them, synced via effects after hook calls return
  const userSavesRef = useRef<SaveGroup | null>(null);
  const handleUpdateResultsRef = useRef<HandleUpdateResultsFn | null>(null);
  const handleSortUpdateRef = useRef<(() => void) | null>(null);
  const activeFiltersRef = useRef<Filter[]>([]);
  const pathFilterStateRef = useRef<PathFilterState | null>(null);
  const resultIdParamRef = useRef<string | null>(null);
  const itemsPerPageRef = useRef<number>(0);
  const visibleResultIdsRef = useRef<Set<string>>(new Set());

  // Data lifecycle hook — state, refs, fetching, and data processing
  const {
    formattedResults, setFormattedResults,
    isLoading, setIsLoading, isError,
    arsStatus, resultStatus,
    nodeDescription,
    hasFreshResults, resultsComplete,
    rawResults, originalResults, prevRawResults,
    isFetchingARAStatus, isFetchingResults,
    firstLoad,
    recalculateScores, handleResultsRefresh, resetResultsData
  } = useResultsData({
    currentQueryID, currentQuerySid, areUserQueriesLoaded, isPathfinder,
    presetIsLoading, initialResultSet: resultSet, nodeIdParam,
    dispatch, scoreWeights, handleUpdateResultsRef,
  });

  const visibleResultIds = useMemo(
    () => new Set(formattedResults.map(r => r.id)),
    [formattedResults]
  );

  // Pagination state management via hook
  const initialItemsPerPage = parseItemsPerPage(prefs.results_per_page.pref_value as string | number);
  const {
    itemOffset,
    itemsPerPage,
    setItemsPerPage,
    endResultIndex,
    setEndResultIndex,
    currentPage,
    displayedResults,
    pageCount,
    handlePageClick,
    handlePageChange,
    handlePageReset,
    resetPagination,
    calculateItemsPerPage,
  } = useResultPagination({ formattedResults, initialItemsPerPage });

  // Share state management via hook
  const {
    shareResultID,
    setShareResultID,
    sharedItem,
    setSharedItem,
    setAutoScrollToResult,
    setExpandSharedResult,
    shareModalOpen,
    setShareModalOpen,
    focusModalOpen,
    setFocusModalOpen,
    resultIdParam,
    resetShareState,
  } = useShareState({
    initialResultIdParam: getDataFromQueryVar("r", decodedParams),
  });

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
    handleSetFilters,
    handleClearAllFilters,
    resetFilters,
  } = useResultFiltering({
    handlePageReset,
    rawResults,
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
    prevRawResults,
    handleUpdateResultsRef,
  });
  // Sync shared refs after hook calls
  userSavesRef.current = userSaves;
  activeFiltersRef.current = activeFilters;
  pathFilterStateRef.current = pathFilterState;
  resultIdParamRef.current = resultIdParam;
  itemsPerPageRef.current = itemsPerPage;
  visibleResultIdsRef.current = visibleResultIds;

  // Reset state when the query ID changes (e.g., navigating to a different query)
  useQueryChangeReset({
    currentQueryID,
    prevQueryID,
    resetResultsData,
    resetFilters,
    resetPagination,
    closeNotesModal: closeNotes,
    resetShareState,
    resetBookmarks,
  });

  // update defaults when prefs change
  useEffect(() => {
    const newSortString = (prefs?.result_sort?.pref_value) ? prefs.result_sort.pref_value as string : 'scoreHighLow';
    currentSortString.current = newSortString;
    handleSortUpdateRef.current?.();
    const tempItemsPerPage = calculateItemsPerPage(prefs.results_per_page.pref_value as string | number);
    setItemsPerPage(tempItemsPerPage);
    setEndResultIndex(tempItemsPerPage);
  }, [prefs, calculateItemsPerPage, currentSortString, setItemsPerPage, setEndResultIndex]);

  // Opens the shared-result modal once, on the first non-empty result list, when
  // the URL named a result to focus.
  const openSharedResultOnFirstLoad = useCallback((summary: ResultSet, results: Result[]) => {
    if (!firstLoad.current || results.length === 0) return;
    firstLoad.current = false;
    const sharedId = resultIdParamRef.current;
    if (!sharedId || sharedId === '0') return;
    const sharedItemIndex = results.findIndex(result => result.id === sharedId);
    if (sharedItemIndex === -1) return;
    const sharedItemNode = getNodeById(summary, results[sharedItemIndex].subject);
    setSharedItem({
      index: sharedItemIndex,
      page: Math.floor(sharedItemIndex / itemsPerPageRef.current),
      name: results[sharedItemIndex].drug_name,
      type: sharedItemNode ? sharedItemNode.types[0] : "",
    });
    setFocusModalOpen(true);
  }, [firstLoad, setSharedItem, setFocusModalOpen]);

  // Recomputes the result list for a ResultsUpdate (see its doc for the modes).
  // Reads filters, sort, bookmarks, and path filter state from refs rather than
  // props so the hooks that trigger updates don't have to pass that state back in;
  // computeResultsUpdate does the work and this applies the outcome to state.
  const handleUpdateResults = useCallback((update: ResultsUpdate): Result[] => {
    const outcome = computeResultsUpdate({
      update,
      rawResults: rawResults.current,
      originalResults: originalResults.current,
      activeFilters: activeFiltersRef.current,
      sortType: currentSortString.current,
      isPathfinder,
      userSaves: userSavesRef.current,
      pathFilterState: pathFilterStateRef.current,
      visibleResultIds: visibleResultIdsRef.current,
      sortResults: getSortedResults,
    });
    if (!outcome) return [];
    const { summary, formattedResults: newFormattedResults, pathFilterState: newPathFilterState, filtering } = outcome;

    if (filtering) {
      if (!areEntityFiltersEqual(filtering.entityFilters, activeEntityFiltersRef.current))
        setActiveEntityFilters(filtering.entityFilters);
      setAvailableFilters(filtering.availableFilters);
      if (filtering.shouldResetPage && currentPage.current !== 0)
        handlePageReset(false, newFormattedResults.length);
      originalResults.current = filtering.originalResults;
    }

    setFormattedResults(newFormattedResults);
    setPathFilterState(newPathFilterState);
    openSharedResultOnFirstLoad(summary, newFormattedResults);
    rawResults.current = summary;
    return newFormattedResults;
  }, [handlePageReset, getSortedResults, setFormattedResults, setPathFilterState, setActiveEntityFilters, setAvailableFilters, openSharedResultOnFirstLoad, currentPage, originalResults, rawResults, currentSortString, activeEntityFiltersRef, isPathfinder]);

  // useLayoutEffect (not render-time assignment) keeps refs concurrent-safe under StrictMode.
  // Ideally useEffectEvent, but it hasn't shipped in stable React 19.1 yet.
  useLayoutEffect(() => { handleUpdateResultsRef.current = handleUpdateResults; });

  // Sidebar panel registrations (status, filters, download)
  useSidebarPanels({
    styles,
    arsStatus, resultStatus, formattedResults,
    isFetchingARAStatus,
    isFetchingResults,
    hasFreshResults, isError,
    handleResultsRefresh, setIsLoading, isLoading,
    activeFilters, handleFilter, handleSetFilters, handleClearAllFilters, availableFilters,
    isPathfinder, resultSet: resultSet ?? null, userSaves, queryTitle,
    currentQueryID,
  });

  // Extracted callback for sort-triggered updates (avoids inline arrow in JSX)
  const handleSortUpdate = useCallback(() => {
    handleUpdateResults({ mode: 'sort' });
  }, [handleUpdateResults]);
  useLayoutEffect(() => { handleSortUpdateRef.current = handleSortUpdate; }); // see handleUpdateResultsRef comment

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
  }), [formattedResults, itemOffset, endResultIndex, pageCount, handlePageClick, noveltyBoost, handleToggleNoveltyBoost, currentPage, originalResults]);

  const resultListContextValue: ResultListContextValue = useMemo(() => ({
    userSaves,
    navigateToEvidenceView,
    activateNotes,
    activeEntityFilters,
    activeFilters,
    availableFilters,
    handleFilter,
    handleClearAllFilters,
    visibleResultIds,
    handleBookmarkError,
    isLookup,
    isPathfinder,
    lookupCategory,
    pathFilterState,
    pk: currentQueryID,
    resultId,
    resultsNavigate,
    queryNodeID: effectiveNodeId,
    queryNodeLabel: effectiveNodeLabel,
    queryNodeDescription: nodeDescription,
    queryType: presetTypeObject,
    resultsComplete,
    resultsLoading: isLoading,
    scoreWeights,
    setExpandSharedResult,
    setShareModalOpen,
    setShareResultID,
    showHiddenPaths,
    setShowHiddenPaths,
    shouldUpdateResultsAfterBookmark,
    updateUserSaves: setUserSaves,
    pathfinderIdOne,
    pathfinderLabelOne,
    pathfinderIdTwo,
    pathfinderLabelTwo,
    constraintText,
  }), [
    userSaves, activateNotes, activeEntityFilters, activeFilters, availableFilters,
    handleFilter, handleClearAllFilters, visibleResultIds, isLookup, isPathfinder, lookupCategory, pathFilterState, currentQueryID,
    resultId, resultsNavigate, navigateToEvidenceView,
    effectiveNodeId, effectiveNodeLabel, nodeDescription,
    presetTypeObject, resultsComplete, isLoading, scoreWeights,
    showHiddenPaths, pathfinderIdOne, pathfinderLabelOne,
    pathfinderIdTwo, pathfinderLabelTwo, constraintText,
    setExpandSharedResult, setShareModalOpen, setShareResultID, setShowHiddenPaths, setUserSaves,
    shouldUpdateResultsAfterBookmark,
  ]);

  return (
    <ResultListProvider value={resultListContextValue}>
      <ResultListModals
        shareResultID={shareResultID.current ? shareResultID.current : ""}
        presetTypeID={presetTypeID ? presetTypeID : ""}
        handlePageChange={handlePageChange}
        shareModalOpen={shareModalOpen}
        setShareModalOpen={setShareModalOpen}
        notesModalOpen={notesModalOpen}
        onCloseNotesModal={closeNotes}
        noteLabel={noteLabel}
        currentBookmarkID={currentBookmarkID}
        pk={currentQueryID ? currentQueryID : ""}
        focusModalOpen={focusModalOpen}
        setFocusModalOpen={setFocusModalOpen}
        sharedItem={sharedItem}
        formattedResultsLength={formattedResults.length}
        setExpandSharedResult={setExpandSharedResult}
        setAutoScrollToResult={setAutoScrollToResult}
        shouldUpdateResultsAfterBookmark={shouldUpdateResultsAfterBookmark}
        updateUserSaves={setUserSaves}
      />
      <div className={hidden ? styles.hidden : ''}>
        <div className={styles.resultList}>
          <ResultListSubheading isLoading={isLoading} />
          <div className={`${styles.resultsContainer} container`}>
            {
              isLoading
              ?
                <ResultListLoadingArea />
              :
                <div>
                  <ResultListHeader data={headerData} />
                  <div className={`${styles.resultsTableContainer} ${isPathfinder ? styles.pathfinder : ''}`}>
                    <div className={styles.resultsTable}>
                      <div className={styles.tableBody}>
                        <ResultListTableHead
                          parentStyles={styles}
                          currentSortString={currentSortString}
                          defaultSortString={initSortString}
                          isSortedByEvidence={isSortedByEvidence}
                          isSortedByName={isSortedByName}
                          isSortedByPaths={isSortedByPaths}
                          handleUpdateResults={handleSortUpdate}
                        />
                        <ResultListRows
                          parentStyles={styles}
                          resultSet={resultSet}
                          displayedResults={displayedResults}
                          pathFilterState={pathFilterState}
                          userSaves={userSaves}
                          itemOffset={itemOffset}
                          isLoading={isLoading}
                          isError={isError}
                        />
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
            }
          </div>
        </div>
      </div>
      {children}
    </ResultListProvider>
  );
}

export default ResultList;
