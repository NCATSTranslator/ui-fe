import React, { useState, useEffect } from "react";
import Checkbox from "../FormFields/Checkbox";
import Query2 from "../Query/Query2";
import ResultsFilter from "../ResultsFilter/ResultsFilter";
import {ReactComponent as CheckIcon } from "../../Icons/Buttons/Circle Checkmark.svg"
import { getIcon } from "../../Utilities/utilities";
import { currentQuery, currentResultsQueryID, currentResults, setCurrentResults } from "../../Redux/store";
import { useSelector, useDispatch } from 'react-redux';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import { ReactQueryDevtoolsPanel } from 'react-query/devtools';

const ResultsList = ({loading}) => {

  // URL search params
  const loadingParam = new URLSearchParams(window.location.search).get("loading")
  
  const dispatch = useDispatch();

  loading = (loading) ? loading : false;
  loading = (loadingParam) ? loadingParam : loading;
  let resultsState = useSelector(currentResults);
  console.log(resultsState);
  loading = (resultsState && Object.keys(resultsState).length > 0) ? false : loading;

  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(loading);
  const [currentQueryID, setCurrentQueryID] = useState(useSelector(currentResultsQueryID));
  // const [currentQueryID, setCurrentQueryID] = useState("2");
  const [results, setResults] = useState(null);
  const [resultsProgress, setResultsProgress] = useState(1);
  const [resultsBarOpacity, setResultsBarOpacity] = useState(.2);

  const [allSelected, setAllSelected] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const queryClient = new QueryClient();

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
        // console.log(data);
        setResults(data);
        console.log(data.status)
        // setIsError((status === 'error'));
      });
  }, { retry: 2, retryDelay: 4000 });
  // console.log(status)
  // console.log(results)
  // console.log(data)
  // console.log(results)
  console.log(isLoading);

  useEffect(() => {
    console.log(results);
    if(results === null)
      return;

    if(results.status !== 'running')
      setIsLoading(false);
    
    if(results.status === 'done')
      dispatch(setCurrentResults(results));
    // setIsError((results.status === 'error'));
  }, [results]);

  useEffect(() => {
    
    // let queryIDJson = JSON.stringify({qid: currentQueryID});

    // const requestOptions = {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: queryIDJson
    // };
    // fetch('/result', requestOptions)
    //   .then(response => response.json())
    //   .then(data => {
    //     console.log(data)
    //     // if(data.data && data.status === 'success') {
    //     //   setCurrentResultsID(data.data);
    //     //   dispatch(setCurrentQueryResultsID(data.data));
    //     //   setResultsActive(true);
    //     //   setIsLoading(true);
    //     // }
    //   });
  }, [currentQueryID]);

  const handleSelected = (item) => {
    let match = false;
    let matchIndex = -1;
    let items = [...selectedItems];
    items.map((element, i) => {         
      if(element.name === item.name && element.effect === item.effect) {
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
    if(resultsProgress >= 100) 
      return;

    let randomTimeout = Math.random() * (3000 - 500) + 500;
    const timer = setTimeout(() => {
      let newProgress = resultsProgress + 10;
      let newResultsBarOpacity = resultsBarOpacity + .15;
      if(newProgress < 100) {
        setResultsProgress(newProgress);
      } else {
        setResultsProgress(100);
      }
      if(newResultsBarOpacity < 1) {
        setResultsBarOpacity(newResultsBarOpacity);
      } else {
        setResultsBarOpacity(1);
      }
    }, randomTimeout);
    return () => clearTimeout(timer);
  }, [resultsProgress,resultsBarOpacity]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="results-list">
        <Query2 results/>
        <div className="results-container">
          {
            isLoading &&
            <div className="loading-bar">
              <div className="bar-outer">
                <div className="bar-inner" style={{width: `${resultsProgress}%`, opacity: `${resultsBarOpacity}`}}>

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
                        <Checkbox handleClick={()=>{handleSelectAll(exampleResults);}}/>
                      </div>
                      <div className="name-head head">Name</div>
                      <div className="fda-head head">FDA</div>
                      <div className="evidence-head head">Evidence</div>
                      <div className="tags-head head">Tags</div>
                  </div>
                  {
                    !isLoading &&
                    results && 
                    Object.keys(results.data[0].knowledge_graph.edges).map((key, i)=> {
                      // let icon = getIcon(item.type);
                      let icon = getIcon('chemical');
                      let item = results.data[0].knowledge_graph.edges[key];
                      return(
                        <div key={i} className="result">
                          <div className="checkbox-container result-sub">
                            <Checkbox checked={allSelected} handleClick={()=>handleSelected(item)}/>
                          </div>
                          <div className="name-container result-sub">
                            <span className="icon">{icon}</span>
                            <span className="name">{item.object}</span>
                            <span className="effect">{item.predicate}</span>
                          </div>
                          <div className="fda-container result-sub">
                            <span className="fda-icon"><CheckIcon /></span>
                            {/* <span className="fda">{item.fda}</span> */}
                          </div>
                          <div className="evidence-container result-sub">
                            {/* <span className="evidence-link"><span className="view-all">View All</span> ({item.evidence})</span> */}
                          </div>
                          <div className="tags-container result-sub">
                            <span className="tags">
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
              exampleKPResults.map((item, index)=> {
                let itemClass = "kp";
                itemClass += (item.error) ? " error" : "";
                itemClass += (item.value < 1) ? " no-results" : "";
                return(
                  <li key={index} className={`${itemClass}`}>
                    <span className="kp-name">{item.name}</span>
                    <span className="kp-value sub-one">{item.value}</span>
                  </li>
                )
              })
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