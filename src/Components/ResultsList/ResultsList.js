import React, { useState, useEffect } from "react";
import Checkbox from "../FormFields/Checkbox";
import Query2 from "../Query/Query2";
import ResultsFilter from "../ResultsFilter/ResultsFilter";
import ResultsItem from "../ResultsItem/ResultsItem";
import Modal from "../Modals/Modal";
import { currentQuery, currentResultsQueryID, currentResults, setCurrentResults } from "../../Redux/store";
import { useSelector, useDispatch } from 'react-redux';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import ReactPaginate from 'react-paginate';


const ResultsList = ({loading}) => {

  // URL search params
  const loadingParam = new URLSearchParams(window.location.search).get("loading")
  
  // Initialize dispatch in order to send updates to the application state
  const dispatch = useDispatch();

  loading = (loading) ? loading : false;
  loading = (loadingParam === 'true') ? true : loading;
  let resultsState = useSelector(currentResults);
  resultsState = (Object.keys(resultsState).length === 0) ? null : resultsState;
  loading = (resultsState && Object.keys(resultsState).length > 0) ? false : loading;

  // Bool, did the results return an error
  const [isError, setIsError] = useState(false);
  // Bool, are the results still loading
  const [isLoading, setIsLoading] = useState(loading);
  // Bool, is evidence modal open?
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  // Int, current query id
  const [currentQueryID, setCurrentQueryID] = useState(useSelector(currentResultsQueryID).id);
  // Array, evidence relating to the item last clicked
  const [currentEvidence, setCurrentEvidence] = useState([]);
  // Bool, is the select all checkbox checked
  const [allSelected, setAllSelected] = useState(false);
  // Array, all selected items
  const [selectedItems, setSelectedItems] = useState([]);
  // Obj, original raw results from the BE
  const [results, setResults] = useState(resultsState);
  // Array, results formatted by any active filters, sorted by any active sorting
  const [formattedResults, setFormattedResults] = useState([]);
  // Array, results meant to display based on the pagination
  const [displayedResults, setDisplayedResults] = useState([]);
  // Int, represents results progress bar
  const [resultsProgress, setResultsProgress] = useState(1);
  // Bool, alternates opacity of progress bar while loading
  const [resultsBarOpacity, setResultsBarOpacity] = useState(false);
  const [endResultIndex, setEndResultIndex] = useState(9);
  // Int, number of pages
  const [pageCount, setPageCount] = useState(0);
  // Int, current item offset (ex: on page 3, offset would be 30 based on itemsPerPage of 10)
  const [itemOffset, setItemOffset] = useState(0);
  // Array, currently active filters
  const [activeFilters, setActiveFilters] = useState([]);
  // Str, class for results progress bar opacity
  var resultsBarOpacityClass = (resultsBarOpacity) ? 'dark': 'light';
  // Initialize queryClient for React Query to fetch results
  const queryClient = new QueryClient();
  // Int, how many items per page
  const itemsPerPage = 10;
  
  // 
  useEffect(() => {
    // if(formattedResults.length === 0)
    //   return
    
    const endOffset = (itemOffset + itemsPerPage > formattedResults.length)
      ? formattedResults.length
      : itemOffset + itemsPerPage;
    setDisplayedResults(formattedResults.slice(itemOffset, endOffset));
    setEndResultIndex(endOffset);
    setPageCount(Math.ceil(formattedResults.length / itemsPerPage));
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
    console.log(results);
    // if we're still loading, maintain that state
    if(results === null)
      return;

    // if the status is no longer 'running', set loading to false
    if(results.status !== 'running')
      setIsLoading(false);
    
    // if the status is 'done', handle setting the results
    if(results.status === 'done') {
      let newResults = getSummarizedResults(results);
      console.log(newResults);
      // set formatted results
      setFormattedResults(newResults);
      // update app state for raw results
      dispatch(setCurrentResults(results));
    }
    // setIsError((results.status === 'error'));
  }, [results]);

  const getSummarizedResults = (results) => {
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

  // Filter the results whenever the activated filters change 
  useEffect(() => {
    console.log(activeFilters);
    // If there are no active filters, get the full result set
    if(activeFilters.length <= 0) {
      setFormattedResults(getSummarizedResults(results));
      return;
    }

    let filteredResults = [];
    let originalResults = getSummarizedResults(results);
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
  }, [activeFilters]);

  const exampleKPResults = [
    {name: 'BTE', value: '54', error: false},
    {name: 'CHP', value: '0', error: false},
    {name: 'COHD', value: '0', error: false},
    {name: 'RTX-KG2', value: '6', error: false},
    {name: 'NGD', value: '0', error: false},
    {name: 'MolePro', value: '3', error: false},
    {name: 'GeneticsKP', value: '0', error: true},
  ]
  
  useEffect(() => {
    if(selectedItems.length <= 0)
      return;
    console.log(selectedItems)
  }, [selectedItems]);

  // Spoofs progress bar
  useEffect(() => {
    if(resultsProgress >= 100) 
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
  }, [resultsProgress]);

  // Alternates progress bar opacity class on set timeout
  useEffect(() => {
    if(!isLoading) 
      return;

    let timeout = 1500;
    const timer = setTimeout(() => {
      setResultsBarOpacity(!resultsBarOpacity);
    }, timeout);
    return () => clearTimeout(timer);
  }, [resultsBarOpacity]);

  return (
    <QueryClientProvider client={queryClient}>
      <Modal isOpen={evidenceOpen} onClose={()=>handleModalClose()} className="evidence-modal">
        <h5>Evidence</h5>
        <div className="table-head">
          <div className="head title">Title</div>
          <div className="head abstract">Abstract</div>
          <div className="head date">Date</div>
        </div>
        <div className="table-body">
          {
            currentEvidence.length > 0 &&
            currentEvidence.map((item, i)=> {
              return (
                <div className="evidence-item" key={i}>
                  <span className="title">
                    {item.title && item.url && <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a> }
                  </span>
                  <span className="abstract">
                    {item.abstract && item.abstract}
                    {item.url && <a href={item.url} target="_blank" rel="noreferrer">Read More</a>}          
                  </span>
                  <span className="pubdate">
                    {item.pubdate && item.pubdate }          
                  </span>
                </div>
              )
            })
          } 
          {
            currentEvidence.length <= 0 &&
            <p>No evidence is currently available for this item.</p>
          }
        </div>
      </Modal>
      <div className="results-list">
        <Query2 results loading/>
        <div className="results-container">
          {
            isLoading &&
            <div className="loading-bar">
              <div className="bar-outer">
                <div className={`bar-inner ${resultsBarOpacityClass}`} style={{width: `${resultsProgress}%`}}>
                </div>
              </div>
            </div>
          }
          {
            !isLoading &&
            <div className="table-container">
              <ResultsFilter 
                startIndex={itemOffset+1} 
                endIndex={endResultIndex} 
                totalCount={formattedResults.length}
                onSort={()=>{}} 
                onFilter={handleFilter} />
              <div className="results-table">
                <div className="table-body">
                  <div className="table-head result">
                      <div className="checkbox-container checkbox-head">
                        <Checkbox checked={allSelected} handleClick={()=>{handleSelectAll(formattedResults);}}/>
                      </div>
                      <div className="name-head head">Name</div>
                      <div className="fda-head head">FDA</div>
                      <div className="evidence-head head">Evidence</div>
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

                      return(
                        <ResultsItem 
                          key={i} 
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
          <div className="kps">
            {/* <h6>Knowledge Providers</h6>
            <p>
              { isLoading && "Estimated Loading Time: " } 
              { !isLoading && "Found in " } 
              <span className="time">1.8 seconds</span></p> */}
            <ul className="kp-list">
            {
              // exampleKPResults.map((item, index)=> {
              //   let itemClass = "kp";
              //   itemClass += (item.error) ? " error" : "";
              //   itemClass += (item.value < 1) ? " no-results" : "";
              //   return(
              //     <li key={index} className={`${itemClass}`}>
              //       <span className="kp-name">{item.name}</span>
              //       <span className="kp-value sub-one">{item.value}</span>
              //     </li>
              //   )
              // })
            }
            </ul>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default ResultsList;