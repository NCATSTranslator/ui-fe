import { useState, useRef, useCallback } from "react";
import styles from './ResultsList.module.scss';
import Query from "../Query/Query";
import ResultsFilter from "../ResultsFilter/ResultsFilter";
import ResultsItem from "../ResultsItem/ResultsItem";
import EvidenceModal from "../Modals/EvidenceModal";
import ShareModal from "../Modals/ShareModal";
import Select from "../FormFields/Select";
import LoadingBar from "../LoadingBar/LoadingBar";
import { useSelector } from 'react-redux';
import { currentQueryResultsID, currentResults }from "../../Redux/resultsSlice";
import { currentQuery} from "../../Redux/querySlice";
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import ReactPaginate from 'react-paginate';
import { sortNameLowHigh, sortNameHighLow, sortEvidenceLowHigh, sortEvidenceHighLow, 
  sortScoreLowHigh, sortScoreHighLow, sortByEntityStrings, updatePathRankByTag, 
  filterCompare } from "../../Utilities/sortingFunctions";
import { getSummarizedResults, findStringMatch } from "../../Utilities/resultsFunctions";
import { handleFetchErrors } from "../../Utilities/utilities";
import { cloneDeep, isEqual } from "lodash";
import {ReactComponent as ResultsAvailableIcon} from '../../Icons/Alerts/Checkmark.svg';
import { ReactComponent as Alert } from '../../Icons/Alerts/Info.svg';
import Tooltip from '../Tooltip/Tooltip';
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import {ReactComponent as CompleteIcon} from '../../Icons/Alerts/Checkmark.svg';
import {ReactComponent as ShareIcon} from '../../Icons/Buttons/Export.svg';
import {ReactComponent as CloseIcon } from "../../Icons/Buttons/Close.svg"
import { unstable_useBlocker as useBlocker } from "react-router";
import NavConfirmationPromptModal from "../Modals/NavConfirmationPromptModal";
import { isFacetFilter, isEvidenceFilter, isTextFilter, isFdaFilter,
  facetFamily, hasSameFacetFamily } from '../../Utilities/filterFunctions';

