import { useState, useRef, useCallback, useEffect } from "react";
import styles from './ResultsList.module.scss';
import Query from "../Query/Query";
import ResultsFilter from "../ResultsFilter/ResultsFilter";
import ResultsItem from "../ResultsItem/ResultsItem";
import EvidenceModal from "../Modals/EvidenceModal";
import Select from "../FormFields/Select";
import LoadingBar from "../LoadingBar/LoadingBar";
import Tooltip from '../Tooltip/Tooltip';
import ResultsListLoadingButton from "../ResultsListLoadingButton/ResultsListLoadingButton";
import ResultsListHeader from "../ResultsListHeader/ResultsListHeader";
import NavConfirmationPromptModal from "../Modals/NavConfirmationPromptModal";
import ReactPaginate from 'react-paginate';
import { cloneDeep, isEqual } from "lodash";
import { unstable_useBlocker as useBlocker } from "react-router";
import { useSelector } from 'react-redux';
import { currentQueryResultsID, currentResults }from "../../Redux/resultsSlice";
import { currentPrefs, currentRoot }from "../../Redux/rootSlice";
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import { sortNameLowHigh, sortNameHighLow, sortEvidenceLowHigh, sortEvidenceHighLow, 
  sortScoreLowHigh, sortScoreHighLow, sortByEntityStrings, updatePathRankByTag, 
  filterCompare } from "../../Utilities/sortingFunctions";
import { getSummarizedResults } from "../../Utilities/resultsFormattingFunctions";
import { findStringMatch, handleResultsError, handleEvidenceModalClose,
  handleResultsRefresh, handleClearAllFilters } from "../../Utilities/resultsInteractionFunctions";
import { isFacet, isEvidenceFilter, isTextFilter, facetFamily, hasSameFacetFamily } from '../../Utilities/filterFunctions';
import { getDataFromQueryVar, handleFetchErrors } from "../../Utilities/utilities";
import { queryTypes } from "../../Utilities/queryTypes";
import { ReactComponent as Alert } from '../../Icons/Alerts/Info.svg';
import { ReactComponent as ShareIcon } from '../../Icons/share.svg';

