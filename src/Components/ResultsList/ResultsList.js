import React, { useState, useEffect, useRef } from "react";
import styles from './ResultsList.module.scss';
import Checkbox from "../FormFields/Checkbox";
import Query3 from "../Query/Query3";
import ResultsFilter from "../ResultsFilter/ResultsFilter";
import ResultsItem from "../ResultsItem/ResultsItem";
import EvidenceModal from "../Modals/EvidenceModal";
import ShareModal from "../Modals/ShareModal";
import Tooltip from "../Tooltip/Tooltip";
import {ReactComponent as CloseIcon } from "../../Icons/Buttons/Close.svg"
import { currentQueryResultsID, currentResults }from "../../Redux/resultsSlice";
import { useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import ReactPaginate from 'react-paginate';
import { sortNameLowHigh, sortNameHighLow, sortEvidenceLowHigh, sortByHighlighted,
  // eslint-disable-next-line
  sortEvidenceHighLow, sortDateLowHigh, sortDateHighLow } from "../../Utilities/sortingFunctions";
  // eslint-disable-next-line
import { getSummarizedResults } from "../../Utilities/resultsFunctions";
import LoadingBar from "../LoadingBar/LoadingBar";
import { cloneDeep, isEqual } from "lodash";
import loadingButtonIcon from '../../Assets/Images/Loading/loading-white.png';
import {ReactComponent as ResultsAvailableIcon} from '../../Icons/Alerts/Checkmark.svg';
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import {ReactComponent as CompleteIcon} from '../../Icons/Alerts/Checkmark.svg';
import {ReactComponent as ShareIcon} from '../../Icons/Buttons/Export.svg';


const ResultsList = ({loading}) => {

  // URL search params
  const loadingParam = new URLSearchParams(window.location.search).get("loading")
  const queryIDParam = new URLSearchParams(window.location.search).get("q")

  loading = (loading) ? loading : false;
  loading = (loadingParam === 'true') ? true : loading;
  let resultsState = useSelector(currentResults);
  resultsState = (resultsState !== undefined && Object.keys(resultsState).length === 0) ? null : resultsState;
  loading = (resultsState && Object.keys(resultsState).length > 0) ? false : loading;

  // Bool, did the results return an error
  // eslint-disable-next-line
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
  // Bool, are the results currently sorted by name
  const [isSortedByName, setIsSortedByName] = useState(null);
  // Bool, are the results currently sorted by evidence count
  const [isSortedByEvidence, setIsSortedByEvidence] = useState(null);
  // Bool, is evidence modal open?
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  // String, active title of evidence modal
  const [evidenceTitle, setEvidenceTitle] = useState('All Evidence');
  // Array, edges represented in current evidence
  const [evidenceEdges, setEvidenceEdges] = useState([]);
  // Array, evidence relating to the item last clicked
  const [currentEvidence, setCurrentEvidence] = useState([]);
  // Bool, is the select all checkbox checked
  const [allSelected, setAllSelected] = useState(false);
  // Array, all selected items
  const [selectedItems, setSelectedItems] = useState([]);
  // Array, all highlighted items
  const [highlightedItems, setHighlightedItems] = useState([]);
  // Obj, original raw results from the BE
  const [rawResults, setRawResults] = useState(resultsState);
  // Obj, original raw results from the BE
  const [freshRawResults, setFreshRawResults] = useState(null);
  /* 
    Ref, used to track changes in results for useEffect with 'results' obj as dependency
    b/c react doesn't deep compare objects in useEffect hook
  */
  const prevRawResults = useRef(rawResults);
  // Array, full result set sorted by any active sorting, but NOT filtered
  const [sortedResults, setSortedResults] = useState([]);
  // Array, results formatted by any active filters, sorted by any active sorting
  const [formattedResults, setFormattedResults] = useState([]);
  // Array, results meant to display based on the pagination
  const [displayedResults, setDisplayedResults] = useState([]);
  // Int, last result item index
  const [endResultIndex, setEndResultIndex] = useState(9);
  // Int, number of pages
  const [pageCount, setPageCount] = useState(0);
  // Int, current page
  const [currentPage, setCurrentPage] = useState(0);
  // Int, current item offset (ex: on page 3, offset would be 30 based on itemsPerPage of 10)
  const [itemOffset, setItemOffset] = useState(0);
  // Array, currently active filters
  const [activeFilters, setActiveFilters] = useState([]);
  // Array, aras that have returned data
  const [returnedARAs, setReturnedARAs] = useState({aras: [], status: ''});
  // Bool, is fda tooltip currently active
  const [fdaTooltipActive, setFdaTooltipActive] = useState(false);

  /*
    Obj, {label: ''}, used to set input text, determined by results object
  */ 
  const [presetDisease, setPresetDisease] = useState(null);

  const [shareModalOpen, setShareModalOpen] = useState(false);

  const handleShareModalClose = () => {
    setShareModalOpen(false);
  }

  // Initialize queryClient for React Query to fetch results
  const queryClient = new QueryClient();
  // Int, how many items per page
  const itemsPerPage = 10;
  
  // Handle Page Offset
  useEffect(() => {    
    const endOffset = (itemOffset + itemsPerPage > formattedResults.length)
      ? formattedResults.length
      : itemOffset + itemsPerPage;
    setDisplayedResults(formattedResults.slice(itemOffset, endOffset));
    setEndResultIndex(endOffset);
    setPageCount(Math.ceil(formattedResults.length / itemsPerPage));
    if(endOffset !== 0)
      console.log(`Loaded items from ${itemOffset} to ${endOffset}`);
  }, [itemOffset, itemsPerPage, formattedResults]);

  // Handles direct page click
  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerPage) % formattedResults.length;
    console.log(
      `User requested page number ${event.selected}, which is offset ${newOffset}`
    );
    setCurrentPage(event.selected);
    setItemOffset(newOffset);
  };

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
      .then(response => response.json())
      .then(data => {
        console.log(data);
        if(data.data.aras.length > returnedARAs.aras.length) {
          console.log("New ARA returned, fetching new results...");
          console.log(`Old ARAs: ${returnedARAs.aras}, New ARAs: ${data.data.aras}`);
          setReturnedARAs(data.data);
          setIsFetchingResults(true);
        } else {
          console.log(`No new ARAs have returned data. Current status is: '${data.status}'`);
        }
        if(data.status === 'success' ) {
          setIsFetchingARAStatus(false);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.log(error)
      });
  }, { 
    refetchInterval: 7000,
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
      .then(response => response.json())
      .then(data => {
        console.log(data);
        // if we've already gotten results before, set newRawResults instead to 
        // prevent original results from being overwritten
        if(formattedResults.length > 0) {
          setFreshRawResults(data);
        } else {
          setRawResults(data);
        }
        setIsFetchingResults(false);
        // setIsError((data.status === 'error'));
      })
      .catch((error) => {
        console.log(error)
      });
  }, { 
    // refetchInterval: 7000,
    enabled: isFetchingResults,
    refetchOnWindowFocus: false
  });

  /*
    When the results change, which occurs when the React Query returns, handle the returned data
    based on the returned data's status.
  */ 
  useEffect(() => {
    // if we have no results, or the results aren't actually new, return
    if(rawResults == null || isEqual(rawResults, prevRawResults.current))
      return;

    // if results are new, set prevResults for future comparison
    prevRawResults.current = rawResults;

    let newResults = [];

    // if the status is not error, handle setting the results
    if(rawResults.status !== 'error' && rawResults.data.results !== undefined) 
      newResults = getSummarizedResults(rawResults.data, presetDisease, setPresetDisease);
    
      // set formatted results
      setFormattedResults(newResults);
      // set sorted results
      setSortedResults(newResults);

  }, [rawResults, presetDisease]);
  
  useEffect(() => {
    // we have results to show, set isLoading to false
    if (formattedResults.length > 0 && rawResults.status !== 'error') {
      setIsLoading(false);
    }
  }, [formattedResults, rawResults]);


  // Click handler for item select checkboxes 
  const handleSelected = (item) => {
    let items = [...selectedItems];
    let matchIndex = items.indexOf(item.id);
    if(matchIndex !== -1) {
      items.splice(matchIndex, 1);
      setSelectedItems(items);
      if(items.length <= 0)
        setAllSelected(false)
    } else {
      items.push(item.id);
      setSelectedItems(items);
    }
  }

  // Click handler for select all checkbox 
  const handleSelectAll = () => {
    let newSelectedItems = formattedResults.map((item)=>{
      return item.id;
    })
    if(!allSelected) {
      setSelectedItems(newSelectedItems);
      setAllSelected(true);
    } else {
      setSelectedItems([]);
      setAllSelected(false);
    }
  }

  // Click handler for the modal close button
  const handleEvidenceModalClose = () => {
    setEvidenceOpen(false);
  }

  // Click handler for opening the evidence modal and populating the evidence
  const activateEvidence = (evidence, edgesRepresented) => {
    if(edgesRepresented) {
      setEvidenceTitle(`Showing results for:`)
      setEvidenceEdges(edgesRepresented);
    } else {
      setEvidenceTitle('All Evidence');
      setEvidenceEdges([]);
    }
    setCurrentEvidence(evidence);
    setEvidenceOpen(true);
  }

  // Handle the addition and removal of individual filters
  const handleFilter = (filter) => {
    let index = activeFilters.findIndex(value => (value.tag === filter.tag));
    let newFilters = [];
    // Remove if we find a match
    if(index > -1) {
      // if the values also match, it's a real match
      if (activeFilters[index].value === filter.value) {
        newFilters = activeFilters.reduce((result, value, i) => {
          if(i !== index) {
            result.push(value);
          }
          return result;
        }, []);
        // otherwise just update the value
      } else {
        newFilters = activeFilters.map((value, i) => {
          if(i === index)
            value.value = filter.value;

          return value;
        });
      }
    // Otherwise add the new filter to the list
    } else {
      newFilters = [...activeFilters, filter];
    }
    setActiveFilters(newFilters);
  }

  // Output jsx for selected filters
  const getSelectedFilterDisplay = (element) => {
    let filterDisplay;
    switch (element.tag) {
    case "hum":
      filterDisplay = <div>Species: <span>Human</span></div>;
      break;
    case "evi":
      filterDisplay = <div>Minimum Evidence: <span>{element.value}</span></div>;
      break;
    case "fda":
      filterDisplay = <div><span>FDA Approved</span></div>;
      break;
    case "date":
      filterDisplay = <div>Date of Evidence: <span>{element.value[0]}-{element.value[1]}</span></div>;
      break;
    default:
      break;
    }
    return filterDisplay;
  }

  const handleClearAllFilters = () => {
    setActiveFilters([]);
  }

  // Handle the sorting 
  const handleSort = (sortName) => {
    let newSortedResults = cloneDeep(sortedResults);
    console.log(newSortedResults);
    switch (sortName) {
      case 'nameLowHigh':
        newSortedResults = sortNameLowHigh(newSortedResults);
        setIsSortedByName(true);
        setIsSortedByEvidence(null);
        break;
      case 'nameHighLow':
        newSortedResults = sortNameHighLow(newSortedResults);
        setIsSortedByName(false);
        setIsSortedByEvidence(null);
        break;
      case 'evidenceLowHigh':
        newSortedResults = sortEvidenceLowHigh(newSortedResults);
        setIsSortedByEvidence(false);
        setIsSortedByName(null);
        break;
      case 'evidenceHighLow':
        newSortedResults = sortEvidenceHighLow(newSortedResults);
        setIsSortedByEvidence(true);
        setIsSortedByName(null);
        break;
      // case 'dateLowHigh':
      //   newSortedResults = sortDateLowHigh(newSortedResults);
      //   setIsSortedByEvidence(null);
      //   setIsSortedByName(null);
      //   break;
      // case 'dateHighLow':
      //   newSortedResults = sortDateHighLow(newSortedResults);
      //   setIsSortedByEvidence(null);
      //   setIsSortedByName(null);
      //   break;
      default:
        break;
    }
    // if(selectedItems.length > 0) {
    //   newSortedResults = sortByHighlighted(newSortedResults, selectedItems);
    // }
    
    setSortedResults(newSortedResults);
    setFormattedResults(newSortedResults);
    handlePageClick({selected: 0});
  }

  // Handle highlighting of results
  const handleResultHighlight = () => {
    if(selectedItems.length <= 0) {
      console.log("No items selected, unable to highlight.")
      return;
    }
    
    let newSortedResults = (sortByHighlighted(sortedResults, selectedItems))
    setHighlightedItems(selectedItems);
    setSortedResults(newSortedResults);
    setFormattedResults(newSortedResults);
  }

  const handleResultsRefresh = () => {
    // Update rawResults with the fresh data
    setRawResults(freshRawResults);
    // Set freshRawResults back to null
    setFreshRawResults(null)
  }

  // Filter the results whenever the activated filters change 
  useEffect(() => {
    // If there are no active filters, get the full result set
    if(activeFilters.length <= 0) {
      setFormattedResults(sortedResults);
      return;
    }

    let filteredResults = [];
    let originalResults = [...sortedResults];
    /* 
      For each result, check against each filter. If a filter is triggered, 
      set addElement to false and don't add the element to the filtered results
    */  
    for(const element of originalResults) {
      let addElement = true;
      for(const filter of activeFilters) {
        switch (filter.tag) {
          // FDA approved filter 
          case 'fda':
            if(!element.fdaInfo)
              addElement = false;
            break;
          // Minimum evidence filter
          case 'evi':
            if(element.evidence.length < filter.value)
              addElement = false;
            break;
          // Date Range filter
          case 'date':
            // let lastPubYear = getLastPubYear(element.edge.last_publication_date);
            // if(lastPubYear < filter.value[0] || lastPubYear > filter.value[1])
            //   addElement = false;
            break;
          default:
            break;
        }
      }
      if(addElement) {
        filteredResults.push(element);
      }
    }
    // Set the formatted results to the newly filtered results
    setFormattedResults(filteredResults);

    /*
      triggers on filter change and on sorting change in order to allow user to change 
      the sorting on already filtered results
    */
  }, [activeFilters, sortedResults]);

  const displayLoadingButton = (
    handleResultsRefresh, 
    styles, 
    isFetchingARAStatus, 
    loadingButtonIcon, 
    ResultsAvailableIcon) => {

    if(freshRawResults === null && isFetchingARAStatus) {
      return(
        <div className={styles.loadingButtonContainer}>
          <button className={`${styles.loadingButton} ${styles.inactive}`}>
            <img src={loadingButtonIcon} className={styles.loadingButtonIcon} alt="results button loading icon"/>
            Loading
          </button>
        </div>
      )
    }
  
    if(freshRawResults !== null) {
      return (
        <div className={styles.loadingButtonContainer}>
          <button onClick={()=>{handleResultsRefresh()}} className={`${styles.loadingButton} ${styles.active}`}>
            {
              isFetchingARAStatus && 
              <img src={loadingButtonIcon} className={styles.loadingButtonIcon} alt="results button loading icon"/>
            }
            {
              !isFetchingARAStatus &&
              ResultsAvailableIcon
            }
            Load New Results
          </button>
          <p className={styles.refreshDisclaimer}>Please note that refreshing this page may cause the order of answers to change.<br/>Results you have already viewed may also be updated with new data.</p>
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
        results={rawResults}
        title={evidenceTitle}
        edges={evidenceEdges}
      />
      <div className={styles.resultsList}>
        <Query3 results loading={isLoading} presetDisease={presetDisease}/>
        <div className={`${styles.resultsContainer} container`}>
          {
            isLoading &&
            <LoadingBar 
              loading={isLoading}
              useIcon
            />
          }
          {
            !isLoading &&
            <>
              <ResultsFilter 
                startIndex={itemOffset+1} 
                endIndex={endResultIndex} 
                formattedCount={formattedResults.length}
                totalCount={sortedResults.length}
                onFilter={handleFilter}
                onHighlight={handleResultHighlight}
                onClearAll={handleClearAllFilters}
                activeFilters={activeFilters} 
              />
              <div className={styles.resultsHeader}>
                <div className={styles.top}>
                  <div>
                    <h5>Results</h5>
                    <p className={styles.resultsCount}>
                      Showing <span className={styles.range}>
                        <span className={styles.start}>{itemOffset + 1}</span>
                        -
                        <span>{endResultIndex}</span>
                      </span> of 
                      <span className={styles.count}> {formattedResults.length} </span>
                      {
                        (formattedResults.length !== sortedResults.length) &&
                        <span className={styles.total}>({sortedResults.length}) </span>
                      }
                      <span> Results</span>
                    </p>
                  </div>
                  <div className={styles.right}>
                    {
                      displayLoadingButton(handleResultsRefresh, styles, isFetchingARAStatus, loadingButtonIcon, <ResultsAvailableIcon/>)
                    }
                    {
                      isFetchingARAStatus && 
                      <img src={loadingIcon} className={styles.loadingIcon} alt="more results loading icon"/>
                    }
                    {
                      !isFetchingARAStatus && 
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
                      onClose={()=>handleShareModalClose()} 
                      qid={currentQueryID}
                    />

                  </div>
                </div>
                {
                  activeFilters.length > 0 &&
                  <div className={styles.activeFilters}>
                    {
                      activeFilters.map((element, i)=> {
                        return(
                          <span key={i} className={`${styles.filterTag} ${element.tag}`}>
                            { getSelectedFilterDisplay(element) }
                            <span className={styles.close} onClick={()=>{handleFilter(element)}}><CloseIcon/></span>
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
                      <div className={`${styles.checkboxContainer} ${styles.head}`}>
                        <Checkbox checked={allSelected} handleClick={()=>{handleSelectAll()}}/>
                      </div>
                      <div 
                        className={`${styles.head} ${styles.nameHead} ${isSortedByName ? styles.true : (isSortedByName === null) ? '' : styles.false}`} 
                        onClick={()=>{handleSort((isSortedByName)?'nameHighLow': 'nameLowHigh')}}
                        >
                        Name
                      </div>
                      <div 
                        className={`${styles.head} ${styles.fdaHead} fda-head`} 
                        onMouseEnter={()=>setFdaTooltipActive(true)} 
                        onMouseLeave={()=>setFdaTooltipActive(false)}
                        >
                        FDA
                        <Tooltip 
                        above
                          delay={350}
                          active={fdaTooltipActive} 
                          onClose={() => setFdaTooltipActive(false)}
                          text='Check marks in this column indicate drugs that have been approved by the FDA for the use of treating a specific disease or condition. This does not mean that the FDA has approved these drugs to treat the disease(s) you specified in your search.'
                          >
                        </Tooltip>
                      </div>
                      <div 
                        className={`${styles.head} ${styles.evidenceHead} ${isSortedByEvidence ? styles.true : (isSortedByEvidence === null) ? '': styles.false}`} 
                        onClick={()=>{handleSort((isSortedByEvidence)?'evidenceLowHigh': 'evidenceHighLow')}}
                        >
                        Evidence
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
                      displayedResults.map((item, i) => {
                        let checked = (selectedItems.length > 0 && selectedItems.includes(item.id)) ? true : false;
                        let highlighted = (highlightedItems.length > 0 && highlightedItems.includes(item)) ? true : false;
                        return (
                          <ResultsItem 
                            key={i} 
                            checked={checked}
                            highlighted={highlighted}
                            item={item} 
                            allSelected={allSelected}
                            handleSelected={()=>handleSelected(item)}
                            activateEvidence={(evidence, edgesRepresented)=>activateEvidence(evidence, edgesRepresented)} 
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
                    forcePage={currentPage}
                  />
                </div>
              }
              {
                displayLoadingButton(handleResultsRefresh, styles, isFetchingARAStatus, loadingButtonIcon, <ResultsAvailableIcon/>)
              }
            </>
          }
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default ResultsList;