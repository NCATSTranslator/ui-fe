import { useState, useRef, useCallback, useEffect, useMemo, FC } from "react";
import styles from './ResultsList.module.scss';
import Query from "../Query/Query";
import ResultsFilter from "../ResultsFilter/ResultsFilter";
import ResultsItem from "../ResultsItem/ResultsItem";
import LoadingBar from "../LoadingBar/LoadingBar";
import ResultsListHeader from "../ResultsListHeader/ResultsListHeader";
import NavConfirmationPromptModal from "../Modals/NavConfirmationPromptModal";
import StickyToolbar from "../StickyToolbar/StickyToolbar";
import { cloneDeep, isEqual } from "lodash";
import { unstable_useBlocker as useBlocker } from "react-router";
import { useSelector, useDispatch } from 'react-redux';
import { setResultSet, getResultSetById, getResultById, getNodeById, getEdgeById, getPathById }from "../../Redux/resultsSlice";
import { currentPrefs, currentUser }from "../../Redux/rootSlice";
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import { sortNameLowHigh, sortNameHighLow, sortEvidenceLowHigh, sortEvidenceHighLow, sortScoreLowHigh,
  sortScoreHighLow, sortByEntityStrings, sortPathsHighLow, sortPathsLowHigh, sortByNamePathfinderLowHigh, sortByNamePathfinderHighLow,
  filterCompare, makePathRank, updatePathRanks, pathRankSort } from "../../Utilities/sortingFunctions";
import { findStringMatch, handleResultsError, handleResultsRefresh } from "../../Utilities/resultsInteractionFunctions";
import * as filtering from '../../Utilities/filterFunctions';
import { getEvidenceCounts, checkBookmarkForNotes, checkBookmarksForItem, getDataFromQueryVar, getPathCount, handleFetchErrors } from "../../Utilities/utilities";
import { queryTypes } from "../../Utilities/queryTypes";
import { API_PATH_PREFIX, getSaves, SaveGroup } from "../../Utilities/userApi";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BookmarkAddedMarkup, BookmarkRemovedMarkup, BookmarkErrorMarkup } from "../BookmarkToasts/BookmarkToasts";
import QueryPathfinder from "../QueryPathfinder/QueryPathfinder";
import ResultsListTableHead from "./ResultsListTableHead";
import ResultsListModals from "./ResultsListModals";
import ResultsListBottomPagination from "./ResultsListBottomPagination";
import { ResultSet, Result, ResultEdge, Path, Filter, PathFilterState, PathRank, SharedItem } from "../../Types/results.d";
import { generateScore } from "../../Utilities/scoring";

interface ResultsListProps {
  loading: boolean;
}

