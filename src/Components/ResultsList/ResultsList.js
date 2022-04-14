import React, { useState, useEffect } from "react";
import Checkbox from "../FormFields/Checkbox";
import Query2 from "../Query/Query2";
import ResultsFilter from "../ResultsFilter/ResultsFilter";
import Modal from "../Modals/Modal";
import {ReactComponent as CheckIcon } from "../../Icons/Buttons/Circle Checkmark.svg"
import { getIcon } from "../../Utilities/utilities";
import { currentQuery, currentResultsQueryID, currentResults, setCurrentResults } from "../../Redux/store";
import { useSelector, useDispatch } from 'react-redux';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
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
  const [currentQueryID, setCurrentQueryID] = useState(useSelector(currentResultsQueryID));
  const [currentQuerySubject, setCurrentQuerySubject] = useState();
  const [currentEvidence, setCurrentEvidence] = useState([]);
  const [results, setResults] = useState(resultsState);
  const [formattedResults, setFormattedResults] = useState([]);
  const [resultsProgress, setResultsProgress] = useState(1);
  const [resultsBarOpacity, setResultsBarOpacity] = useState(false);
  var resultsBarOpacityClass = (resultsBarOpacity) ? 'dark': 'light';

  const [allSelected, setAllSelected] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const queryClient = new QueryClient();

  const resultsData = useQuery('resultsData', async () => {

    // if(!currentQueryID || !isLoading)
    //   return;

    // let queryIDJson = JSON.stringify({qid: currentQueryID});
    let queryIDJson = JSON.stringify({qid: '3'});

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: queryIDJson
    };
    const response = await fetch('/result', requestOptions)
      .then(response => response.json())
      .then(data => {
        // console.log(data);
        setResults(data);
        setIsError((data.status === 'error'));
      });
  }, { 
    refetchInterval: 7000,
    // enabled: isLoading
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

  const exampleResults = [
    {
      name: 'estradiol benzoate',
      effect: 'Downregulates CCND1, CCND2, CCND3',
      type: 'chemical',
      fda: 3,
      evidence: 23,
      tags: ['2022', 'FDA', 'High']
    },
    {
      name: 'tretinoin',
      effect: 'Downregulates CCND2, CCND3',
      type: 'chemical',
      fda: 3,
      evidence: 42,
      tags: ['2022', 'FDA', 'Med']
    },
    {
      name: '2-AMINO-1-METHYL-6- PHENYLIMIDAZO[4,5- B]PYRIDINE',
      effect: 'Downregulates CCND1',
      type: 'chemical',
      fda: 4,
      evidence: 121,
      tags: ['2022', 'Med']
    }
  ]

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
              <ResultsFilter/>
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
                    formattedResults.length > 0 && 
                    formattedResults.map((item, i) => {
                      if(i < 10)
                      console.log(item);
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

                      return(
                        <div key={i} className="result">
                          <div className="checkbox-container result-sub">
                            <Checkbox checked={allSelected} handleClick={()=>handleSelected(item)}/>
                          </div>
                          <div className="name-container result-sub">
                            <span className="icon">{icon}</span>
                            <span className="name">{item.subject.name.toUpperCase()}</span>
                            <span className="effect">{item.edge.predicate}</span>
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
                                item.subject.toxicity_info.level &&
                                <span className={`tag toxicity`}>{item.subject.toxicity_info.level}</span>  
                              }
                              {
                                lastPubYear &&
                                <span className={`tag year`}>{lastPubYear}</span>  
                              }
                              {/* {item.tags.map((tag, j) => {
                                return (
                                  <span key={j} className={`tag ${tag}`}>{tag}</span>  
                                )
                              })} */}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
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
      {/* <ReactQueryDevtoolsPanel style={{display: "block"}} className="query-devtools" /> */}
    </QueryClientProvider>
  );
}

export default ResultsList;