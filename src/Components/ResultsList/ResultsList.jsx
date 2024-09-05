import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import styles from './ResultsList.module.scss';
import Query from "../Query/Query";
import ResultsFilter from "../ResultsFilter/ResultsFilter";
import ResultsItem from "../ResultsItem/ResultsItem";
import EvidenceModal from "../Modals/EvidenceModal";
import Select from "../Core/Select";
import LoadingBar from "../LoadingBar/LoadingBar";
import Tooltip from '../Tooltip/Tooltip';
import ResultsListHeader from "../ResultsListHeader/ResultsListHeader";
import NavConfirmationPromptModal from "../Modals/NavConfirmationPromptModal";
import StickyToolbar from "../StickyToolbar/StickyToolbar";
import ReactPaginate from 'react-paginate';
import { cloneDeep, isEqual } from "lodash";
import { unstable_useBlocker as useBlocker } from "react-router";
import { useSelector, useDispatch } from 'react-redux';
import { currentQueryResultsID, currentResults, setCurrentQueryTimestamp }from "../../Redux/resultsSlice";
import { currentPrefs, currentUser }from "../../Redux/rootSlice";
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import { sortNameLowHigh, sortNameHighLow, sortEvidenceLowHigh, sortEvidenceHighLow, sortScoreLowHigh, sortScoreHighLow, sortByEntityStrings, sortPathsHighLow, sortPathsLowHigh, filterCompare, makePathRank, updatePathRanks, pathRankSort } from "../../Utilities/sortingFunctions";
import { getSummarizedResults, hasSupport } from "../../Utilities/resultsFormattingFunctions";
import { findStringMatch, handleResultsError, handleEvidenceModalClose,
  handleResultsRefresh, handleClearAllFilters } from "../../Utilities/resultsInteractionFunctions";
import * as filtering from '../../Utilities/filterFunctions';
import { getDataFromQueryVar, handleFetchErrors } from "../../Utilities/utilities";
import { queryTypes } from "../../Utilities/queryTypes";
import Alert from '../../Icons/Status/Alerts/Info.svg?react';
import ChevLeft from '../../Icons/Directional/Chevron/Chevron Left.svg?react';
import ChevRight from '../../Icons/Directional/Chevron/Chevron Right.svg?react';
import ChevUp from '../../Icons/Directional/Chevron/Chevron Up.svg?react';
import { API_PATH_PREFIX, getSaves } from "../../Utilities/userApi";
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BookmarkAddedMarkup, BookmarkRemovedMarkup, BookmarkErrorMarkup } from "../BookmarkToasts/BookmarkToasts";
import NotesModal from "../Modals/NotesModal";
import ShareModal from "../Modals/ShareModal";
import ResultFocusModal from "../Modals/ResultFocusModal";
import QueryPathfinder from "../QueryPathfinder/QueryPathfinder";

