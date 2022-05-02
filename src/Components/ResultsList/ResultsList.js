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
  
  const dispatch = useDispatch();

  loading = (loading) ? loading : false;
  loading = (loadingParam === 'true') ? true : loading;
  let resultsState = useSelector(currentResults);
  resultsState = (Object.keys(resultsState).length === 0) ? null : resultsState;
  loading = (resultsState && Object.keys(resultsState).length > 0) ? false : loading;

  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(loading);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [currentQueryID, setCurrentQueryID] = useState(useSelector(currentResultsQueryID).id);
  const [currentEvidence, setCurrentEvidence] = useState([]);
  const [allSelected, setAllSelected] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [results, setResults] = useState(resultsState);
  const [formattedResults, setFormattedResults] = useState([]);
  const [displayedResults, setDisplayedResults] = useState([]);
  const [resultsProgress, setResultsProgress] = useState(1);
  const [resultsBarOpacity, setResultsBarOpacity] = useState(false);
  const [endResultIndex, setEndResultIndex] = useState(9);
  const [pageCount, setPageCount] = useState(0);
  const [itemOffset, setItemOffset] = useState(0);
  const [activeFilters, setActiveFilters] = useState([]);
  
  var resultsBarOpacityClass = (resultsBarOpacity) ? 'dark': 'light';
  const queryClient = new QueryClient();
  const itemsPerPage = 10;
  
  useEffect(() => {
    if(formattedResults.length === 0)
      return
    
    const endOffset = (itemOffset + itemsPerPage > formattedResults.length)
      ? formattedResults.length
      : itemOffset + itemsPerPage;
    setDisplayedResults(formattedResults.slice(itemOffset, endOffset));
    setEndResultIndex(endOffset);
    setPageCount(Math.ceil(formattedResults.length / itemsPerPage));
    console.log(`Loaded items from ${itemOffset} to ${endOffset}`);
  }, [itemOffset, itemsPerPage, formattedResults]);

  // Invoke when user click to request another page.
  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerPage) % formattedResults.length;
    console.log(
      `User requested page number ${event.selected}, which is offset ${newOffset}`
    );
    setItemOffset(newOffset);
  };

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

  useEffect(() => {
    console.log(results);
    if(results === null)
      return;

    if(results.status !== 'running')
      setIsLoading(false);
    
    if(results.status === 'done') {
      let newResults = getFormattedResults(results);
      console.log(newResults);
      // set formatted results
      setFormattedResults(newResults);
      // update app state for unformatted results
      dispatch(setCurrentResults(results));
    }
    // setIsError((results.status === 'error'));
  }, [results]);

  const getFormattedResults = (results) => {
    return results.summary;
  }

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
    if(!match) {
      items.push(item);
      setSelectedItems(items);
    } else {
      items.splice(matchIndex, 1);
      setSelectedItems(items);
      if(items.length <= 0)
        setAllSelected(false)
    }
  }

  const handleSelectAll = (items) => {
    if(!allSelected) {
      setSelectedItems(items);
      setAllSelected(true);
    } else {
      setSelectedItems([]);
      setAllSelected(false);
    }
  }

  const handleModalClose = () => {
    setEvidenceOpen(false);
  }

  const activateEvidence = (evidence) => {
    setCurrentEvidence(evidence);
    setEvidenceOpen(true);
  }

  const handleFilter = (filter) => {
    let index = activeFilters.indexOf(filter);
    let newFilters = [];
    // Remove if we find a match
    if(index > -1) {
      newFilters = activeFilters.reduce((result, value, i) => {
        if(i!=index) {
          result.push(value);
        }
        return result;
      }, []);
    // Otherwise add the new filter to the list
    } else {
      newFilters = [...activeFilters, filter];
    }
    setActiveFilters(newFilters);
  }

  useEffect(() => {
    console.log(activeFilters);
    if(activeFilters.length <= 0) {
      setFormattedResults(getFormattedResults(results));
      return;
    }

    let filteredResults = [];
    activeFilters.forEach(element => {
      switch (element) {
        case 'fda':
          formattedResults.forEach((element) => {
            if(element.subject.fda_info != null)
              filteredResults.push(element);
          })
          break;
      
        default:
          filteredResults = [...formattedResults];
          break;
      }
    });
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