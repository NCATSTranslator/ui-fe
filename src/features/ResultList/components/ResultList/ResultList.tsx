import { useRef, useCallback, useEffect, useLayoutEffect, useMemo, FC, ReactNode } from "react";
import styles from './ResultList.module.scss';
import ResultItem from "@/features/ResultItem/components/ResultItem/ResultItem";
import ResultListLoadingArea from "@/features/ResultList/components/ResultListLoadingArea/ResultListLoadingArea";
import ResultListHeader from "@/features/ResultList/components/ResultListHeader/ResultListHeader";
import ResultListSubheading from "@/features/ResultList/components/ResultListSubheading/ResultListSubheading";
import cloneDeep from "lodash/cloneDeep";
import { useSelector, useDispatch } from 'react-redux';
import { getResultSetById, getResultById, getNodeById }from "@/features/ResultList/slices/resultsSlice";
import { currentPrefs, currentUser }from "@/features/UserAuth/slices/userSlice";
import { applyFilters, injectDynamicFilters, genPathFilterState, areEntityFiltersEqual, calculateFacetCounts } from "@/features/ResultList/utils/resultsInteractionFunctions";
import { getDataFromQueryVar } from "@/features/Core/utils/urlHelpers";
import { formatBiolinkTypeString } from "@/features/Core/utils/stringFormatters";
import { queryTypes } from "@/features/Query/utils/queryTypes";
import { getBiolinkCategoryDisplay } from "@/features/Query/utils/biolinkCategories";
import { SaveGroup } from "@/features/UserAuth/utils/userApi";
import ResultListTableHead from "@/features/ResultList/components/ResultListTableHead/ResultListTableHead";
import ResultListModals from "@/features/ResultList/components/ResultListModals/ResultListModals";
import ResultListBottomPagination from "@/features/ResultList/components/ResultListBottomPagination/ResultListBottomPagination";
import { ResultSet, Result, PathFilterState, ScoreWeights } from "@/features/ResultList/types/results.d";
import { Filter } from "@/features/ResultFiltering/types/filters";
import useScoreWeights from "@/features/ResultList/hooks/useScoreWeights";
import { useQueryChangeReset } from "@/features/ResultList/hooks/resultListHooks";
import useSortState from "@/features/ResultList/hooks/useSortState";
import useResultPagination from "@/features/ResultList/hooks/useResultPagination";
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
import useEvidenceViewNavigation from "@/features/ResultList/hooks/useEvidenceViewNavigation";
import { useResultsNavigate } from "@/features/Navigation/hooks/useResultsNavigate";
import { useParams } from "react-router-dom";

interface ResultListProps {
  children?: ReactNode;
  hidden?: boolean;
}

const ResultList: FC<ResultListProps> = ({ children, hidden = false }) => {

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
  const isLookup = (presetTypeID === "l");
  const presetTypeObject = (!!presetTypeID)
    ? queryTypes.find(type => type.id === parseInt(presetTypeID)) ?? null
    : null;

  const { data: queries = [] } = useUserQueries();
  const currentQuerySid: string | undefined = useMemo(() => queries.find((q: UserQueryObject) => q.data.qid === currentQueryID)?.sid, [queries, currentQueryID]);
  const currentQueryObject = useMemo(() => queries.find((q: UserQueryObject) => q.data.qid === currentQueryID) || null, [queries, currentQueryID]);
  const { title: resolvedQueryTitle } = useGetQueryCardTitle(currentQueryObject);

  const nodeLabelParam = getDataFromQueryVar("l", decodedParams);
  const nodeIdParam = getDataFromQueryVar("i", decodedParams);
  const pathfinderIdOne = getDataFromQueryVar("ione", decodedParams);
  const pathfinderLabelOne = getDataFromQueryVar("lone", decodedParams);
  const pathfinderIdTwo = getDataFromQueryVar("itwo", decodedParams);
  const pathfinderLabelTwo = getDataFromQueryVar("ltwo", decodedParams);
  const constraintText = formatBiolinkTypeString(getDataFromQueryVar("c", decodedParams) || "");
  const lookupCategory = getDataFromQueryVar("cat", decodedParams);

  const effectiveNodeLabel = isLookup ? pathfinderLabelOne : nodeLabelParam;
  const effectiveNodeId = isLookup ? pathfinderIdOne : nodeIdParam;

  // Build query title for downloads - use resolved title if available, otherwise build from URL params
  const queryTitle = useMemo(() => {
    if (resolvedQueryTitle) return resolvedQueryTitle;
    if (isLookup && pathfinderLabelOne) {
      const catDisplay = getBiolinkCategoryDisplay(lookupCategory || '', true);
      return `${pathfinderLabelOne} — ${catDisplay} Lookup`;
    }
    // Fallback: construct title from URL parameters
    if (nodeLabelParam) {
      const typeLabel = isPathfinder ? 'Pathfinder' : (presetTypeObject?.targetType || 'Query');
      return `${nodeLabelParam} — ${typeLabel}s`;
    }
    return '';
  }, [resolvedQueryTitle, nodeLabelParam, isPathfinder, isLookup, pathfinderLabelOne, lookupCategory, presetTypeObject]);
  const resultSet = useSelector(getResultSetById(currentQueryID));
  const loading = (loadingParam === 'true') ? true : false;
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
  const resultIdParamRef = useRef<string | null>(null);
  const itemsPerPageRef = useRef<number>(0);

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
    recalculateScores, handleResultsRefresh
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

  // Reset state when the query ID changes (e.g., navigating to a different query)
  useQueryChangeReset({
    currentQueryID,
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
    closeNotesModal: closeNotes,
    resetShareState,
    resetBookmarks,
    setNodeDescription,
  });

  // update defaults when prefs change
  useEffect(() => {
    const newSortString = (prefs?.result_sort?.pref_value) ? prefs.result_sort.pref_value as string : 'scoreHighLow';
    currentSortString.current = newSortString;
    handleSortUpdateRef.current?.();
    const tempItemsPerPage = calculateItemsPerPage(prefs.results_per_page.pref_value as string | number);
    setItemsPerPage(tempItemsPerPage);
    setEndResultIndex(tempItemsPerPage);
  }, [prefs, calculateItemsPerPage]);

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
    handleUpdateResults(
      activeFilters, activeEntityFilters, rawResults.current as ResultSet,
      originalResults.current, true, currentSortString.current,
      isPathfinder, userSaves, pathFilterState, formattedResults
    );
  }, [handleUpdateResults, activeFilters, activeEntityFilters, isPathfinder, userSaves, pathFilterState, formattedResults]);
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
  }), [formattedResults, itemOffset, endResultIndex, pageCount, handlePageClick, noveltyBoost, handleToggleNoveltyBoost]);

  const visibleResultIds = useMemo(
    () => new Set(formattedResults.map(r => r.id)),
    [formattedResults]
  );

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
    bookmarkAddedToast,
    bookmarkRemovedToast,
    handleBookmarkError: bookmarkErrorToast,
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
    presetTypeObject, resultsComplete, scoreWeights,
    showHiddenPaths, pathfinderIdOne, pathfinderLabelOne,
    pathfinderIdTwo, pathfinderLabelTwo, constraintText,
  ]);

  return (
    <ResultListProvider value={resultListContextValue}>
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
            }
          </div>
        </div>
      </div>
      {children}
    </ResultListProvider>
  );
}

export default ResultList;
