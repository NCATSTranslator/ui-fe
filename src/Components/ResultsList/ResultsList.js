import React, { useState, useEffect, useRef } from "react";
import Checkbox from "../FormFields/Checkbox";
import Query2 from "../Query/Query2";
import ResultsFilter from "../ResultsFilter/ResultsFilter";
import ResultsItem from "../ResultsItem/ResultsItem";
import EvidenceModal from "../Modals/EvidenceModal";
import {ReactComponent as CloseIcon } from "../../Icons/Buttons/Close.svg"
import { currentQueryResultsID, currentResults }from "../../Redux/resultsSlice";
import { useSelector, useDispatch } from 'react-redux';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import ReactPaginate from 'react-paginate';
import isEqual from 'lodash/isEqual';
import { sortNameLowHigh, sortNameHighLow, sortEvidenceLowHigh, sortByHighlighted,
  sortEvidenceHighLow, sortDateLowHigh, sortDateHighLow } from "../../Utilities/sortingFunctions";


const ResultsList = ({loading}) => {

  // URL search params
  const loadingParam = new URLSearchParams(window.location.search).get("loading")
  
  // Initialize dispatch in order to send updates to the application state
  const dispatch = useDispatch();

  loading = (loading) ? loading : false;
  loading = (loadingParam === 'true') ? true : loading;
  let resultsState = useSelector(currentResults);
  resultsState = (resultsState !== undefined && Object.keys(resultsState).length === 0) ? null : resultsState;
  loading = (resultsState && Object.keys(resultsState).length > 0) ? false : loading;

  // Bool, did the results return an error
  const [isError, setIsError] = useState(false);
  // Bool, are the results still loading
  const [isLoading, setIsLoading] = useState(loading);
  // Bool, are the results currently sorted by name
  const [isSortedByName, setIsSortedByName] = useState(null);
  // Bool, are the results currently sorted by evidence count
  const [isSortedByEvidence, setIsSortedByEvidence] = useState(null);
  // Bool, is evidence modal open?
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  // Int, current query id
  const currentQueryID = useSelector(currentQueryResultsID);
  // Array, evidence relating to the item last clicked
  const [currentEvidence, setCurrentEvidence] = useState([]);
  // Bool, is the select all checkbox checked
  const [allSelected, setAllSelected] = useState(false);
  // Array, all selected items
  const [selectedItems, setSelectedItems] = useState([]);
  // Array, all highlighted items
  const [highlightedItems, setHighlightedItems] = useState([]);
  // Obj, original raw results from the BE
  const [results, setResults] = useState(resultsState);
  /* 
    Ref, used to track changes in results for useEffect with 'results' obj as dependency
    b/c react doesn't deep compare objects in useEffect hook
  */
  const prevResults = useRef(results);
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
  // Int, current item offset (ex: on page 3, offset would be 30 based on itemsPerPage of 10)
  const [itemOffset, setItemOffset] = useState(0);
  // Array, currently active filters
  const [activeFilters, setActiveFilters] = useState([]);

  // Int, represents results progress bar
  const [resultsProgress, setResultsProgress] = useState(1);
  // Bool, alternates opacity of progress bar while loading
  const [resultsBarOpacity, setResultsBarOpacity] = useState(false);
  // Str, class for results progress bar opacity
  var resultsBarOpacityClass = (resultsBarOpacity) ? 'dark': 'light';
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
    if(displayedResults.length > 0)
      console.log(`Loaded items from ${itemOffset} to ${endOffset}`);
  }, [itemOffset, itemsPerPage, formattedResults]);

  // Handles direct page click
  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerPage) % formattedResults.length;
    console.log(
      `User requested page number ${event.selected}, which is offset ${newOffset}`
    );
    setItemOffset(newOffset);
  };

  // React Query call for results
  const resultsData = useQuery('resultsData', async () => {
    console.log(isLoading)
    console.log(currentQueryID);

    if(!currentQueryID || !isLoading)
      return;

    let queryIDJson = JSON.stringify({qid: currentQueryID});

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: queryIDJson
    };
    const response = await fetch('/result', requestOptions)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setResults(data);
        setIsError((data.status === 'error'));
      });
  }, { 
    refetchInterval: 7000,
    enabled: isLoading,
    refetchOnWindowFocus: false
  });

  /*
    When the results change, which occurs when the React Query returns, handle the returned data
    based on the returned data's status.
  */ 
  useEffect(() => {
    // if we have no results, or the results aren't actually new, return
    if(results == null || isEqual(results, prevResults.current))
      return;

    // if results are new, set prevResults for future comparison
    prevResults.current = results;

    // if the status is no longer 'running', set loading to false
    if(results.status !== 'running')
      setIsLoading(false);
    
    // if the status is 'done', handle setting the results
    if(results.status === 'done') {
      let newResults = getSummarizedResults(results);
      // set formatted results
      setFormattedResults(newResults);
      // set formatted results
      setSortedResults(newResults);
      // update app state for raw results
      // dispatch(setCurrentResults(results));
    }
    // setIsError((results.status === 'error'));
  }, [results]);

  // Return summarized results
  const getSummarizedResults = (results) => {
    if (results === null)
      return [];
  
    return results.summary;
  }

  // Click handler for item select checkboxes 
  const handleSelected = (item) => {
    let match = false;
    let matchIndex = -1;
    let items = [...selectedItems];
    items.map((element, i) => {         
      if(element.subject === item.subject && element.predicate === item.predicate) {
        match = true;
        matchIndex = i;
      }
      return element;
    });
    // if there's no match, add the item to the array of selected items
    if(!match) {
      items.push(item);
      setSelectedItems(items);
    // if there is a match, remove the item from the array of selected items
    } else {
      items.splice(matchIndex, 1);
      setSelectedItems(items);
      if(items.length <= 0)
        setAllSelected(false)
    }
  }

  // Click handler for select all checkbox 
  const handleSelectAll = (items) => {
    if(!allSelected) {
      setSelectedItems(items);
      setAllSelected(true);
    } else {
      setSelectedItems([]);
      setAllSelected(false);
    }
  }

  // Click handler for the modal close button
  const handleModalClose = () => {
    setEvidenceOpen(false);
  }

  // Click handler for opening the evidence modal and populating the evidence
  const activateEvidence = (evidence) => {
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
          if(i!=index) {
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
    default:
      break;
    }
    return filterDisplay;
  }

  // Handle the sorting 
  const handleSort = (sortName) => {
    let newSortedResults = [...sortedResults]
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
        setIsSortedByEvidence(true);
        setIsSortedByName(null);
        break;
      case 'evidenceHighLow':
        newSortedResults = sortEvidenceHighLow(newSortedResults);
        setIsSortedByEvidence(false);
        setIsSortedByName(null);
        break;
      case 'dateLowHigh':
        newSortedResults = sortDateLowHigh(newSortedResults);
        setIsSortedByEvidence(null);
        setIsSortedByName(null);
        break;
      case 'dateHighLow':
        newSortedResults = sortDateHighLow(newSortedResults);
        setIsSortedByEvidence(null);
        setIsSortedByName(null);
        break;
      default:
        break;
    }
    if(selectedItems.length > 0) {
      newSortedResults = sortByHighlighted(newSortedResults, selectedItems);
    }
    setSortedResults(newSortedResults);
    setFormattedResults(newSortedResults);
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

  // Filter the results whenever the activated filters change 
  useEffect(() => {
    console.log(activeFilters);
    console.log(sortedResults);
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
    originalResults.forEach((element) => {
      let addElement = true;
      activeFilters.forEach((filter) => {
        switch (filter.tag) {
          // FDA approved filter 
          case 'fda':
            if(element.subject.fda_info === null)
              addElement = false;
            break;
          // Minimum evidence filter
          case 'evi':
            if(element.edge.evidence.length < filter.value)
              addElement = false;
            break;
          default:
            break;
        }
      })
      if(addElement) {
        filteredResults.push(element);
      }
    })
    // Set the formatted results to the newly filtered results
    setFormattedResults(filteredResults);

    /*
      triggers on filter change and on sorting change in order to allow user to change 
      the sorting on already filtered results
    */
  }, [activeFilters, sortedResults]);

  useEffect(() => {
    if(selectedItems.length <= 0)
      return;
    console.log(selectedItems)
  }, [selectedItems]);

  // Spoofs progress bar
  useEffect(() => {
    if(resultsProgress >= 100 || !isLoading) 
      return;

    let randomTimeout = Math.random() * (3000 - 500) + 500;
    const timer = setTimeout(() => {
      let newProgress = resultsProgress + 10;
      if(newProgress < 100) {
        setResultsProgress(newProgress);
      } else {
        setResultsProgress(100);
      }
    }, randomTimeout);
    return () => clearTimeout(timer);
  }, [resultsProgress, isLoading]);

  // Alternates progress bar opacity class on set timeout
  useEffect(() => {
    if(!isLoading) 
      return;

    let timeout = 1500;
    const timer = setTimeout(() => {
      setResultsBarOpacity(!resultsBarOpacity);
    }, timeout);
    return () => clearTimeout(timer);
  }, [resultsBarOpacity, isLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <EvidenceModal 
        isOpen={evidenceOpen} 
        onClose={()=>handleModalClose()}
        className="evidence-modal"
        currentEvidence={currentEvidence}
        results={results}
      />
      <div className="results-list">
        <Query2 results loading/>
        <div className="results-container">
          {
            isLoading &&
            <div className="loading-bar">
              <div className="bar-outer">
                <div className={`bar-inner ${resultsBarOpacityClass}`} style={{width: `${resultsProgress}%`}}></div>
              </div>
            </div>
          }
          {
            !isLoading &&
            <div className="table-container">
              <ResultsFilter 
                startIndex={itemOffset+1} 
                endIndex={endResultIndex} 
                formattedCount={formattedResults.length}
                totalCount={sortedResults.length}
                onSort={handleSort} 
                onFilter={handleFilter}
                onHighlight={handleResultHighlight}
                activeFilters={activeFilters} />
              {
                activeFilters.length > 0 &&
                <div className="active-filters">
                  {
                    activeFilters.map((element, i)=> {
                      return(
                        <span key={i} className={`filter-tag ${element.tag}`}>
                          { getSelectedFilterDisplay(element) }
                          <span className="close" onClick={()=>{handleFilter(element)}}><CloseIcon/></span>
                        </span>
                      )
                    })
                  }
                </div>
              }
              <div className="results-table">
                <div className="table-body">
                  <div className="table-head result">
                    <div className="checkbox-container checkbox-head">
                      <Checkbox checked={allSelected} handleClick={()=>{handleSelectAll(formattedResults);}}/>
                    </div>
                    <div className={`name-head head ${isSortedByName}`} onClick={()=>{handleSort((isSortedByName)?'nameHighLow': 'nameLowHigh')}}>Name</div>
                    <div className="fda-head head">FDA</div>
                    <div className={`evidence-head head ${isSortedByEvidence}`} onClick={()=>{handleSort((isSortedByEvidence)?'evidenceHighLow': 'evidenceLowHigh')}}>Evidence</div>
                    <div className="tags-head head">Tags</div>
                  </div>
                  {
                    isError &&
                    <h5>There was an error when processing your query. Please try again.</h5>
                  }
                  {
                    !isLoading &&
                    !isError &&
                    displayedResults.length > 0 && 
                    displayedResults.map((item, i) => {
                      let checked = (selectedItems.length > 0 && selectedItems.includes(item)) ? true : false;
                      let highlighted = (highlightedItems.length > 0 && highlightedItems.includes(item)) ? true : false;
                      return(
                        <ResultsItem 
                          key={i} 
                          checked={checked}
                          highlighted={highlighted}
                          item={item} 
                          staticNode={results.static_node} 
                          allSelected={allSelected}
                          handleSelected={()=>handleSelected(item)}
                          activateEvidence={()=>activateEvidence(item.edge.evidence)} 
                        />
                      )
                    })
                  }
                </div>
              </div>
              {
                formattedResults.length > 0 && 
                <div className="pagination">
                  <ReactPaginate
                    breakLabel="..."
                    nextLabel="Next"
                    previousLabel="Previous"
                    onPageChange={handlePageClick}
                    pageRangeDisplayed={5}
                    marginPagesDisplayed={1}
                    pageCount={pageCount}
                    renderOnZeroPageCount={null}
                    className="page-nums"
                    pageClassName="page-num"
                    activeClassName="current"
                    previousLinkClassName="prev button"
                    nextLinkClassName="next button"
                  />
                </div>
              }
            </div>
          }
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default ResultsList;