const ResultsList = ({loading}) => {

  const user = useSelector(currentUser);
  const prefs = useSelector(currentPrefs);
  const dispatch = useDispatch();
  let blocker = useBlocker(true);

  // URL search params
  const loadingParam = getDataFromQueryVar("loading");
  const queryIDParam = getDataFromQueryVar("q");
  const initPresetTypeID = getDataFromQueryVar("t");
  const initPresetTypeObject = (initPresetTypeID)
    ? queryTypes.find(type => type.id === parseInt(initPresetTypeID))
    : null;

  const isPathfinder = (initPresetTypeID === "p");
  
  const initNodeLabelParam = getDataFromQueryVar("l");
  const initNodeIdParam = getDataFromQueryVar("i");
  const initResultIdParam = getDataFromQueryVar("r");
  const firstLoad = useRef(true);
  const [nodeDescription, setNodeDescription] = useState();
  const shareResultID = useRef(null);
  const setShareResultID = (newID) => shareResultID.current = newID;

  loading = (loading) ? loading : false;
  loading = (loadingParam === 'true') ? true : loading;
  let resultsState = useSelector(currentResults);
  resultsState = (resultsState !== undefined && Object.keys(resultsState).length === 0) ? null : resultsState;

  // Bool, did the results return an error
  const [isError, setIsError] = useState(false);
  // Int, current query id from state
  const currentQueryResultsIDFromState = useSelector(currentQueryResultsID);
  // Int, current query id based on whether url param exists
  const currentQueryID = (queryIDParam) ? queryIDParam : currentQueryResultsIDFromState;
  // Bool, are the results still loading
  const presetIsLoading = (queryIDParam) ? true : loading;
  const [isLoading, setIsLoading] = useState(presetIsLoading);
  // Bool, should ara status be fetched
  // const [isFetchingARAStatus, setIsFetchingARAStatus] = useState(presetIsLoading);
  const isFetchingARAStatus = useRef(presetIsLoading);
  // Bool, should results be fetched
  // const [isFetchingResults, setIsFetchingResults] = useState(false);
  const isFetchingResults = useRef(false);
  // Bool, are the results currently sorted by name (true/false for asc/desc, null for not set)
  const [isSortedByName, setIsSortedByName] = useState(null);
  // Bool, are the results currently sorted by evidence count (true/false for asc/desc, null for not set)
  const [isSortedByEvidence, setIsSortedByEvidence] = useState(null);
  // Bool, are the results currently sorted by path count (true/false for asc/desc, null for not set)
  const [isSortedByPaths, setIsSortedByPaths] = useState(null);
  // Bool, are the results currently sorted by score
  const [isSortedByScore, setIsSortedByScore] = useState(false);
  // Bool, is evidence modal open?
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [sharedItem, setSharedItem] = useState({index: 0, page: 0, name: ''});
  const [autoScrollToResult, setAutoScrollToResult] = useState(false);
  const [expandSharedResult, setExpandSharedResult] = useState(false);
  const sharedItemRef = useRef(null);
  const noteLabel = useRef("");
  const currentBookmarkID = useRef(null);
  // Object, the currently selected item
  const [selectedItem, setSelectedItem] = useState({});
  // Array, edges represented in current evidence
  const [selectedEdge, setSelectedEdge] = useState(null);
  // Obj, path represented in current evidence
  const [selectedPath, setSelectedPath] = useState(null);
  // Obj, represets the filter state of all paths
  const [pathFilterState, setPathFilterState] = useState(null);
  // Int, current page
  const currentPage = useRef(0);
  // Int, current item offset (ex: on page 3, offset would be 30 based on itemsPerPage of 10)
  const [itemOffset, setItemOffset] = useState(0);
  // Int, how many items per page
  const initItemsPerPage = (prefs?.result_per_screen?.pref_value) ? parseInt(prefs.result_per_screen.pref_value) : 10;
  const [itemsPerPage, setItemsPerPage] = useState(initItemsPerPage);
  // Int, last result item index
  const [endResultIndex, setEndResultIndex] = useState(itemsPerPage);
  // Obj, original raw results from the BE
  const rawResults = useRef(resultsState);
  // Obj, original, unfiltered results from the BE
  const originalResults = useRef([]);
  // Obj, fresh results from the BE to replace existing rawResults
  const [freshRawResults, setFreshRawResults] = useState(null);
  // Ref, used to track changes in results
  const prevRawResults = useRef(rawResults);
  // Array, results formatted by any active filters, sorted by any active sorting
  const [formattedResults, setFormattedResults] = useState([]);
  // Array, results meant to display based on the pagination
  const displayedResults = useMemo(()=>formattedResults.slice(itemOffset, endResultIndex), [formattedResults, itemOffset, endResultIndex]);
  const initSortString = (prefs?.result_sort?.pref_value) ? prefs.result_sort.pref_value : 'scoreHighLow';
  const currentSortString = useRef(initSortString);
  // Int, number of pages
  const pageCount = Math.ceil(formattedResults.length / itemsPerPage);
  // Array, currently active filters
  const [activeFilters, setActiveFilters] = useState([]);
  // Array, currently active filters
  const [availableTags, setAvailableTags] = useState([]);
  // Array, currently active string filters
  const [activeEntityFilters, setActiveEntityFilters] = useState([]);
  // Array, aras that have returned data
  const returnedARAs = useRef({aras: [], status: ''});
  // Bool, is share modal open
  const [shareModalOpen, setShareModalOpen] = useState(false);
  // Bool, is the shift key being held down
  const [zoomKeyDown, setZoomKeyDown] = useState(false);
  // Float, weight for confidence score
  // eslint-disable-next-line
  const [confidenceWeight, setConfidenceWeight] = useState(1.0);
  // Float, weight for novelty score
  // eslint-disable-next-line
  const [noveltyWeight, setNoveltyWeight] = useState(0.1);
  // Float, weight for clinical score
  // eslint-disable-next-line
  const [clinicalWeight, setClinicalWeight] = useState(1.0);

  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const [userSaves, setUserSaves] = useState(null);
  const bookmarkAddedToast = () => toast.success(<BookmarkAddedMarkup/>);
  const bookmarkRemovedToast = () => toast.success(<BookmarkRemovedMarkup/>);
  const handleBookmarkError = () => toast.error(<BookmarkErrorMarkup/>);

  // update defaults when prefs change, including when they're loaded from the db since the call for new prefs
  // comes asynchronously in useEffect (which is at the end of the render cycle) in App.js
  useEffect(() => {
    currentSortString.current = (prefs?.result_sort?.pref_value) ? prefs.result_sort.pref_value : 'scoreHighLow';
    const tempItemsPerPage = (prefs?.result_per_screen?.pref_value) ? parseInt(prefs.result_per_screen.pref_value) : 10;
    setItemsPerPage(tempItemsPerPage);
  }, [prefs]);

  useEffect(() => {
    const handleKeyDown = (ev) => {
      if (ev.keyCode === 90) {
        setZoomKeyDown(true);
      }
    };

    const handleKeyUp = (ev) => {
      if (ev.keyCode === 90) {
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
    handleUpdateResults(activeFilters, activeEntityFilters, prevRawResults.current, [], false, currentSortString.current);
  }

  useEffect(() => {
    if(!user)
      return;

    getUserSaves();
  }, [user, getUserSaves]);

  useEffect(() => {
    if (!autoScrollToResult) {
      return;
    }

    const yOffset = -40;
    const y = sharedItemRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({top: y, behavior: 'smooth'});
    setAutoScrollToResult(false);
  }, [autoScrollToResult]);

  // Int, number of times we've checked for ARA status. Used to determine how much time has elapsed for a timeout on ARA status.
  const numberOfStatusChecks = useRef(0);
  // Initialize queryClient for React Query to fetch results
  const queryClient = new QueryClient();

  // Handles direct page click
  const handlePageClick = useCallback((event, newItemsPerPage = false, resultsLength = formattedResults.length, currentNumItemsPerPage = itemsPerPage ) => {
    let perPageNum = (newItemsPerPage) ? parseInt(newItemsPerPage) : currentNumItemsPerPage;
    currentPage.current = event.selected;
    const newOffset = (event.selected * perPageNum) % resultsLength;
    const endOffset = (parseInt(newOffset + perPageNum) > resultsLength)
      ? resultsLength
      : parseInt(newOffset + perPageNum);
    setItemOffset(newOffset);
    setEndResultIndex(endOffset);
  }, [formattedResults.length, itemsPerPage]);

  const handleUpdateResults = (filters, asFilters, summary, or = [], justSort = false, sortType, fr = []) => {
    let newFormattedResults = [];
    let newOriginalResults = [];
    let newPathFilterState = cloneDeep(pathFilterState);
    let saves = (userSaves) ? userSaves.saves: null;

    if(or.length === 0) {
      newFormattedResults = (justSort) ? fr : getSummarizedResults(summary.data, confidenceWeight, noveltyWeight, clinicalWeight, saves);
      newOriginalResults = cloneDeep(newFormattedResults);
      newPathFilterState = genPathFilterState(summary.data);
    } else {
      newFormattedResults = (justSort) ? cloneDeep(fr) : or;
      newOriginalResults = or;
    }

    // filter
    if (!justSort) {
      [newFormattedResults, newPathFilterState] = applyFilters(filters, asFilters, newFormattedResults, newOriginalResults, summary, newPathFilterState);
    }

    // sort
    newFormattedResults = getSortedResults(newFormattedResults, sortType);

    // set results
    setFormattedResults(newFormattedResults);
    setPathFilterState(newPathFilterState);

    if(firstLoad.current && newFormattedResults.length > 0) {
      firstLoad.current = false;
      if (initResultIdParam !== '0') {
        let sharedItemIndex = newFormattedResults.findIndex(result => result.id === initResultIdParam);
        if (sharedItemIndex !== -1) {
          setSharedItem({
            index: sharedItemIndex,
            page: Math.floor(sharedItemIndex / itemsPerPage),
            name: newFormattedResults[sharedItemIndex].name,
            type: newFormattedResults[sharedItemIndex].type
          });

          setFocusModalOpen(true);
        }
      }
    }

    if (!justSort) {
      originalResults.current = newOriginalResults;
    }

    rawResults.current = summary;

    return newFormattedResults;
  }

  const handleNewResults = (data) => {
    let rr = data;
    // if we have no results, or the results aren't actually new, return
    if(rr == null || isEqual(rr, prevRawResults.current))
      return;

    // if the results status is error, or there is no results property in the data obj, return
    if(rr.status === 'error' || rr.data.results === undefined)
      return;

    // if rawResults are new, set prevRawResults for future comparison
    prevRawResults.current = rr;
    const newFormattedResults = handleUpdateResults(activeFilters, activeEntityFilters, rr, [], false, currentSortString.current);

    // we have results to show, set isLoading to false
    if (newFormattedResults.length > 0)
      setIsLoading(false);

    // If no results have returned from any ARAs, and ARA status is complete, set isLoading to false
    if(rr && rr.data.results && rr.data.results.length === 0 && !isFetchingARAStatus.current)
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
        dispatch(setCurrentQueryTimestamp(new Date(data.data.timestamp)));

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
  const getSortedResults = useCallback((resultsToSort, sortName) => {
    let newSortedResults = resultsToSort;
    switch (sortName) {
      case 'nameLowHigh':
        newSortedResults = sortNameLowHigh(newSortedResults);
        setIsSortedByName(true);
        setIsSortedByScore(null)
        setIsSortedByEvidence(null);
        setIsSortedByPaths(null);
        break;
      case 'nameHighLow':
        newSortedResults = sortNameHighLow(newSortedResults);
        setIsSortedByName(false);
        setIsSortedByScore(null)
        setIsSortedByEvidence(null);
        setIsSortedByPaths(null);
        break;
      case 'evidenceLowHigh':
        newSortedResults = sortEvidenceLowHigh(newSortedResults);
        setIsSortedByEvidence(true);
        setIsSortedByScore(null)
        setIsSortedByName(null);
        setIsSortedByPaths(null);
        break;
      case 'evidenceHighLow':
        newSortedResults = sortEvidenceHighLow(newSortedResults);
        setIsSortedByEvidence(false);
        setIsSortedByScore(null)
        setIsSortedByName(null);
        setIsSortedByPaths(null);
        break;
      case 'scoreLowHigh':
        newSortedResults = sortScoreLowHigh(newSortedResults);
        setIsSortedByScore(true)
        setIsSortedByEvidence(null);
        setIsSortedByName(null);
        setIsSortedByPaths(null);
        break;
      case 'scoreHighLow':
        newSortedResults = sortScoreHighLow(newSortedResults);
        setIsSortedByScore(false)
        setIsSortedByEvidence(null);
        setIsSortedByName(null);
        setIsSortedByPaths(null);
        break;
      case 'pathsLowHigh':
        newSortedResults = sortPathsLowHigh(newSortedResults);
        setIsSortedByPaths(true)
        setIsSortedByScore(null)
        setIsSortedByEvidence(null);
        setIsSortedByName(null);
        break;
      case 'pathsHighLow':
        newSortedResults = sortPathsHighLow(newSortedResults);
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
  }, [activeEntityFilters]);

  const genPathFilterState = (summary) => {
    const filterState = {};
    for (let pid of Object.keys(summary.paths)) {
      filterState[pid] = false;
    }

    return filterState;
  }

  const updatePathFilterState = (pathFilterState, pathRanks, unrankedIsFiltered) => {
    for (let pathRank of pathRanks) {
      const pid = pathRank.path.id;
      if (pathRank.support.length !== 0) {
        updatePathFilterState(pathFilterState, pathRank.support, unrankedIsFiltered);
        let filterIndirect = true;
        for (let supportRank of pathRank.support) {
          const supportPid = supportRank.path.id;
          filterIndirect = filterIndirect && pathFilterState[supportPid];
        }
        pathFilterState[pid] = filterIndirect;
      } else {
        pathFilterState[pid] = (pathRank.rank > 0 || (pathRank.rank === 0 && unrankedIsFiltered));
      }
    }
  }

  const calculateFacetCounts = (filteredResults, summary, negatedResults, activeFacets, negatedFacets, tagSetterMethod) => {
    // Function that adds the tag counts when a certain condition (predicate) is met
    const addTagCountsWhen = (countedTags, result, predicate) => {
      for(const tag of result.tags) {
        // If the tag exists on the list, either increment it or initialize its count
        if (predicate(tag)) {
          if (countedTags.hasOwnProperty(tag)){
            if (!countedTags[tag].count) {
              countedTags[tag].count = 0;
            }

            countedTags[tag].count++;
          // If it doesn't exist on the current list of tags, add it and initialize its count
          } else {
            countedTags[tag] = {name: tag, value: '', count: 1};
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
        if (result.tags.includes(facet.id)) {
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

    tagSetterMethod(countedTags);
  }

  /**
   * Activates sets the evidence and opens the evidence modal.
   */
  const activateEvidence = useCallback((item, edgeGroup, path) => {
    setSelectedItem(item);
    setSelectedEdge(edgeGroup);
    setSelectedPath(path);
    setEvidenceOpen(true);
  },[])

  const activateNotes = (label, bookmarkID, item) => {
    noteLabel.current = label;
    currentBookmarkID.current = bookmarkID;
    setNotesOpen(true);
  }

  const handlePageReset = (newItemsPerPage, resultsLength) => {
    handlePageClick({selected: 0}, newItemsPerPage, resultsLength);
  }

  const applyFilters = (filters, entityFilters, filteredResults, originalResults, summary, pathFilterState) => {
    const filterResults = (filters, entityFilters, originalResults, resultPathRanks) => {
      const filteredResults = [];
      const negatedResults = [];
      /*
        For each result, check against each filter. If any filter is not met,
        skip that result.
      */
      for (let result of originalResults) {
        const pathRanks = result.compressedPaths.map((p) => makePathRank(p));
        let addResult = true;
        for (const filter of filters) {
          if (filtering.isEntityFilter(filter) &&
              filtering.isExclusion(filter) === findStringMatch(result, filter.value, pathRanks)) {
            addResult = false;
            negatedResults.push(result);
            break;
          }

          if (filtering.isResultFilter(filter) &&
              filtering.isExclusion(filter) === result.tags.includes(filter.id)) {
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
        if (filtering.isEntityFilter(filter)) {
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

    const facetResults = (resultFacets, pathFilters, filteredResults, resultPathRanks) => {
      const intersect = (a, b) => { return a && b; };
      const union = (a, b) => { return a || b; };
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

          addResult = combine(addResult, result.tags.includes(resFacet.id));
        }

        if (addResult) {
          const pathRanks = resultPathRanks[resultIndex];
          for (let i = 0; i < result.compressedPaths.length; i++) {
            const path = result.compressedPaths[i];
            const pathRank = pathRanks[i];
            updatePathRanks(path, pathRank, pathFilters);
          }

          const newResult = cloneDeep(result);
          pathRankSort(pathRanks);
          newResult.compressedPaths = genRankedPaths(pathRanks);
          facetedResults.push(newResult);
        }

        resultIndex++;
      };

      return facetedResults;
    }

    const filterResultsByPathFilterState = (results, pathFilterState) => {
      let anyFilteredPaths = false;
      for (let filterState of Object.values(pathFilterState)) {
        anyFilteredPaths = anyFilteredPaths || filterState;
      }

      if (!anyFilteredPaths) return results;
      const filteredResults = [];
      for (let result of results) {
        let filterResult = true;
        for (let path of result.paths) {
          filterResult = filterResult && pathFilterState[path.id];
        }

        if (!filterResult) {
          filteredResults.push(result);
        }
      }

      return filteredResults;
    }

    const genRankedPaths = (pathRanks) => {
      return pathRanks.map((pr) => {
        if (pr.support.length > 1) {
          const path = pr.path.path;
          for (const item of path.subgraph) {
            if (hasSupport(item)) {
              item.support = genRankedPaths(pr.support);
            }
          }
        }

        return pr.path;
      });
    }

    // If there are no active filters or facets, get the full result set and reset the activeEntityFilters
    if (filters.length === 0) {
      if (entityFilters.length > 0) {
        setActiveEntityFilters([]);
      }

      pathFilterState = genPathFilterState(summary.data);
      calculateFacetCounts(filteredResults, summary, [], [], [], setAvailableTags);
      return [filteredResults, pathFilterState];
    }

    let [resultFilters, pathFilters, globalFilters] = filtering.groupFilterByType(filters);
    const resultFacets = resultFilters.filter((f) => !filtering.isExclusion(f));
    const negatedResultFacets = resultFilters.filter((f) => filtering.isExclusion(f));
    resultFilters = negatedResultFacets.concat(globalFilters);
    const resultPathRanks = [];
    let [results, negatedResults] = filterResults(resultFilters, entityFilters, originalResults, resultPathRanks);
    calculateFacetCounts(results, summary, negatedResults, resultFacets, negatedResultFacets, setAvailableTags);
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
    if(currentPage !== 0) {
      handlePageReset(false, results.length);
    }

    return [results, pathFilterState];
  }

  // Handle the addition and removal of individual filters. Keep the invariant that
  // filters of the same type are grouped together.
  const handleFilter = (filter) => {
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
        newActiveFilters = activeFilters.reduce((newFilters, oldFilter, i) => {
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

    setActiveFilters(newActiveFilters);
    let newFormattedResults = handleUpdateResults(newActiveFilters, activeEntityFilters, rawResults.current, originalResults.current, false, currentSortString.current);
    handlePageReset(false, newFormattedResults.length);
  }

  useEffect(() => {
    let node = rawResults.current?.data?.nodes[initNodeIdParam];
    if(rawResults.current && node) {
      if(node.descriptions.length > 0) {
        setNodeDescription(node.descriptions[0].replaceAll('"', ''));
      }
    }

  },[formattedResults, initNodeIdParam]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        theme="light"
        transition={Slide}
        pauseOnFocusLoss={false}
        hideProgressBar
        className="toastContainer"
        closeOnClick={false}
        closeButton={false}
      />
      <ShareModal
        isOpen={shareModalOpen}
        onClose={()=>setShareModalOpen(false)}
        qid={currentQueryID}
        shareResultID={shareResultID.current}
      />
      <NotesModal
        isOpen={notesOpen}
        onClose={()=>(setNotesOpen(false))}
        handleClearNotesEditor={handleClearNotesEditor}
        className="notes-modal"
        noteLabel={noteLabel.current}
        bookmarkID={currentBookmarkID.current}
      />
      <EvidenceModal
        isOpen={evidenceOpen}
        onClose={()=>handleEvidenceModalClose(setEvidenceOpen)}
        className="evidence-modal"
        item={selectedItem}
        results={rawResults.current}
        edgeGroup={selectedEdge}
        path={selectedPath}
      />
      <ResultFocusModal
        isOpen={focusModalOpen}
        onAccept={() => {
          setFocusModalOpen(false);
          handlePageClick({selected: sharedItem.page}, false, formattedResults.length);
          setExpandSharedResult(true);
          setAutoScrollToResult(true);
        }}
        onReject={() => setFocusModalOpen(false)}
        sharedItem={sharedItem}
      />
      <div className={styles.resultsList}>
        {
          isPathfinder
          ?
            <QueryPathfinder 
              results
              setShareModalFunction={setShareModalOpen}
            />
          :
            <Query
              results
              loading={isLoading}
              initPresetTypeID={initPresetTypeID}
              initPresetTypeObject={initPresetTypeObject}
              initNodeIdParam={initNodeIdParam}
              initNodeLabelParam={initNodeLabelParam}
              nodeDescription={nodeDescription}
              setShareModalFunction={setShareModalOpen}
            />
        }
        <div className={`${styles.resultsContainer} container`}>
          {
            isLoading &&
            <LoadingBar
              loading={isLoading}
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
                onClearAll={()=>handleClearAllFilters(activeEntityFilters, rawResults.current, originalResults.current, setActiveFilters, currentSortString.current, handleUpdateResults)}
                expanded={filtersExpanded}
                setExpanded={setFiltersExpanded}
                availableTags={availableTags}
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
                      <div className={`${styles.tableHead}`}>
                        <div
                          className={`${styles.head} ${styles.nameHead} ${isSortedByName ? styles.true : (isSortedByName === null) ? '' : styles.false}`}
                          onClick={()=>{
                            let sortString = (isSortedByName === null) ? 'nameLowHigh' : (isSortedByName) ? 'nameHighLow' : 'nameLowHigh';
                            currentSortString.current = sortString;
                            handleUpdateResults(activeFilters, activeEntityFilters, rawResults.current, originalResults.current, true, sortString, formattedResults);
                          }}
                        >
                          Name
                        </div>
                        <div></div>
                        <div
                          className={`${styles.head} ${styles.evidenceHead} ${isSortedByEvidence ? styles.true : (isSortedByEvidence === null) ? '': styles.false}`}
                          onClick={()=>{
                            let sortString = (isSortedByEvidence === null) ? 'evidenceHighLow' : (isSortedByEvidence) ? 'evidenceHighLow' : 'evidenceLowHigh';
                            currentSortString.current = sortString;
                            handleUpdateResults(activeFilters, activeEntityFilters, rawResults.current, originalResults.current, true, sortString, formattedResults);
                          }}
                        >
                          Evidence
                          <ChevUp className={styles.chev}/>
                        </div>
                        <div
                          className={`${styles.head} ${styles.pathsHead} ${isSortedByPaths ? styles.true : (isSortedByPaths === null) ? '': styles.false}`}
                          onClick={()=>{
                            let sortString = (isSortedByPaths === null) ? 'pathsHighLow' : (isSortedByPaths) ? 'pathsHighLow' : 'pathsLowHigh';
                            currentSortString.current = sortString;
                            handleUpdateResults(activeFilters, activeEntityFilters, rawResults.current, originalResults.current, true, sortString, formattedResults);
                          }}
                          data-tooltip-id="paths-tooltip"
                        >
                          Paths
                          <Alert/>
                          <ChevUp className={styles.chev}/>
                          <Tooltip id="paths-tooltip">
                            <span className={styles.scoreSpan}>Each path represents a discrete series of relationships that connect the result to the searched-for entity.</span>
                          </Tooltip>
                        </div>
                        {
                          !isPathfinder &&
                          <div
                            className={`${styles.head} ${styles.scoreHead} ${isSortedByScore ? styles.true : (isSortedByScore === null) ? '': styles.false}`}
                            onClick={()=>{
                              let sortString = (isSortedByScore === null) ? 'scoreHighLow' : (isSortedByScore) ? 'scoreHighLow' : 'scoreLowHigh';
                              currentSortString.current = sortString;
                              handleUpdateResults(activeFilters, activeEntityFilters, rawResults.current, originalResults.current, true, sortString, formattedResults);
                            }}
                            data-tooltip-id="score-tooltip"
                          >
                            Score
                            <Alert/>
                            <ChevUp className={styles.chev}/>
                            <Tooltip id="score-tooltip">
                              <span className={styles.scoreSpan}>Multimodal calculation considering strength of relationships supporting the result. Scores range from 0 to 5 and may change as new results are added. Scores will be displayed once all results have been loaded.</span>
                            </Tooltip>
                          </div>
                        }
                        <div></div>
                      </div>
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
                          return (
                            <ResultsItem
                              isEven={i % 2 !== 0}
                              isPathfinder={isPathfinder}
                              rawResults={rawResults.current}
                              key={item.id}
                              type={initPresetTypeObject}
                              item={item}
                              pathFilterState={pathFilterState}
                              activateEvidence={activateEvidence}
                              activateNotes={activateNotes}
                              activeEntityFilters={activeEntityFilters}
                              zoomKeyDown={zoomKeyDown}
                              currentQueryID={currentQueryID}
                              queryNodeID={initNodeIdParam}
                              queryNodeLabel={initNodeLabelParam}
                              queryNodeDescription={nodeDescription}
                              bookmarked={item.bookmarked}
                              bookmarkID={item.bookmarkID}
                              hasNotes={item.hasNotes}
                              handleBookmarkError={handleBookmarkError}
                              bookmarkAddedToast={bookmarkAddedToast}
                              bookmarkRemovedToast={bookmarkRemovedToast}
                              availableTags={availableTags}
                              handleFilter={handleFilter}
                              activeFilters={activeFilters}
                              sharedItemRef={item.id === initResultIdParam ? sharedItemRef : null}
                              startExpanded={item.id === initResultIdParam && expandSharedResult}
                              setExpandSharedResult={setExpandSharedResult}
                              setShareModalOpen={setShareModalOpen}
                              setShareResultID={setShareResultID}
                              resultsComplete={(!isError && freshRawResults === null && !isFetchingARAStatus.current && !isFetchingResults.current)}
                            />
                          )
                        })
                      }
                    </div>
                  </div>
                  {
                    formattedResults.length > 0 &&
                    <div className={styles.pagination}>
                      <div className={styles.perPage}>
                        <Select
                          label=""
                          name="Results Per Page"
                          size="s"
                          handleChange={(value)=>{
                            setItemsPerPage(parseInt(value));
                            handlePageReset(value, formattedResults.length);
                          }}
                          noanimate
                          >
                          <option value="5" key="0">5</option>
                          <option value="10" key="1">10</option>
                          <option value="20" key="2">20</option>
                          <option value="50" key="3">50</option>
                        </Select>
                      </div>
                      <ReactPaginate
                        breakLabel="..."
                        nextLabel={<ChevRight/>}
                        previousLabel={<ChevLeft/>}
                        onPageChange={handlePageClick}
                        pageRangeDisplayed={5}
                        marginPagesDisplayed={1}
                        pageCount={pageCount}
                        renderOnZeroPageCount={null}
                        className={styles.pageNums}
                        pageClassName={styles.pageNum}
                        activeClassName={styles.current}
                        previousLinkClassName={`${styles.button}`}
                        nextLinkClassName={`${styles.button}`}
                        disabledLinkClassName={styles.disabled}
                        forcePage={currentPage.current}
                      />
                    </div>
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
            setShareModalFunction={setShareModalOpen}
          />
        }
      </div>
      {blocker ? <NavConfirmationPromptModal blocker={blocker} /> : null}
    </QueryClientProvider>
  );
}

export default ResultsList;
