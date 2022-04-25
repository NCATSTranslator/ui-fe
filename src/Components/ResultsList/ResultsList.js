import React, { useState, useEffect } from "react";
import Checkbox from "../FormFields/Checkbox";
import Query2 from "../Query/Query2";
import ResultsFilter from "../ResultsFilter/ResultsFilter";
import Modal from "../Modals/Modal";
import {ReactComponent as CheckIcon } from "../../Icons/Buttons/Circle Checkmark.svg"
import { getIcon, capitalizeFirstLetter } from "../../Utilities/utilities";
import { currentQuery, currentResultsQueryID, currentResults, setCurrentResults } from "../../Redux/store";
import { useSelector, useDispatch } from 'react-redux';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import ReactPaginate from 'react-paginate';
import { ReactQueryDevtoolsPanel } from 'react-query/devtools';
import { current } from "@reduxjs/toolkit";

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
  const [currentQuerySubject, setCurrentQuerySubject] = useState();
  const [currentEvidence, setCurrentEvidence] = useState([]);
  const [results, setResults] = useState(resultsState);
  const [formattedResults, setFormattedResults] = useState([]);
  const [displayedResults, setDisplayedResults] = useState([]);

  const [paginationNums, setPaginationNums] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [itemOffset, setItemOffset] = useState(0);
  const itemsPerPage = 10;
  
  
  const [resultsProgress, setResultsProgress] = useState(1);
  const [resultsBarOpacity, setResultsBarOpacity] = useState(false);
  
  const [startResultIndex, setStartResultIndex] = useState(0);
  const [endResultIndex, setEndResultIndex] = useState(9);

  var resultsBarOpacityClass = (resultsBarOpacity) ? 'dark': 'light';

  const [allSelected, setAllSelected] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const queryClient = new QueryClient();
  
  useEffect(() => {
    if(formattedResults.length === 0)
      return
    
      // Fetch items from another resources.
    const endOffset = (itemOffset + itemsPerPage > formattedResults.length)
      ? formattedResults.length
      : itemOffset + itemsPerPage;
    setDisplayedResults(formattedResults.slice(itemOffset, endOffset));
    setStartResultIndex(itemOffset);
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
    // let queryIDJson = JSON.stringify({qid: '3'});

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

  // useEffect(() => {
  //   if(formattedResults.length <= 0)
  //     return;
  //   let pagination = getPaginationNums(formattedResults);
  //   setPaginationNums(pagination);
  // }, [formattedResults]);

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

  // const handlePrev = () => {
  //   if(startResultIndex === 0) 
  //     return;

  //   if(startResultIndex - itemsPerPage > 0) {
  //     setStartResultIndex(startResultIndex - itemsPerPage)
  //     setEndResultIndex(startResultIndex - 1)
  //   } else {
  //     let increment = (startResultIndex);
  //     setStartResultIndex(startResultIndex - increment)
  //     setEndResultIndex(itemsPerPage - 1)
  //   }
  //   setCurrentPage((currentPage) => currentPage - 1);
  // }

  // const handleNext = () => {
  //   if(formattedResults.length === (endResultIndex + 1))
  //     return;

  //   if(formattedResults.length > endResultIndex + itemsPerPage) {
  //     setStartResultIndex(startResultIndex + itemsPerPage)
  //     setEndResultIndex(endResultIndex + itemsPerPage)
  //   } else {
  //     let increment = (formattedResults.length - endResultIndex);
  //     setStartResultIndex(startResultIndex + itemsPerPage)
  //     setEndResultIndex(formattedResults.length - 1)
  //   }
  //   setCurrentPage((currentPage) => currentPage + 1);
  // }

  // const setResultIndexes = (start, end, page) => {
  //   setStartResultIndex(start);
  //   setEndResultIndex(end);
  //   setCurrentPage(page);
  // }

  // const getPaginationNums = (elements) => {
    
  //   let currentClass = (currentPage === 0) ? 'current' : '';
  //   var numbers = [<li onClick={()=>setResultIndexes(0, itemsPerPage - 1, 0)} className={`page-num ${currentClass}`}>1</li>];
  //   // start with 2, since we already supplied '1'
  //   var pageNum = 2;
  //   for (let i = 0; i < elements.length; i++) {
  //     if((i + 1) % itemsPerPage === 0) {
  //       let start = i + 1;
  //       let end = ((start + itemsPerPage) > elements.length) 
  //         ? formattedResults.length - 1 
  //         : i + itemsPerPage;
  //         currentClass = (currentPage === pageNum - 1) ? 'current' : '';
  //       let newPage = pageNum - 1;
  //       numbers.push(<li onClick={()=>{setResultIndexes(start, end, newPage)}} className={`page-num ${currentClass}`}>{pageNum}</li>);
  //       pageNum++;
  //     }
  //   }
  //   return numbers;
  // }

  // useEffect(() => {
  //   console.log(currentPage);
  //   let pagination = getPaginationNums(formattedResults);
  //   setPaginationNums(pagination);
  // }, [currentPage]);

  // useEffect(() => {
  //   // console.log(startResultIndex);
  //   // console.log(endResultIndex);
  // }, [endResultIndex]);

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

    let randomTimeout = Math.random() * (5000 - 500) + 500;
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
        <div className="table-body">
          <div className="table-head">
            <div className="head title">Title</div>
            <div className="head abstract">Abstract</div>
            <div className="head date">Date</div>
          </div>
          {
            currentEvidence.length > 0 &&
            currentEvidence.map((item, i)=> {
              return <p key={i}><a href={item} target="_blank">{item}</a></p>
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
              <ResultsFilter startIndex={itemOffset+1} endIndex={endResultIndex} totalCount={formattedResults.length}/>
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
                    <h3>There was an error when processing your query. Please try again.</h3>
                  }
                  {
                    !isLoading &&
                    !isError &&
                    // formattedResults.length > 0 && 
                    // formattedResults.map((item, i) => {
                    displayedResults.length > 0 && 
                    displayedResults.map((item, i) => {
                      // if(i < startResultIndex || i > endResultIndex)
                      //   return;

                      // let icon = getIcon(item.type);
                      let icon = getIcon('chemical');

                      let evidenceCount = 
                        (
                          item.edge !== undefined &&
                          item.edge.evidence !== undefined 
                        ) 
                        ? item.edge.evidence.length
                        : 0;
                        
                      let fdaLevel = (item.subject.fda_info ) 
                        ? item.subject.fda_info.max_level 
                        : 'N/A';

                      let lastPubYear = (item.edge.last_publication_date)
                        ? new Date(item.edge.last_publication_date).getFullYear()
                        : null;

                      let predicate = (item.edge.predicate)
                          ? item.edge.predicate.replace("biolink:", '')
                          : '';

                      return(
                        <div key={i} className="result">
                          <div className="checkbox-container result-sub">
                            <Checkbox checked={allSelected} handleClick={()=>handleSelected(item)}/>
                          </div>
                          <div className="name-container result-sub">
                            <span className="icon">{icon}</span>
                            <span className="name">{item.subject.name.toUpperCase()}</span>
                            <span className="effect">{capitalizeFirstLetter(predicate)}</span>
                          </div>
                          <div className="fda-container result-sub">
                            {fdaLevel !== 'N/A' &&
                              <span className="fda-icon"><CheckIcon /></span>
                            }
                            <span className="fda">{fdaLevel}</span>
                          </div>
                          <div className="evidence-container result-sub">
                            <span className="evidence-link" onClick={()=>{activateEvidence(item.edge.evidence)}}>
                              <span className="view-all">View All</span> ({evidenceCount})
                            </span>
                          </div>
                          <div className="tags-container result-sub">
                            <span className="tags">
                              {
                                // item.subject.toxicity_info.level &&
                                // <span className={`tag toxicity`}>{item.subject.toxicity_info.level}</span>  
                              }
                              {
                                lastPubYear &&
                                <span className={`tag year`}>{lastPubYear}</span>  
                              }
                            </span>
                          </div>
                        </div>
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
                  {/* <button className="prev" onClick={handlePrev}>Previous</button>
                  <ul className="page-nums">{
                    paginationNums.map((item, i) => {
                      if(paginationNums.length > 4) {
                        if(i === currentPage 
                          || (i === 0)
                          || (i === currentPage - 1 && i > 0)
                          || i === currentPage + 1
                          || i >= paginationNums.length - 2) {
                            return item;
                          }
                        if (i === currentPage + 2)
                          return '...';
                      }
                    })
                  }</ul>
                  <button className="next" onClick={handleNext}>Next</button> */}
                </div>
              }
            </div>
          }
          <div className="kps">
            <h6>Knowledge Providers</h6>
            <p>
              { isLoading && "Estimated Loading Time: " } 
              { !isLoading && "Found in " } 
              <span className="time">1.8 seconds</span></p>
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