const ResultsList = ({loading}) => {

  let blocker = useBlocker(true);

  // URL search params
  const loadingParam = new URLSearchParams(window.location.search).get("loading")
  const queryIDParam = new URLSearchParams(window.location.search).get("q")
  const presetDiseaseLabelParam = new URLSearchParams(window.location.search).get("l")
  const presetQueryTypeIDParam = new URLSearchParams(window.location.search).get("t")

  let storedQuery = useSelector(currentQuery);
  storedQuery = (storedQuery !== undefined) ? storedQuery : {type:{}, node: {}};

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
  const [evidenceTitle, setEvidenceTitle] = useState('All Evidence');
  // Array, edges represented in current evidence
  const [evidenceEdges, setEvidenceEdges] = useState([]);
  // Array, evidence relating to the item last clicked
  const [currentEvidence, setCurrentEvidence] = useState([]);
  // Int, current page
  const currentPage = useRef(0);
  // Int, current item offset (ex: on page 3, offset would be 30 based on itemsPerPage of 10)
  const [itemOffset, setItemOffset] = useState(0);
  // Int, how many items per page
  const [itemsPerPage, setItemsPerPage] = useState(10);
  // Int, last result item index
  const [endResultIndex, setEndResultIndex] = useState(itemsPerPage);
  // Obj, original raw results from the BE
  const rawResults = useRef(resultsState);
  // Obj, original, unfiltered results from the BE
  const originalResults = useRef([]);
  // Obj, fresh results from the BE to replace existing rawResults
  const [freshRawResults, setFreshRawResults] = useState(null);
  /*
    Ref, used to track changes in results
  */
  const prevRawResults = useRef(rawResults);
  // Array, results formatted by any active filters, sorted by any active sorting
  const [formattedResults, setFormattedResults] = useState([]);
  // Array, results meant to display based on the pagination
  const displayedResults = formattedResults.slice(itemOffset, endResultIndex);
  const currentSortString = useRef('scoreHighLow');
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
  const initPresetDisease = (presetDiseaseLabelParam) ? {id: '', label: presetDiseaseLabelParam} : null;
  const initPresetQueryTypeID = (presetQueryTypeIDParam) ? presetQueryTypeIDParam : null;
  // Obj, {label: ''}, used to set input text, determined by results object
  const [presetDisease] = useState(initPresetDisease);
  const [presetQueryTypeID] = useState(initPresetQueryTypeID);
  // Bool, is share modal open
  const [shareModalOpen, setShareModalOpen] = useState(false);
  // Int, number of times we've checked for ARA status. Used to determine how much time has elapsed for a timeout on ARA status.
  const numberOfStatusChecks = useRef(0);
  // Initialize queryClient for React Query to fetch results
  const queryClient = new QueryClient();

  // Handles direct page click
  const handlePageClick = useCallback((event) => {
    currentPage.current = event.selected;
    const newOffset = (event.selected * itemsPerPage) % formattedResults.length;
    const endOffset = (newOffset + itemsPerPage > formattedResults.length)
      ? formattedResults.length
      : newOffset + itemsPerPage;
    setItemOffset(newOffset);
    setEndResultIndex(endOffset);
  }, [formattedResults.length, itemsPerPage]);

  const handleUpdateResults = (aFilters, asFilters, rr, or = [], justSort = false, sortType, fr = []) => {

    let newFormattedResults = [];
    let newOriginalResults = [];
    
    if(or.length === 0) {
      newFormattedResults = (justSort) ? fr : getSummarizedResults(rr.data);
      console.log('setting original results')
      newOriginalResults = cloneDeep(newFormattedResults);
    } else {
      newFormattedResults = (justSort) ? fr : or;
      newOriginalResults = or;
    }

    // filter
    if(!justSort)
      newFormattedResults = getFilteredResults(aFilters, asFilters, newFormattedResults, newOriginalResults, rr);

    // sort
    newFormattedResults = getSortedResults(newFormattedResults, sortType);

    // set results
    setFormattedResults(newFormattedResults);
    console.log('formattedResults set');
    if(!justSort)
      originalResults.current = newOriginalResults;
      // setOriginalResults(newOriginalResults);
    
      rawResults.current = rr;
      // setRawResults(rr);

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

  const handleResultsError = (errorExists = true) => {
    setIsError(errorExists);
    setIsLoading(false);
  }

  // React Query call for status of results
  // eslint-disable-next-line
  const resultsStatus = useQuery('resultsStatus', async () => {
    console.log("Fetching current ARA status...");

    if(!currentQueryID)
      return;

    let queryIDJson = JSON.stringify({qid: currentQueryID});

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: queryIDJson
    };
    // eslint-disable-next-line
    const response = await fetch('/creative_status', requestOptions)
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
          handleResultsError(true);
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

    let queryIDJson = JSON.stringify({qid: currentQueryID});

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: queryIDJson
    };
    // eslint-disable-next-line
    const response = await fetch('/creative_result', requestOptions)
      .then(response => handleFetchErrors(response, () => {
        setIsFetchingARAStatus(false);
        setIsFetchingResults(false);
        if(formattedResults.length <= 0) {
          handleResultsError(true);
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


    // if we're not already on page 1, reset to page one.
    if(currentPage.current !== 0)
      handlePageClick({selected: 0});

    return newSortedResults;
  }, [activeStringFilters, handlePageClick]);

  const calculateTagCounts = (results, rawResults, activeFilters, tagSetterMethod) => {
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
    const countedTags = cloneDeep(rawResults.data.tags);
    const activeFamilies = new Set(activeFilters.map(f => facetFamily(f.type)));
    for(const result of results) {
      // determine the distance between a result's facets and the facet selection
      const resultFamilies = new Set();
      for (const filter of activeFilters) {
        if (result.tags.includes(filter.type)) {
          resultFamilies.add(facetFamily(filter.type));
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

  // Click handler for the modal close button
  const handleEvidenceModalClose = () => {
    setEvidenceOpen(false);
  }

  // Click handler for opening the evidence modal and populating the evidence
  const activateEvidence = (evidence, rawEdges) => {
    if(rawEdges) {
      setEvidenceTitle(`Showing evidence for:`)
      setEvidenceEdges(rawEdges);
    } else {
      setEvidenceTitle('All Evidence');
      setEvidenceEdges([]);
    }
    setCurrentEvidence(evidence);
    setEvidenceOpen(true);
  }

  const getFilteredResults = (filters, stringFilters, fResults, oResults, rResults) => {
    // If there are no active filters, get the full result set and reset the activeStringFilters
    if(filters.length === 0) {
      if(stringFilters.length > 0) {
        setActiveStringFilters([]);
      }
      calculateTagCounts(fResults, rResults, filters, setAvailableTags);
      return fResults;
    }

    // if we're not already on page 1, reset to page one.
    if(currentPage.current !== 0) {
      handlePageClick({selected: 0});
    }

    const filteredResults = [];
    const intersect = (a, b) => { return a &&= b; };
    const union = (a, b) => { return a ||= b; };
    /*
      For each result, check against each filter. If a filter is triggered,
      set addResult to true and add the result to the filtered results
    */
    for(let result of oResults) {
      let addResult = true;
      let isInter = null;
      let combine = null;
      let lastFilterType = '';
      const pathRanks = result.paths.map((p) => { return { rank: 0, path: p }; });
      for(const filter of filters) {
        isInter = (!hasSameFacetFamily(lastFilterType, filter.type));
        if (isInter) {
          // We went through an entire filter group with no match
          if (!addResult) {
            break;
          }

          lastFilterType = filter.type;
          combine = intersect;
        } else {
          combine = union;
        }

        if (isEvidenceFilter(filter)) {
          addResult = combine(addResult, (filter.value < result.evidence.length));
        } else if (isTextFilter(filter)) {
          addResult = combine(addResult, findStringMatch(result, filter.value, pathRanks));
        } else if (isFacetFilter(filter)) {
          addResult = combine(addResult, result.tags.includes(filter.type));
          updatePathRankByTag(result, filter.type, pathRanks);
        }
      }

      if (addResult) {
        pathRanks.sort((a, b) => { return a.rank - b.rank; });
        let newResult = cloneDeep(result);
        newResult.paths = pathRanks.map((pr) => { return pr.path; });
        filteredResults.push(newResult);
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

    calculateTagCounts(filteredResults, rResults, filters, setAvailableTags);
    // Set the formatted results to the newly filtered results
    return filteredResults;
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
      // If the values don't match and it's not a string search, update the value
      } else if (!isTextFilter(filter)) {
        newActiveFilters = newActiveFilters.map((activeFilter, i) => {
          if(i === index) {
            activeFilter.value = filter.value;
          }

          return activeFilter;
        });

        addFilter = false;
      // if the values don't match, but it *is* a new string search filter, add it
      } else if(isTextFilter(filter)) {
        addFilter = true;
      } else {
        addFilter = false;
      }
    }

    if(addFilter) {
      newActiveFilters.push(filter);
      newActiveFilters.sort(filterCompare);
    }

    setActiveFilters(newActiveFilters);
    handleUpdateResults(newActiveFilters, activeStringFilters, rawResults.current, originalResults.current, false, currentSortString.current)
  }

  // Output jsx for selected filters
  const getSelectedFilterDisplay = (filter) => {
    let filterDisplay;
    if (isEvidenceFilter(filter)) {
      filterDisplay = <div>Minimum Evidence: <span>{filter.value}</span></div>;
    } else if (isTextFilter(filter)) {
      filterDisplay = <div>String: <span>{filter.value}</span></div>;
    } else if (isFdaFilter(filter)) {
      filterDisplay = <div><span>FDA Approved</span></div>;
    } else if (isFacetFilter(filter)) {
      filterDisplay = <div>Tag:<span> {filter.value}</span></div>;
    }

    return filterDisplay;
  }

  const handleClearAllFilters = (asFilters, rResults, oResults) => {
    setActiveFilters([]);
    handleUpdateResults([], asFilters, rResults, oResults, false, currentSortString.current);
  }

  const handleResultsRefresh = () => {
    // Update rawResults with the fresh data
    handleNewResults(freshRawResults);
    // Set freshRawResults back to null
    setFreshRawResults(null)
  }

  const displayLoadingButton = (
    handleResultsRefresh,
    styles,
    isFetchingARAStatus,
    loadingIcon,
    ResultsAvailableIcon,
    showDisclaimer) => {

    if(freshRawResults === null && (isFetchingARAStatus || isFetchingResults)) {
      return(
        <div className={styles.loadingButtonContainer}>
          <button className={`${styles.loadingButton} ${styles.inactive}`}>
            <img src={loadingIcon} className={styles.loadingButtonIcon} alt="results button loading icon"/>
            Calculating
          </button>
        </div>
      )
    }

    if(freshRawResults !== null) {
      return (
        <div className={styles.loadingButtonContainer}>
          <button onClick={()=>{handleResultsRefresh()}} className={`${styles.loadingButton} ${styles.active}`}>
            {
              (isFetchingARAStatus) &&
              <img src={loadingIcon} className={styles.loadingButtonIcon} alt="results button loading icon"/>
            }
            {
              !isFetchingARAStatus &&
              ResultsAvailableIcon
            }
            Load New Results
          </button>
          {
            showDisclaimer &&
            <p className={styles.refreshDisclaimer}>Please note that refreshing this page may cause the order of answers to change.<br/>Results you have already viewed may also be updated with new data.</p>
          }
        </div>
      )
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <EvidenceModal
        isOpen={evidenceOpen}
        onClose={()=>handleEvidenceModalClose()}
        className="evidence-modal"
        currentEvidence={currentEvidence}
        results={rawResults.current}
        title={evidenceTitle}
        edges={evidenceEdges}
      />
      <div className={styles.resultsList}>
        <Query results loading={isLoading} presetDisease={presetDisease} presetTypeID={presetQueryTypeID}/>
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
                onClearAll={()=>handleClearAllFilters(activeStringFilters, rawResults.current, originalResults.current)}
                activeFilters={activeFilters}
                availableTags={availableTags}
              />
              <div className={styles.resultsHeader}>
                <div className={styles.top}>
                  <div>
                    <h5>Results</h5>
                    {
                      formattedResults.length !== 0 &&
                      <p className={styles.resultsCount}>
                        Showing <span className={styles.range}>
                          <span className={styles.start}>{itemOffset + 1}</span>
                          -
                          <span>{endResultIndex}</span>
                        </span> of
                        <span className={styles.count}> {formattedResults.length} </span>
                        {
                          (formattedResults.length !== originalResults.current.length) &&
                          <span className={styles.total}>({originalResults.current.length}) </span>
                        }
                        <span> Results</span>
                      </p>
                    }
                  </div>
                  <div className={styles.right}>
                    {
                      displayLoadingButton(handleResultsRefresh, styles, isFetchingARAStatus, loadingIcon, <ResultsAvailableIcon/>, false)
                    }
                    {
                      !isFetchingARAStatus && !isFetchingResults &&
                      <CompleteIcon/>
                    }
                    <button
                      className={styles.shareButton}
                      onClick={()=>{setShareModalOpen(true)}}
                      >
                        <ShareIcon/>
                    </button>
                    <ShareModal
                      isOpen={shareModalOpen}
                      onClose={()=>setShareModalOpen(false)}
                      qid={currentQueryID}
                    />

                  </div>
                </div>
                {
                  activeFilters.length > 0 &&
                  <div className={styles.activeFilters}>
                    {
                      activeFilters.map((activeFilter, i)=> {
                        return(
                          <span key={i} className={`${styles.filterTag} ${activeFilter.type}`}>
                            { getSelectedFilterDisplay(activeFilter) }
                            <span className={styles.close} onClick={()=>{handleFilter(activeFilter)}}><CloseIcon/></span>
                          </span>
                        )
                      })
                    }
                  </div>
                }
              </div>
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
                            type={storedQuery.type}
                            item={item}
                            activateEvidence={(evidence, rawEdges)=>activateEvidence(evidence, rawEdges)}
                            activeStringFilters={activeStringFilters}
                          />
                        )
                      })
                    }
                  </div>
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
                      handlePageClick({selected: 0});
                    }}
                    noanimate
                    >
                    <option value="5" key="0">5</option>
                    <option value="10" key="1">10</option>
                    <option value="20" key="2">20</option>
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
              {
                displayLoadingButton(handleResultsRefresh, styles, isFetchingARAStatus, loadingIcon, <ResultsAvailableIcon/>, true)
              }
            </>
          }
        </div>
      </div>
      {blocker ? <NavConfirmationPromptModal blocker={blocker} /> : null}
    </QueryClientProvider>
  );
}

export default ResultsList;
