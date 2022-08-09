import React, { useState, useEffect, useRef } from "react";
import styles from './ResultsList.module.scss';
import Checkbox from "../FormFields/Checkbox";
import Query3 from "../Query/Query3";
import ResultsFilter from "../ResultsFilter/ResultsFilter";
import ResultsSorting from "../ResultsSorting/ResultsSorting";
import ResultsItem from "../ResultsItem/ResultsItem";
import EvidenceModal from "../Modals/EvidenceModal";
import {ReactComponent as CloseIcon } from "../../Icons/Buttons/Close.svg"
import { currentQueryResultsID, currentResults }from "../../Redux/resultsSlice";
import { useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import ReactPaginate from 'react-paginate';
import isEqual from 'lodash/isEqual';
import { sortNameLowHigh, sortNameHighLow, sortEvidenceLowHigh, sortByHighlighted,
  sortEvidenceHighLow, sortDateLowHigh, sortDateHighLow } from "../../Utilities/sortingFunctions";
import { getLastPubYear, capitalizeAllWords, capitalizeFirstLetter, formatBiolinkPredicate } from "../../Utilities/utilities";
import LoadingBar from "../LoadingBar/LoadingBar";
import { cloneDeep } from "lodash";


const ResultsList = ({loading}) => {

  // URL search params
  const loadingParam = new URLSearchParams(window.location.search).get("loading")

  loading = (loading) ? loading : false;
  loading = (loadingParam === 'true') ? true : loading;
  let resultsState = useSelector(currentResults);
  resultsState = (resultsState !== undefined && Object.keys(resultsState).length === 0) ? null : resultsState;
  loading = (resultsState && Object.keys(resultsState).length > 0) ? false : loading;

  // Bool, did the results return an error
  const [isError, setIsError] = useState(false);
  // Bool, are the results still loading
  const [isLoading, setIsLoading] = useState(loading);
  // Bool, should results be fetched
  const [isFetchingARAStatus, setIsFetchingARAStatus] = useState(loading);
  // Bool, should results be fetched
  const [isFetchingResults, setIsFetchingResults] = useState(false);
  // Bool, should results be fetched
  const [shouldRetrieveFreshResults, setShouldRetrieveFreshResults] = useState(true);
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
  // Int, current item offset (ex: on page 3, offset would be 30 based on itemsPerPage of 10)
  const [itemOffset, setItemOffset] = useState(0);
  // Array, currently active filters
  const [activeFilters, setActiveFilters] = useState([]);

  const [returnedARAs, setReturnedARAs] = useState({aras: [], status: ''});

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
    setItemOffset(newOffset);
  };

  // React Query call for status of results
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
        if(data.status === 'success') {
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
    const response = await fetch('/creative_result', requestOptions)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        // if we've already gotten results before, set newRawResults instead to prevent original results from being overwritten
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

  // TEST React Query call for results from static file
  // const testResultsData = useQuery('testResultsData', async () => {
  //   console.log(currentQueryID);

  //   if(!currentQueryID || !isLoading)
  //     return;

  //   let queryIDJson = JSON.stringify({qid: currentQueryID});

  //   const requestOptions = {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  //   };

  //   let data = require('../../Testing/something.json');
  //   console.log(data);
  //   setResults(data.data);
  //   setIsError((data.status === 'error'));
  //   // const response = await fetch('something.json', requestOptions)
  //   //   .then(response => response.json())
  //   //   .then(data => {
  //   //     console.log(data);
  //   //     // setResults(data);
  //   //     // setIsError((data.status === 'error'));
  //   //   })
  //   //   .catch((error) => {
  //   //     console.log(error)
  //   //   });
  // }, { 
  //   refetchInterval: 7000,
  //   enabled: isLoading,
  //   refetchOnWindowFocus: false
  // });

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
      newResults = getSummarizedResults(rawResults.data);
    
      // set formatted results
      setFormattedResults(newResults);
      // set sorted results
      setSortedResults(newResults);

      // update app state for raw results
      // dispatch(setCurrentResults(results));

  }, [rawResults]);
  
  useEffect(() => {
    // we have results to show, set isLoading to false
    if (formattedResults.length > 0 && rawResults.status !== 'error') {
      setIsLoading(false);
    }
  }, [formattedResults]);

  // Take raw results and return properly summarized results
  const getSummarizedResults = (results) => {
    if (results === null || results === undefined)
      return [];

    let newSummarizedResults = [];
    
    // // for each individual result item 
    for(const item of results.results) {
      // Get the object node's name
      let objectNodeName = getNodeByCurie(item.object, results).names[0]; 
      // Get the subject node's name
      let subjectNode = getNodeByCurie(item.subject, results);
      // Get the subject node's description
      let description = (subjectNode.description) ? subjectNode.description[0] : '';
      // Get the subject node's fda approval status 
      let fdaInfo = (subjectNode.fda_info) ? subjectNode.fda_info : false;
      // Get a list of properly formatted paths (turn the path ids into their actual path objects)
      let formattedPaths = [];
      formattedPaths = getFormattedPaths(item.paths, results);
      let itemName = (item.drug_name !== null) ? capitalizeFirstLetter(item.drug_name) : capitalizeAllWords(subjectNode.names[0]);
      let formattedItem = {
        name: itemName,
        paths: formattedPaths,
        object: capitalizeAllWords(objectNodeName),
        description: description,
        evidence: getFormattedEvidence(formattedPaths, results),
        fdaInfo: fdaInfo
      }
      newSummarizedResults.push(formattedItem);
    }
    return newSummarizedResults;
  }

  // search the list of nodes for a particular curie, then return that node object if found
  const getNodeByCurie = (curie, results) => {
    if(results.nodes[curie] === undefined)
      return {};
      
    return results.nodes[curie];
  }
  // search the list of edges for a particular id, then return that edge object if found
  const getEdgeByID = (id, results) => {
    if(results.edges[id] === undefined)
      return {};

    return results.edges[id];
  }
  // search the list of publications for a particular id, then return that publication object if found
  const getPubByID = (id, results) => {
    if(results.publications[id] === undefined)
      return {};
    
    return results.publications[id];
  }
  const getFormattedPaths = (rawPathIds, results) => {
    let formattedPaths = [];
    for(const id of rawPathIds) {
      let formattedPath = results.paths[id];
      if(formattedPath) {
        for(let i = 0; i < formattedPath.subgraph.length; i++) {
          if(i % 2 === 0) {
            formattedPath.subgraph[i] = getNodeByCurie(formattedPath.subgraph[i], results);
          } else {
            formattedPath.subgraph[i] = getEdgeByID(formattedPath.subgraph[i], results);
          }
        }
        formattedPaths.push(formattedPath);
      }
    }
    return formattedPaths;
  }
  const getFormattedEvidence = (paths, results) => {
    let formattedEvidence = [];
    for(const path of paths) {
      for(const subgraph of path.subgraph) {
        if(subgraph.publications && subgraph.publications.length > 0)
          for(const pubID of subgraph.publications) {
            let publication = getPubByID(pubID, results);
            let object = getNodeByCurie(subgraph.object, results);
            let subject = getNodeByCurie(subgraph.subject, results);
            let predicate = formatBiolinkPredicate(subgraph.predicates[0]);
            publication.edge = {
              subject: capitalizeAllWords(subject.names[0]),
              predicate: predicate,
              object: capitalizeAllWords(object.names[0])
            };
            formattedEvidence.push(publication);
          }
      }
    }
    // console.log(formattedEvidence);

    return formattedEvidence;
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
    // switch (sortName) {
    //   case 'nameLowHigh':
    //     newSortedResults = sortNameLowHigh(newSortedResults);
    //     setIsSortedByName(true);
    //     setIsSortedByEvidence(null);
    //     break;
    //   case 'nameHighLow':
    //     newSortedResults = sortNameHighLow(newSortedResults);
    //     setIsSortedByName(false);
    //     setIsSortedByEvidence(null);
    //     break;
    //   case 'evidenceLowHigh':
    //     newSortedResults = sortEvidenceLowHigh(newSortedResults);
    //     setIsSortedByEvidence(true);
    //     setIsSortedByName(null);
    //     break;
    //   case 'evidenceHighLow':
    //     newSortedResults = sortEvidenceHighLow(newSortedResults);
    //     setIsSortedByEvidence(false);
    //     setIsSortedByName(null);
    //     break;
    //   case 'dateLowHigh':
    //     newSortedResults = sortDateLowHigh(newSortedResults);
    //     setIsSortedByEvidence(null);
    //     setIsSortedByName(null);
    //     break;
    //   case 'dateHighLow':
    //     newSortedResults = sortDateHighLow(newSortedResults);
    //     setIsSortedByEvidence(null);
    //     setIsSortedByName(null);
    //     break;
    //   default:
    //     break;
    // }
    // if(selectedItems.length > 0) {
    //   newSortedResults = sortByHighlighted(newSortedResults, selectedItems);
    // }
    // setSortedResults(newSortedResults);
    // setFormattedResults(newSortedResults);
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
    // // If there are no active filters, get the full result set
    // if(activeFilters.length <= 0) {
    //   setFormattedResults(sortedResults);
    //   return;
    // }

    // let filteredResults = [];
    // let originalResults = [...sortedResults];
    // /* 
    //   For each result, check against each filter. If a filter is triggered, 
    //   set addElement to false and don't add the element to the filtered results
    // */  
    // originalResults.forEach((element) => {
    //   let addElement = true;
    //   activeFilters.forEach((filter) => {
    //     switch (filter.tag) {
    //       // FDA approved filter 
    //       case 'fda':
    //         if(element.subject.fda_info === null)
    //           addElement = false;
    //         break;
    //       // Minimum evidence filter
    //       case 'evi':
    //         if(element.edge.evidence.length < filter.value)
    //           addElement = false;
    //         break;
    //       // Date Range filter
    //       case 'date':
    //         let lastPubYear = getLastPubYear(element.edge.last_publication_date);
    //         if(lastPubYear < filter.value[0] || lastPubYear > filter.value[1])
    //           addElement = false;
    //         break;
    //       default:
    //         break;
    //     }
    //   })
    //   if(addElement) {
    //     filteredResults.push(element);
    //   }
    // })
    // // Set the formatted results to the newly filtered results
    // setFormattedResults(filteredResults);

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

  return (
    <QueryClientProvider client={queryClient}>
      <EvidenceModal 
        isOpen={evidenceOpen} 
        onClose={()=>handleModalClose()}
        className="evidence-modal"
        currentEvidence={currentEvidence}
        results={rawResults}
      />
      <div className={styles.resultsList}>
        <Query3 results loading/>
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
                    {
                      freshRawResults !== null && 
                      <button onClick={()=>{handleResultsRefresh()}}>New Results Availible, click to Refresh</button>
                    }
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
                  <ResultsSorting 
                    onSort={handleSort} 
                  />
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
                        <Checkbox checked={allSelected} handleClick={()=>{handleSelectAll(formattedResults);}}/>
                      </div>
                      <div 
                        className={`${styles.head} ${styles.nameHead} ${isSortedByName ? styles.true : (isSortedByName === null) ? '' : styles.false}`} 
                        onClick={()=>{handleSort((isSortedByName)?'nameHighLow': 'nameLowHigh')}}
                        >
                        Name
                      </div>
                      <div className={`${styles.head} ${styles.fdaHead}`}>FDA</div>
                      <div 
                        className={`${styles.head} ${styles.evidenceHead} ${isSortedByEvidence ? styles.true : (isSortedByEvidence === null) ? '': styles.false}`} 
                        onClick={()=>{handleSort((isSortedByEvidence)?'evidenceHighLow': 'evidenceLowHigh')}}
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
                      <h5 className={styles.errorText}>No results could be found when processing your query. Please try again.</h5>
                    }
                    {
                      !isLoading &&
                      !isError &&
                      displayedResults.length > 0 && 
                      displayedResults.map((item, i) => {
                        let checked = (selectedItems.length > 0 && selectedItems.includes(item)) ? true : false;
                        let highlighted = (highlightedItems.length > 0 && highlightedItems.includes(item)) ? true : false;
                        let hasName = (item.name !== null && item.name !== undefined);
                        // if(hasName) {
                          return(
                            <ResultsItem 
                              key={i} 
                              checked={checked}
                              highlighted={highlighted}
                              item={item} 
                              allSelected={allSelected}
                              handleSelected={()=>handleSelected(item)}
                              activateEvidence={()=>activateEvidence(item.evidence)} 
                            />
                          )
                        // } else {
                        //   return '';
                        // }
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
                  />
                </div>
              }
            </>
          }
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default ResultsList;