const ResultsList: FC<ResultsListProps> = ({ loading }) => {

  const user = useSelector(currentUser);
  const prefs = useSelector(currentPrefs);
  const dispatch = useDispatch();
  let blocker = useBlocker(true);

  // URL search params
  const loadingParam = getDataFromQueryVar("loading");
  const currentQueryID = getDataFromQueryVar("q");
  const presetTypeID = getDataFromQueryVar("t");
  const presetTypeObject = (presetTypeID)
    ? queryTypes.find(type => type.id === parseInt(presetTypeID))
    : null;

  const isPathfinder = (presetTypeID === "p");

  const nodeLabelParam = getDataFromQueryVar("l");
  const nodeIdParam = getDataFromQueryVar("i");
  const [resultIdParam, setResultIdParam] = useState(getDataFromQueryVar("r"));
  const firstLoad = useRef(true);
  const [nodeDescription, setNodeDescription] = useState("");
  const shareResultID = useRef<string | null>(null);
  const setShareResultID = (newID: string | null) => shareResultID.current = newID;

  loading = (loading) ? loading : false;
  loading = (loadingParam === 'true') ? true : loading;
  let resultSet = useSelector(getResultSetById(currentQueryID));
  // Bool, did the results return an error
  const [isError, setIsError] = useState(false);
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
  const [selectedResult, setSelectedResult] = useState<Result | {}>({});

  const [selectedEdge, setSelectedEdge] = useState<ResultEdge | null>(null);
  // Path, path represented in current evidence
  const [selectedPath, setSelectedPath] = useState<Path | null>(null);
  // Obj, represets the filter state of all paths
  const [pathFilterState, setPathFilterState] = useState<PathFilterState | null>(null);
  // number, current page
  const currentPage = useRef(0);
  // number, current item offset (ex: on page 3, offset would be 30 based on itemsPerPage of 10)
  const [itemOffset, setItemOffset] = useState(0);

  const calculateItemsPerPage = (prefValue: string | number): number => {
    return ((!!prefValue) ? (typeof prefValue === "string") ? parseInt(prefValue) : prefs.result_per_screen.pref_value : 10) as number;
  }
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

  const [availableTags, setAvailableFilters] = useState<{[key: string]: Filter}>({});
  // Array, currently active string filters
  const [activeEntityFilters, setActiveEntityFilters] = useState<string[]>([]);
  // Array, aras that have returned data
  const returnedARAs = useRef({aras: [], status: ''});
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

  // update defaults when prefs change, including when they're loaded from the db since the call for new prefs
  // comes asynchronously in useEffect (which is at the end of the render cycle) in App.js
  useEffect(() => {
    currentSortString.current = (isPathfinder) ? 'nameLowHigh' : (prefs?.result_sort?.pref_value) ? prefs.result_sort.pref_value as string : 'scoreHighLow';
    const tempItemsPerPage = calculateItemsPerPage(prefs.result_per_screen.pref_value);
    setItemsPerPage(tempItemsPerPage);
    setEndResultIndex(tempItemsPerPage);
  }, [prefs, isPathfinder]);

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

  const handleClearNotesEditor = async () => {
    await getUserSaves();
    if(prevRawResults.current)
    handleUpdateResults(activeFilters, activeEntityFilters, prevRawResults.current, [], false, currentSortString.current);
  }

  useEffect(() => {
    if(!user)
      return;

    getUserSaves();
  }, [user, getUserSaves]);

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

  const handleUpdateResults = (filters: Filter[], asFilters: string[], summary: ResultSet | null, or: Result[] = [], justSort = false, sortType: string, pfState: PathFilterState | null = null, fr: Result[] = []) => {
    if(!summary)
      return [];

    let newFormattedResults: Result[] = [];
    let newOriginalResults: Result[] = [];
    let newPathFilterState = (!!pfState) ? cloneDeep(pfState) : {};
    // let saves = (userSaves) ? userSaves.saves: null;

    // initial results
    if(or.length === 0) {
      newFormattedResults = summary.data.results;
      newOriginalResults = cloneDeep(newFormattedResults);
      newPathFilterState = genPathFilterState(summary);
    // updating existing results
    } else {
      newFormattedResults = (justSort) ? cloneDeep(fr) : or;
      newOriginalResults = or;
    }

    // filter
    if (!justSort) {
      [newFormattedResults, newPathFilterState] = applyFilters(filters, asFilters, newFormattedResults, newOriginalResults, summary, newPathFilterState);
      originalResults.current = newOriginalResults;
    }

    // sort
    newFormattedResults = getSortedResults(summary, newFormattedResults, sortType);

    // set results
    setFormattedResults(newFormattedResults);
    setPathFilterState(newPathFilterState);

    if(firstLoad.current && newFormattedResults.length > 0) {
      firstLoad.current = false;
      if (resultIdParam !== '0') {
        let sharedItemIndex = newFormattedResults.findIndex(result => result.id === resultIdParam);
        if (sharedItemIndex !== -1) {
          const sharedItemNode = getNodeById(summary, newFormattedResults[sharedItemIndex].subject);
          const sharedItemType = (sharedItemNode) ? sharedItemNode.types[0] : "";
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
  }

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
    const newFormattedResults = handleUpdateResults(activeFilters, activeEntityFilters, newResultSet, [], false, currentSortString.current);

    // we have results to show, set isLoading to false
    if (newFormattedResults.length > 0)
      setIsLoading(false);

    // If no results have returned from any ARAs, and ARA status is complete, set isLoading to false
    if(newResultSet && newResultSet.data.results && newResultSet.data.results.length === 0 && !isFetchingARAStatus.current)
      setIsLoading(false);
  }

  // React Query call for status of results
  // eslint-disable-next-line
  const resultsStatus = useQuery('resultsStatus', async () => {
    console.log("Fetching current ARA status...");

    if(!currentQueryID)
      return;

    // let queryIDJson = JSON.stringify({qid: currentQueryID});

    const requestOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    };
    // eslint-disable-next-line
    const response = await fetch(`${API_PATH_PREFIX}/query/${currentQueryID}/status`, requestOptions)
      .then(response => handleFetchErrors(response))
      .then(response => response.json())
      .then(data => {
        // increment the number of status checks
        numberOfStatusChecks.current++;
        console.log("ARA status:", data);

        let fetchResults = false;

        if(data.data.aras.length > returnedARAs.current.aras.length) {
          console.log(`Old ARAs: ${returnedARAs.current.aras}, New ARAs: ${data.data.aras}`);
          let newReturnedARAs = {...data.data};
          newReturnedARAs.status = data.status;
          returnedARAs.current = newReturnedARAs;
          fetchResults = true;
        } else {
          console.log(`No new ARAs have returned data. Current status is: '${data.status}'`);
        }
        /*
        If status is success (meaning all ARAs have returned) or we've reached 120 status checks (meaning 20 min have elapsed)
        stop fetching ARA status and move to fetching results.
        */
        if(data.status === 'success' || numberOfStatusChecks.current >= 120) {
          isFetchingARAStatus.current = false;
          fetchResults = true;
        }
        if(fetchResults)
          isFetchingResults.current = true;
      })
      .catch((error) => {
        if(formattedResults.length <= 0) {
          handleResultsError(true, setIsError, setIsLoading);
          isFetchingARAStatus.current = null;
        }
        if(formattedResults.length > 0) {
          isFetchingARAStatus.current = null;
        }
        console.error(error)
      });
  }, {
    refetchInterval: 10000,
    enabled: isFetchingARAStatus.current === null ? false : isFetchingARAStatus.current,
    refetchOnWindowFocus: false
  });

  // React Query call for results
  // eslint-disable-next-line
  const resultsData = useQuery('resultsData', async () => {
    console.log("Fetching new results...");

    if(!currentQueryID)
      return;

    // let queryIDJson = JSON.stringify({qid: currentQueryID});

    const requestOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // body: queryIDJson
    };
    // eslint-disable-next-line
    const response = await fetch(`${API_PATH_PREFIX}/query/${currentQueryID}/result`, requestOptions)
      .then(response => handleFetchErrors(response, () => {
        console.log(response.json());
        isFetchingARAStatus.current = false;
        isFetchingResults.current = false;
        if(formattedResults.length <= 0) {
          handleResultsError(true, setIsError, setIsLoading);
        }
      }))
      .then(response => response.json())
      .then(data => {
        console.log('New results:', data);
        dispatch(setResultSet({pk: currentQueryID, resultSet: data}));
        // if we've already gotten results before, set freshRawResults instead to
        // prevent original results from being overwritten
        if(formattedResults.length > 0) {
          setFreshRawResults(data);
        } else {
          handleNewResults(data);
        }

        // The ARS can rarely report that it is done in the status check when it is not done
        if (data.status === 'running' && numberOfStatusChecks.current < 120) {
          isFetchingARAStatus.current = true;
        }

        isFetchingResults.current = false;
      })
      .catch((error) => {
        console.log(error);
      });
  }, {
    enabled: isFetchingResults.current,
    refetchOnWindowFocus: false,
  });

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

  const genPathFilterState = (summary: ResultSet): {[key: string]: boolean} => {
    const filterState: {[key: string]: boolean} = {};
    for (let pid of Object.keys(summary.data.paths)) {
      filterState[pid] = false;
    }

    return filterState;
  }

  const updatePathFilterState = (pathFilterState: {[key: string]: boolean}, pathRanks: PathRank[], unrankedIsFiltered: boolean) => {
    for (let pathRank of pathRanks) {
      const pid = pathRank.path.id;
      if(!pid)
        continue;

      if (pathRank.support.length !== 0) {
        updatePathFilterState(pathFilterState, pathRank.support, unrankedIsFiltered);
        let filterIndirect = true;
        for (let supportRank of pathRank.support) {
          const supportPid = supportRank.path.id;
          if(!!supportPid)
            filterIndirect = filterIndirect && pathFilterState[supportPid];
        }
        pathFilterState[pid] = filterIndirect;
      } else {
        pathFilterState[pid] = (pathRank.rank > 0 || (pathRank.rank === 0 && unrankedIsFiltered));
      }
    }
  }

  const calculateFacetCounts = (filteredResults: Result[], summary: ResultSet, negatedResults: Result[], activeFacets: Filter[], negatedFacets: Filter[], filterSetterMethod: Function) => {
    // Function that adds the tag counts when a certain condition (predicate) is met
    const addTagCountsWhen = (countedTags: {[key: string]: Filter}, result: Result, predicate: (tag: string)=>boolean) => {
      for(const tag of Object.keys(result.tags)) {
        // If the tag exists on the list, either increment it or initialize its count
        if (predicate(tag)) {
          if (countedTags.hasOwnProperty(tag)) {
            countedTags[tag].count = (countedTags[tag].count ?? 0) + 1;
          } else {
            // If it doesn't exist on the current list of tags, add it and initialize its count
            countedTags[tag] = { name: tag, value: '', count: 1 };
          }
        }
      }
    }

    // Create a list of tags from the master tag list provided by the backend
    const countedTags = cloneDeep(summary.data.tags);
    const activeFamilies = new Set(activeFacets.map(facet => filtering.filterFamily(facet)));
    for(const result of filteredResults) {
      // Determine the distance between a result's facets and the facet selection
      const resultFamilies = new Set();
      for (const facet of activeFacets) {
        if (!!facet.id && Object.keys(result.tags).includes(facet.id)) {
          resultFamilies.add(filtering.filterFamily(facet));
        }
      }

      const missingFamiliesCount = activeFamilies.size - resultFamilies.size;
      // When the family counts are equal, add all the result's tags
      if (missingFamiliesCount === 0) {
        addTagCountsWhen(countedTags, result, (tag) => { return true; });
      // When the result is missing a single family, add all tags from only the missing family
      } else if (missingFamiliesCount === 1) {
        // Find the missing family
        const missingFamily = [...activeFamilies].filter((family) => {
          return !resultFamilies.has(family);
        })[0];

        addTagCountsWhen(countedTags, result, (tagID) => {
          return filtering.getTagFamily(tagID) === missingFamily;
        });
      }
      // Otherwise skip this result
    }

    // Count all results that have a matching negated facet
    for (const result of negatedResults) {
      addTagCountsWhen(countedTags, result, (tagID) => {
        return negatedFacets.reduce((acc, facet) => {
          return (tagID === facet.id) || acc;
        }, false);
      });
    }

    Object.entries(countedTags).forEach((tag)=> {
      if(tag[1].count === undefined || tag[1].count <= 0)
        delete countedTags[tag[0]];
    })

    filterSetterMethod(countedTags);
  }

  /**
   * Activates sets the evidence and opens the evidence modal.
   */
  const activateEvidence = useCallback((item: Result, edgeID: string, pathID: string) => {
    const edge = getEdgeById(resultSet, edgeID);
    const path = getPathById(resultSet, pathID);
    if(!!edge && !!path) {
      setSelectedResult(item);
      setSelectedEdge(edge);
      setSelectedPath(path);
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

  const applyFilters = (filters: Filter[], entityFilters: string[], filteredResults: Result[], 
    originalResults: Result[], summary: ResultSet, pathFilterState: PathFilterState): [Result[], PathFilterState] => {
      
    const filterResults = (filters: Filter[], entityFilters: string[], originalResults: Result[], resultPathRanks: PathRank[][]) => {
      const filteredResults = [];
      const negatedResults = [];
      /*
        For each result, check against each filter. If any filter is not met,
        skip that result.
      */
      for (let result of originalResults) {
        const pathRanks: PathRank[] = resultSet 
          ? result.paths.map((p) => typeof p === "string" ? getPathById(resultSet, p) : p)
            .filter((path): path is Path => path !== undefined)
            .map((path) => makePathRank(resultSet, path))
          : [];
        let addResult = true;
        for (const filter of filters) {
          if (filtering.isEntityFilter(filter) &&
              filtering.isExclusion(filter) === findStringMatch(result, filter.value, pathRanks)) {
            addResult = false;
            negatedResults.push(result);
            break;
          }

          if (filtering.isResultFilter(filter) &&
              filtering.isExclusion(filter) === Object.values(result.tags).includes((tag: Filter) => tag.id === filter.id)) {
            addResult = false;
            negatedResults.push(result);
            break;
          }
        }

        if (addResult) {
          filteredResults.push(result);
          resultPathRanks.push(pathRanks);
        }
      }

      const newEntityFilters = [];
      for (const filter of filters) {
        // String filters with identical values shouldn't be added to the activeFilters array,
        // so we don't have to check for duplicate values here, just for the str tag.
        if (filtering.isEntityFilter(filter) && !!filter.value) {
          newEntityFilters.push(filter.value);
        }
      }

      // if the new set of filters don't match the current ones, call setActiveEntityFilters to update them
      if (!(newEntityFilters.length === entityFilters.length &&
            newEntityFilters.every((value, index) => value === entityFilters[index]))) {
        setActiveEntityFilters(newEntityFilters);
      }

      // Set the formatted results to the newly filtered results
      return [filteredResults, negatedResults];
    }

    const facetResults = (resultFacets: Filter[], pathFilters: Filter[], filteredResults: Result[], resultPathRanks: PathRank[][]) => {
      const intersect = (a: any, b: any) => { return a && b; };
      const union = (a: any, b: any) => { return a || b; };
      const facetedResults = [];
      let resultIndex = 0;
      for (const result of filteredResults) {
        let addResult = true;
        let isInter = null;
        let combine = null;
        let lastFacet = null;
        for (const resFacet of resultFacets) {
          isInter = (!filtering.hasSameFamily(lastFacet, resFacet));
          if (isInter) {
            if (!addResult) break; // We went through an entire facet group with no match
            lastFacet = resFacet;
            combine = intersect;
          } else {
            combine = union;
          }

          addResult = combine(addResult, !!resFacet.id && Object.keys(result.tags).includes(resFacet.id));
        }

        if (addResult) {
          const pathRanks = resultPathRanks[resultIndex];
          for (let i = 0; i < result.paths.length; i++) {
            const path = (typeof result.paths[i] === 'string') ? getPathById(resultSet, result.paths[i] as string) : result.paths[i];
            const pathRank = pathRanks[i];
            if(!!resultSet && !!path)
              updatePathRanks(resultSet, path as Path, pathRank, pathFilters);
          }

          // const newResult = cloneDeep(result);
          pathRankSort(pathRanks);
          // newResult.paths = genRankedPaths(resultSet, pathRanks);
          facetedResults.push(result);
        }

        resultIndex++;
      };

      return facetedResults;
    }

    const filterResultsByPathFilterState = (results: Result[], pathFilterState: PathFilterState) => {
      let anyFilteredPaths = false;
      for (const filterState of Object.values(pathFilterState)) {
        anyFilteredPaths = anyFilteredPaths || filterState;
      }

      if (!anyFilteredPaths) return results;
      const filteredResults = [];
      for (const result of results) {
        let filterResult = true;
        for (const path of result.paths) {
          const pathID = (typeof path === "string") ? path : path.id;
          filterResult = filterResult && !!pathID && pathFilterState[pathID];
        }

        if (!filterResult) {
          filteredResults.push(result);
        }
      }

      return filteredResults;
    }

    // If there are no active filters or facets, get the full result set and reset the activeEntityFilters
    if (filters.length === 0) {
      if (entityFilters.length > 0) {
        setActiveEntityFilters([]);
      }

      pathFilterState = genPathFilterState(summary);
      calculateFacetCounts(filteredResults, summary, [], [], [], setAvailableFilters);
      return [filteredResults, pathFilterState];
    }

    let [resultFilters, pathFilters, globalFilters] = filtering.groupFilterByType(filters);
    const resultFacets = resultFilters.filter((f) => !filtering.isExclusion(f));
    const negatedResultFacets = resultFilters.filter((f) => filtering.isExclusion(f));
    resultFilters = negatedResultFacets.concat(globalFilters);
    const resultPathRanks: PathRank[][] = [];
    let [results, negatedResults] = filterResults(resultFilters, entityFilters, originalResults, resultPathRanks);
    calculateFacetCounts(results, summary, negatedResults, resultFacets, negatedResultFacets, setAvailableFilters);
    results = facetResults(resultFacets, pathFilters, results, resultPathRanks);
    let unrankedIsFiltered = false;
    for (let pathRanks of resultPathRanks) {
      for (let pathRank of pathRanks) {
        unrankedIsFiltered = unrankedIsFiltered || (pathRank.rank < 0);
      }
    }

    for (let pathRanks of resultPathRanks) {
      updatePathFilterState(pathFilterState, pathRanks, unrankedIsFiltered);
    }

    results = filterResultsByPathFilterState(results, pathFilterState);
    if(currentPage.current !== 0) {
      handlePageReset(false, results.length);
    }

    return [results, pathFilterState];
  }

  // Handle the addition and removal of individual filters. Keep the invariant that
  // filters of the same type are grouped together.
  const handleFilter = (filter: Filter) => {
    let indexes = [];
    for(const [i, activeFilter] of activeFilters.entries()) {
      if (activeFilter.id === filter.id) {
        indexes.push(i);
      }
    }

    let newActiveFilters = cloneDeep(activeFilters);
    // If we don't find any matches, push the filter and sort by filter family
    if(indexes.length === 0) {
      newActiveFilters.push(filter);
      newActiveFilters.sort(filterCompare);
      setActiveFilters(newActiveFilters);
      handleUpdateResults(newActiveFilters, activeEntityFilters, rawResults.current, originalResults.current, false, currentSortString.current)
      return;
    }

    let addFilter = true;
    for(const index of indexes) {
      // If we get the same filter, we want to toggle it off
      if (activeFilters[index].value === filter.value &&
          activeFilters[index].negated === filter.negated) {
        newActiveFilters = activeFilters.reduce((newFilters: Filter[], oldFilter, i) => {
          if(i !== index) {
            newFilters.push(oldFilter);
          }

          return newFilters;
        }, []);

        addFilter = false;
        break;
      // If the values don't match and it's not a string search, update the value
      } else if (!filtering.isEntityFilter(filter)) {
        newActiveFilters = newActiveFilters.map((activeFilter, i) => {
          if(i === index) {
            activeFilter.value = filter.value;
            activeFilter.negated = filter.negated;
          }

          return activeFilter;
        });

        addFilter = false;
        break;
      }
    }

    if(addFilter) {
      newActiveFilters.push(filter);
      newActiveFilters.sort(filterCompare);
    }
    
    handleApplyFilterAndCleanup(newActiveFilters, activeEntityFilters, rawResults.current, originalResults.current, currentSortString.current);
  }

  const handleApplyFilterAndCleanup = (filtersToActivate: Filter[], activeEntityFilters: string[], rawResults: ResultSet | null, originalResults: Result[], sortString: string) => {
    if(!rawResults)
      return;

    setActiveFilters(filtersToActivate);
    let newFormattedResults = handleUpdateResults(filtersToActivate, activeEntityFilters, rawResults, originalResults, false, sortString);
    handlePageReset(false, newFormattedResults.length);
  }

  const handleClearAllFilters = () => {
    handleApplyFilterAndCleanup([], activeEntityFilters, rawResults.current, originalResults.current, currentSortString.current);
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

  const handleResultMatchClick = useCallback((match: Result) => {
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

  return (
    <QueryClientProvider client={queryClient}>
      <ResultsListModals
        shareResultID={shareResultID.current ? shareResultID.current : ""}
        presetTypeID={presetTypeID ? presetTypeID : ""}
        handlePageClick={handlePageClick}
        shareModalOpen={shareModalOpen}
        setShareModalOpen={setShareModalOpen}
        notesModalOpen={notesModalOpen}
        setNotesModalOpen={setNotesModalOpen}
        handleClearNotesEditor={handleClearNotesEditor}
        noteLabel={noteLabel.current}
        currentBookmarkID={currentBookmarkID.current}
        pk={currentQueryID ? currentQueryID : ""}
        focusModalOpen={focusModalOpen}
        setFocusModalOpen={setFocusModalOpen}
        evidenceModalOpen={evidenceModalOpen}
        setEvidenceModalOpen={setEvidenceModalOpen}
        selectedEdge={selectedEdge}
        selectedResult={selectedResult}
        selectedPath={selectedPath}
        sharedItem={sharedItem}
        formattedResultsLength={formattedResults.length} 
        setExpandSharedResult={setExpandSharedResult} 
        setAutoScrollToResult={setAutoScrollToResult}
      />
      <div className={styles.resultsList}>
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
              <ResultsFilter
                activeFilters={activeFilters}
                onFilter={handleFilter}
                onClearAll={handleClearAllFilters}
                expanded={filtersExpanded}
                setExpanded={setFiltersExpanded}
                availableFilters={availableTags}
                isPathfinder={isPathfinder}
              />
              <div>
                <ResultsListHeader
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
                    returnedARAs: returnedARAs.current,
                    isError: isError,
                    currentPage: currentPage.current,
                    resultsListStyles: styles,
                    pageCount: pageCount,
                    handlePageClick: handlePageClick,
                    filtersExpanded: filtersExpanded,
                    setFiltersExpanded: setFiltersExpanded
                  }}
                />
                <div className={`${styles.resultsTableContainer} ${isPathfinder ? styles.pathfinder : ''}`}>
                  <div className={styles.resultsTable}>
                    <div className={styles.tableBody}>
                      <ResultsListTableHead
                        parentStyles={styles}
                        currentSortString={currentSortString}
                        isPathfinder={isPathfinder}
                        isSortedByEvidence={isSortedByEvidence}
                        isSortedByName={isSortedByName}
                        isSortedByPaths={isSortedByPaths}
                        isSortedByScore={isSortedByScore}
                        handleUpdateResults={()=>handleUpdateResults(activeFilters, activeEntityFilters, rawResults.current as ResultSet, originalResults.current, true, currentSortString.current, pathFilterState, formattedResults)}
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
                          if(!result || !presetTypeObject || !pathFilterState)
                            return null;

                          let bookmarkID = (userSaves === null) ? null : checkBookmarksForItem(item.id, userSaves);
                          let bookmarked = (!bookmarkID) ? false : true;
                          let hasNotes =  checkBookmarkForNotes(bookmarkID, userSaves);
                          return (
                            <ResultsItem
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
                              bookmarked={bookmarked}
                              bookmarkID={bookmarkID}
                              hasNotes={hasNotes}
                              handleBookmarkError={handleBookmarkError}
                              bookmarkAddedToast={bookmarkAddedToast}
                              bookmarkRemovedToast={bookmarkRemovedToast}
                              availableFilters={availableTags}
                              handleFilter={handleFilter}
                              activeFilters={activeFilters}
                              sharedItemRef={item.id === resultIdParam ? sharedItemRef : null}
                              startExpanded={item.id === resultIdParam && expandSharedResult}
                              setExpandSharedResult={setExpandSharedResult}
                              setShareModalOpen={setShareModalOpen}
                              setShareResultID={setShareResultID}
                              resultsComplete={(!isError && freshRawResults === null && !isFetchingARAStatus.current && !isFetchingResults.current)}
                              scoreWeights={scoreWeights}
                            />
                          )
                        })
                      }
                    </div>
                  </div>
                  {
                    formattedResults.length > 0 &&
                    <ResultsListBottomPagination
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
              handleResultsRefresh: () =>
                {
                  handleResultsRefresh(freshRawResults, handleNewResults, setFreshRawResults);
                },
              isFetchingARAStatus: isFetchingARAStatus.current,
              isFetchingResults: isFetchingResults.current,
              showDisclaimer: true,
              containerClassName: styles.shareLoadingButtonContainer,
              buttonClassName: styles.loadingButton,
              hasFreshResults: (freshRawResults !== null),
              isSticky: true
            }}
            isError={isError}
            returnedARAs={returnedARAs.current}
          />
        }
      </div>
      {blocker ? <NavConfirmationPromptModal blocker={blocker} /> : null}
    </QueryClientProvider>
  );
}

export default ResultsList;