const ResultsList = ({loading}) => {

  const root = useSelector(currentRoot);
  const prefs = useSelector(currentPrefs);
  let blocker = useBlocker(true);

  // URL search params
  const loadingParam = getDataFromQueryVar("loading");
  const queryIDParam = getDataFromQueryVar("q");
  const initPresetTypeID = getDataFromQueryVar("t");
  const initPresetTypeObject = (initPresetTypeID) 
    ? queryTypes.find(type => type.id === parseInt(initPresetTypeID))
    : null;
  const initNodeLabelParam = getDataFromQueryVar("l");
  const initNodeIdParam = getDataFromQueryVar("i");
  const [nodeDescription, setNodeDescription] = useState();

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
  const [isFetchingARAStatus, setIsFetchingARAStatus] = useState(presetIsLoading);
  // Bool, should results be fetched
  const [isFetchingResults, setIsFetchingResults] = useState(false);
  // Bool, are the results currently sorted by name (true/false for asc/desc, null for not set)
  const [isSortedByName, setIsSortedByName] = useState(null);
  // Bool, are the results currently sorted by evidence count (true/false for asc/desc, null for not set)
  const [isSortedByEvidence, setIsSortedByEvidence] = useState(null);
  // Bool, are the results currently sorted by score
  const [isSortedByScore, setIsSortedByScore] = useState(false);
  // Bool, is evidence modal open?
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  // String, active title of evidence modal
  const [isAllEvidence, setIsAllEvidence] = useState(true);
  // Object, the currently selected item
  const [selectedItem, setSelectedItem] = useState({});
  // Array, edges represented in current evidence
  const [selectedEdges, setSelectedEdges] = useState([]);
  // Array, evidence relating to the item last clicked
  const [currentEvidence, setCurrentEvidence] = useState([]);
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
  const displayedResults = formattedResults.slice(itemOffset, endResultIndex);
  const initSortString = (prefs?.result_sort?.pref_value) ? prefs.result_sort.pref_value : 'scoreHighLow';
  const currentSortString = useRef(initSortString);
  // Int, number of pages
  const pageCount = Math.ceil(formattedResults.length / itemsPerPage);
  // Array, currently active filters
  const [activeFilters, setActiveFilters] = useState([]);
  // Array, currently active filters
  const [availableTags, setAvailableTags] = useState([]);
  // Array, currently active string filters
  const [activeStringFilters, setActiveStringFilters] = useState([]);
  // Array, aras that have returned data
  const [returnedARAs, setReturnedARAs] = useState({aras: [], status: ''});
  // Bool, is share modal open
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Bool, is the shift key being held down
  const [zoomKeyDown, setZoomKeyDown] = useState(false);

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

  // Int, number of times we've checked for ARA status. Used to determine how much time has elapsed for a timeout on ARA status.
  const numberOfStatusChecks = useRef(0);
  // Initialize queryClient for React Query to fetch results
  const queryClient = new QueryClient();

  // Handles direct page click
  const handlePageClick = useCallback((event, newItemsPerPage = false, resultsLength = formattedResults.length, currentNumItemsPerPage = itemsPerPage ) => {
    let perPageNum = (newItemsPerPage) ? newItemsPerPage : currentNumItemsPerPage;
    currentPage.current = event.selected;
    const newOffset = (event.selected * perPageNum) % resultsLength;
    const endOffset = (parseInt(newOffset + perPageNum) > resultsLength)
      ? resultsLength
      : parseInt(newOffset + perPageNum);
    setItemOffset(newOffset);
    setEndResultIndex(endOffset);
  }, [formattedResults.length, itemsPerPage]);

  const handleUpdateResults = (facetsAndFilters, asFilters, rr, or = [], justSort = false, sortType, fr = []) => {

    let newFormattedResults = [];
    let newOriginalResults = [];
    
    if(or.length === 0) {
      newFormattedResults = (justSort) ? fr : getSummarizedResults(rr.data);
      newOriginalResults = cloneDeep(newFormattedResults);
    } else {
      newFormattedResults = (justSort) ? fr : or;
      newOriginalResults = or;
    }

    // filter
    if (!justSort) {
      newFormattedResults = filterAndFacet(facetsAndFilters, asFilters, newFormattedResults, newOriginalResults, rr);
    }

    // sort
    newFormattedResults = getSortedResults(newFormattedResults, sortType);

    // set results
    setFormattedResults(newFormattedResults);

    if(newFormattedResults.length > 0)
      handlePageClick({selected: 0}, false, newFormattedResults.length);

    if(!justSort)
      originalResults.current = newOriginalResults;
    
    rawResults.current = rr;

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
    const newFormattedResults = handleUpdateResults(activeFilters, activeStringFilters, rr, [], false, currentSortString.current);

    // we have results to show, set isLoading to false
    if (newFormattedResults.length > 0)
      setIsLoading(false);

    // If no results have returned from any ARAs, and ARA status is complete, set isLoading to false
    if(rr && rr.data.results && rr.data.results.length === 0 && !isFetchingARAStatus)
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
    const response = await fetch(`/${root}/api/v1/pub/query/${currentQueryID}/status`, requestOptions)
      .then(response => handleFetchErrors(response))
      .then(response => response.json())
      .then(data => {
        // increment the number of status checks
        numberOfStatusChecks.current++;
        console.log("ARA status:",data);

        let fetchResults = false;

        if(data.data.aras.length > returnedARAs.aras.length) {
          console.log(`Old ARAs: ${returnedARAs.aras}, New ARAs: ${data.data.aras}`);
          setReturnedARAs(data.data);
          fetchResults = true;
        } else {
          console.log(`No new ARAs have returned data. Current status is: '${data.status}'`);
        }
        /*
        If status is success (meaning all ARAs have returned) or we've reached 120 status checks (meaning 20 min have elapsed)
        stop fetching ARA status and move to fetching results.
        */
        if(data.status === 'success' || numberOfStatusChecks.current >= 120) {
          setIsFetchingARAStatus(false);
          fetchResults = true;
        }
        if(fetchResults)
          setIsFetchingResults(true);
      })
      .catch((error) => {
        if(formattedResults.length <= 0) {
          handleResultsError(true, setIsError, setIsLoading);
          setIsFetchingARAStatus(false);
        }
        if(formattedResults.length > 0) {
          setIsFetchingARAStatus(false);
        }
        console.error(error)
      });
  }, {
    refetchInterval: 10000,
    enabled: isFetchingARAStatus,
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
    const response = await fetch(`/${root}/api/v1/pub/query/${currentQueryID}/result`, requestOptions)
      .then(response => handleFetchErrors(response, () => {
        console.log(response.json());
        setIsFetchingARAStatus(false);
        setIsFetchingResults(false);
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

        setIsFetchingResults(false);
      })
      .catch((error) => {
        console.log(error);
      });
  }, {
    enabled: isFetchingResults,
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
        break;
      case 'nameHighLow':
        newSortedResults = sortNameHighLow(newSortedResults);
        setIsSortedByName(false);
        setIsSortedByScore(null)
        setIsSortedByEvidence(null);
        break;
      case 'evidenceLowHigh':
        newSortedResults = sortEvidenceLowHigh(newSortedResults);
        setIsSortedByEvidence(true);
        setIsSortedByScore(null)
        setIsSortedByName(null);
        break;
      case 'evidenceHighLow':
        newSortedResults = sortEvidenceHighLow(newSortedResults);
        setIsSortedByEvidence(false);
        setIsSortedByScore(null)
        setIsSortedByName(null);
        break;
      case 'scoreLowHigh':
        newSortedResults = sortScoreLowHigh(newSortedResults);
        setIsSortedByScore(true)
        setIsSortedByEvidence(null);
        setIsSortedByName(null);
        break;
      case 'scoreHighLow':
        newSortedResults = sortScoreHighLow(newSortedResults);
        setIsSortedByScore(false)
        setIsSortedByEvidence(null);
        setIsSortedByName(null);
        break;
      case 'entityString':
        newSortedResults = sortByEntityStrings(newSortedResults, activeStringFilters);
        setIsSortedByEvidence(null);
        setIsSortedByName(null);
        break;
      default:
        break;
    }

    return newSortedResults;
  }, [activeStringFilters]);

  const calculateFacetCounts = (fResults, rResults, activeFacets, tagSetterMethod) => {
    // Function that adds the tag counts when a certain condition (predicate) is met
    const addTagCountsWhen = (countedTags, result, predicate) => {
      for(const tag of result.tags) {
        // if the tag exists on the list, either increment it or initialize its count
        if (predicate(tag)) {
          if (countedTags.hasOwnProperty(tag)){
            if (!countedTags[tag].count) {
              countedTags[tag].count = 0;
            }

            countedTags[tag].count++;
          // if it doesn't exist on the current list of tags, add it and initialize its count
          } else {
            countedTags[tag] = {name: tag, value: '', count: 1};
          }
        }
      }
    }

    // create a list of tags from the list provided by the backend
    const countedTags = cloneDeep(rResults.data.tags);
    const activeFamilies = new Set(activeFacets.map(f => facetFamily(f.type)));
    for(const result of fResults) {
      // determine the distance between a result's facets and the facet selection
      const resultFamilies = new Set();
      for (const facet of activeFacets) {
        if (result.tags.includes(facet.type)) {
          resultFamilies.add(facetFamily(facet.type));
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

        addTagCountsWhen(countedTags, result, (tag) => {
          return facetFamily(tag) === missingFamily;
        });
      }
      // Otherwise skip this result
    }

    Object.entries(countedTags).forEach((tag)=> {
      if(tag[1].count === undefined || tag[1].count <= 0)
        delete countedTags[tag[0]];
    })

    tagSetterMethod(countedTags);
  }

  // Click handler for opening the evidence modal and populating the evidence
  const activateEvidence = (evidence, item, edgeGroup, isAll) => {
    setIsAllEvidence(isAll);
    setSelectedItem(item);
    setSelectedEdges(edgeGroup);
    setCurrentEvidence(evidence);
    setEvidenceOpen(true);
  }

  const filterAndFacet = (facetsAndFilters, stringFilters, fResults, oResults, rResults) => {
    const filterResults = (filters, stringFilters, oResults, resultPathRanks) => {
      const filteredResults = [];
      /*
        For each result, check against each filter. If any filter is not met,
        skip that result.
      */
      for(let result of oResults) {
        const pathRanks = result.compressedPaths.map((p) => { return { rank: 0, path: p }; });
        let addResult = true;
        for(const filter of filters) {
          if ((isEvidenceFilter(filter) && !(filter.value <= result.evidence.length)) ||
              (isTextFilter(filter) && !findStringMatch(result, filter.value, pathRanks))) {
            addResult = false;
            break;
          }
        }

        if (addResult) {
          filteredResults.push(result);
          resultPathRanks.push(pathRanks);
        }
      }

      let newStringFilters = [];
      for(const filter of filters) {
        // String filters with identical values shouldn't be added to the activeFilters array,
        // so we don't have to check for duplicate values here, just for the str tag.
        if(isTextFilter(filter)) {
          newStringFilters.push(filter.value);
        }
      }

      // if the new set of filters don't match the current ones, call setActiveStringFilters to update them
      if(!(newStringFilters.length === stringFilters.length && newStringFilters.every((value, index) => value === stringFilters[index])))
        setActiveStringFilters(newStringFilters);

      // Set the formatted results to the newly filtered results
      return filteredResults;
    }

    const facetResults = (facets, fResults, resultPathRanks) => {
      const intersect = (a, b) => { return a && b; };
      const union = (a, b) => { return a || b; };
      const facetedResults = [];
      let resultIndex = 0;
      for (const result of fResults) {
        let addResult = true;
        let isInter = null;
        let combine = null;
        let lastFacetType = '';
        for (const facet of facets) {
          isInter = (!hasSameFacetFamily(lastFacetType, facet.type));
          if (isInter) {
            // We went through an entire facet group with no match
            if (!addResult) {
              break;
            }

            lastFacetType = facet.type;
            combine = intersect;
          } else {
            combine = union;
          }

          addResult = combine(addResult, result.tags.includes(facet.type));
          updatePathRankByTag(result, facet.type, resultPathRanks[resultIndex]);
        }

        if (addResult) {
          const newResult = cloneDeep(result);
          const pathRanks = resultPathRanks[resultIndex];
          pathRanks.sort((a, b) => { return a.rank - b.rank; });
          newResult.compressedPaths = pathRanks.map((pr) => { return pr.path; });
          facetedResults.push(newResult);
        }

        resultIndex++;
      };

      return facetedResults;
    }

    // If there are no active filters or facets, get the full result set and reset the activeStringFilters
    if(facetsAndFilters.length === 0) {
      if(stringFilters.length > 0) {
        setActiveStringFilters([]);
      }

      calculateFacetCounts(fResults, rResults, [], setAvailableTags);
      return fResults;
    }

    const facets = facetsAndFilters.filter(f => isFacet(f));
    const filters = facetsAndFilters.filter(f => isTextFilter(f) || isEvidenceFilter(f));
    const resultPathRanks = [];
    let results = filterResults(filters, stringFilters, oResults, resultPathRanks);
    calculateFacetCounts(results, rResults, facets, setAvailableTags);
    results = facetResults(facets, results, resultPathRanks);
    return results
  }

  // Handle the addition and removal of individual filters. Keep the invariant that
  // filters of the same type are grouped together.
  const handleFilter = (filter) => {
    let indexes = [];
    for(const [i, activeFilter] of activeFilters.entries()) {
      if (activeFilter.type === filter.type) {
        indexes.push(i);
      }
    }

    let newActiveFilters = cloneDeep(activeFilters);
    // If we don't find any matches, push the filter and sort by filter family
    if(indexes.length === 0) {
      newActiveFilters.push(filter);
      newActiveFilters.sort(filterCompare);
      setActiveFilters(newActiveFilters);
      handleUpdateResults(newActiveFilters, activeStringFilters, rawResults.current, originalResults.current, false, currentSortString.current)
      return;
    }

    let addFilter = true;
    for(const index of indexes) {
      // if the values also match, it's a real match
      if (activeFilters[index].value === filter.value) {
        // set newFilters to a new array with any matches removed
        newActiveFilters = activeFilters.reduce((newFilters, oldFilter, i) => {
          if(i !== index) {
            newFilters.push(oldFilter);
          }

          return newFilters;
        }, []);

        addFilter = false;
        break;
      // If the values don't match and it's not a string search, update the value
      } else if (!isTextFilter(filter)) {
        newActiveFilters = newActiveFilters.map((activeFilter, i) => {
          if(i === index) {
            activeFilter.value = filter.value;
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
    handleUpdateResults(newActiveFilters, activeStringFilters, rawResults.current, originalResults.current, false, currentSortString.current)
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
      <EvidenceModal
        isOpen={evidenceOpen}
        onClose={()=>handleEvidenceModalClose(setEvidenceOpen)}
        className="evidence-modal"
        currentEvidence={currentEvidence}
        item={selectedItem}
        results={rawResults.current}
        isAll={isAllEvidence}
        edgeGroup={selectedEdges}
      />
      <div className={styles.resultsList}>
        <Query 
          results 
          loading={isLoading} 
          initPresetTypeID={initPresetTypeID}
          initPresetTypeObject={initPresetTypeObject}
          initNodeIdParam={initNodeIdParam}
          initNodeLabelParam={initNodeLabelParam}
          nodeDescription={nodeDescription}
        />
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
                startIndex={itemOffset+1}
                endIndex={endResultIndex}
                formattedCount={formattedResults.length}
                totalCount={originalResults.current.length}
                onFilter={handleFilter}
                onClearAll={()=>handleClearAllFilters(activeStringFilters, rawResults.current, originalResults.current, setActiveFilters, currentSortString.current, handleUpdateResults)}
                activeFilters={activeFilters}
                availableTags={availableTags}
              />
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
                  currentQueryID: currentQueryID
                }}
                loadingButtonData={{
                  handleResultsRefresh: ()=>handleResultsRefresh(freshRawResults, handleNewResults, setFreshRawResults),
                  isFetchingARAStatus: isFetchingARAStatus,
                  isFetchingResults: isFetchingResults,
                  showDisclaimer: false,
                  containerClassName: styles.loadingButtonContainer,
                  buttonClassName: styles.loadingButton,
                  hasFreshResults: (freshRawResults !== null)
                }}
              />
              
              <div className={styles.resultsTableContainer}>
                <div className={styles.resultsTable}>
                  <div className={styles.tableBody}>
                    <div className={`${styles.tableHead}`}>
                      <div
                        className={`${styles.head} ${styles.nameHead} ${isSortedByName ? styles.true : (isSortedByName === null) ? '' : styles.false}`}
                        onClick={()=>{
                          let sortString = (isSortedByName === null) ? 'nameLowHigh' : (isSortedByName) ? 'nameHighLow' : 'nameLowHigh';
                          currentSortString.current = sortString;
                          handleUpdateResults(activeFilters, activeStringFilters, rawResults.current, originalResults.current, true, sortString, formattedResults);
                        }}
                      >
                        Name
                      </div>
                      <div
                        className={`${styles.head} ${styles.evidenceHead} ${isSortedByEvidence ? styles.true : (isSortedByEvidence === null) ? '': styles.false}`}
                        onClick={()=>{
                          let sortString = (isSortedByEvidence === null) ? 'evidenceHighLow' : (isSortedByEvidence) ? 'evidenceHighLow' : 'evidenceLowHigh';
                          currentSortString.current = sortString;
                          handleUpdateResults(activeFilters, activeStringFilters, rawResults.current, originalResults.current, true, sortString, formattedResults);
                        }}
                      >
                        Evidence
                      </div>
                      <div
                        className={`${styles.head} ${styles.scoreHead} ${isSortedByScore ? styles.true : (isSortedByScore === null) ? '': styles.false}`}
                        onClick={()=>{
                          let sortString = (isSortedByScore === null) ? 'scoreHighLow' : (isSortedByScore) ? 'scoreHighLow' : 'scoreLowHigh';
                          currentSortString.current = sortString;
                          handleUpdateResults(activeFilters, activeStringFilters, rawResults.current, originalResults.current, true, sortString, formattedResults);
                        }}
                        data-tooltip-id="score-tooltip"
                      >
                        Score
                        <Alert/>
                        <Tooltip id="score-tooltip">
                          <span className={styles.scoreSpan}>Multimodal calculation considering the strength and amount of evidence supporting the result. It is presented as a percentile and may change as new results are added.</span>
                        </Tooltip>
                      </div>
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
                      displayedResults.map((item) => {
                        return (
                          <ResultsItem
                            rawResults={rawResults.current}
                            key={item.id}
                            type={initPresetTypeObject}
                            item={item}
                            activateEvidence={(evidence, item, edgeGroup, isAll)=>activateEvidence(evidence, item, edgeGroup, isAll)}
                            activeStringFilters={activeStringFilters}
                            zoomKeyDown={zoomKeyDown}
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
                          handlePageClick({selected: 0}, value);
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
                      nextLabel="Next"
                      previousLabel="Previous"
                      onPageChange={handlePageClick}
                      pageRangeDisplayed={5}
                      marginPagesDisplayed={1}
                      pageCount={pageCount}
                      renderOnZeroPageCount={null}
                      className={styles.pageNums}
                      pageClassName={styles.pageNum}
                      activeClassName={styles.current}
                      previousLinkClassName={`${styles.prev} ${styles.button}`}
                      nextLinkClassName={`${styles.prev} ${styles.button}`}
                      disabledLinkClassName={styles.disabled}
                      forcePage={currentPage.current}
                    />
                  </div>
                }
                <ResultsListLoadingButton
                  data={{
                    handleResultsRefresh: ()=>handleResultsRefresh(freshRawResults, handleNewResults, setFreshRawResults),
                    isFetchingARAStatus: isFetchingARAStatus,
                    isFetchingResults: isFetchingResults,
                    showDisclaimer: true,
                    containerClassName: styles.bottomLoadingButtonContainer,
                    buttonClassName: styles.loadingButton,
                    hasFreshResults: (freshRawResults !== null)
                  }}
                />
              </div>
            </>
          }
        </div>
        {
          formattedResults.length > 0 &&
          <div className={styles.sticky}>
            <div className={styles.container}>
              <ResultsListLoadingButton
                data={{
                  handleResultsRefresh: ()=>handleResultsRefresh(freshRawResults, handleNewResults, setFreshRawResults),
                  isFetchingARAStatus: isFetchingARAStatus,
                  isFetchingResults: isFetchingResults,
                  showDisclaimer: false,
                  containerClassName: styles.shareLoadingButtonContainer,
                  buttonClassName: styles.loadingButton,
                  hasFreshResults: (freshRawResults !== null),
                  isSticky: true
                }}
              />
              <button
                className={styles.shareButton}
                onClick={()=>{setShareModalOpen(true)}}
                >
                  <ShareIcon/>
              </button>
            </div>
          </div>
        }
      </div>
      {blocker ? <NavConfirmationPromptModal blocker={blocker} /> : null}
    </QueryClientProvider>
  );
}

export default ResultsList;
