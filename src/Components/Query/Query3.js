import React, {useState, useEffect, useRef, useCallback} from "react";
import { useSelector, useDispatch } from 'react-redux'
import { cannedQueries } from "../../Data/cannedqueries";
import { useNavigate, useSearchParams } from 'react-router-dom';
import isEqual from 'lodash/isEqual';
import QueryTemplate from "../QueryComponents/QueryTemplate";
import QueryItemButton from "../QueryComponents/QueryItemButton";
import SimpleQueryBar from "../QueryComponents/SimpleQueryBar";
import { incrementHistory } from "../../Redux/historySlice";
import { setCurrentQuery, currentQuery} from "../../Redux/querySlice";
import { setCurrentQueryResultsID, setCurrentResults } from "../../Redux/resultsSlice";
import cloneDeep from "lodash/cloneDeep";
import styles from './Query3.module.scss';
import Button from "../FormFields/Button";

const Query3 = ({template, results, handleAdd, handleRemove, loading}) => {

  // Utilities for navigation and application state dispatch
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [queryParams, setQueryParams] = useSearchParams();
  const navigatingFromHistory = (queryParams.get('results') !== null) ? true : false;

  loading = (loading) ? true : false;

  // Bool, are we on the results page
  const [isResults, setIsResults] = useState(results);
  // Bool, are results active
  const [resultsActive, setResultsActive] = useState(false);
  // Bool, are the results loading
  const [isLoading, setIsLoading] = useState(loading);
  // Bool, is the submitted query valid, determined by validateSubmission 
  const [isValidSubmission, setIsValidSubmission] = useState(false);
  // Int, active mock ARS ID. For testing purposes
  const [activeMockID, setActiveMockID] = useState(3);

  // Get the current query from the application state
  let storedQuery = useSelector(currentQuery);
  storedQuery = (storedQuery === undefined) ? [] : storedQuery;
  // Array, currently selected query items
  const [queryItems, setQueryItems] = useState(storedQuery);
  // Array, for use in useEffect hooks with queryItems as a dependency
  var prevQueryItems = useRef(storedQuery);

  // Event handler called when a node's input is updated by the user 
  const handleQueryItemChange = (e) => {
    let updatedValue = e.target.value;
    let itemKey = e.target.dataset.inputkey;
    if(queryItems[itemKey].type === 'node') {
      let items = JSON.parse(JSON.stringify(queryItems));
      items[itemKey].value = updatedValue;
      setQueryItems(items);
    }
  }
 
  // Event handler for form submission
  const handleSubmission = (e) => {
    e.preventDefault();
    validateSubmission(e);
  }

  // Validation function for submission
  const validateSubmission = (e) => {
    if(queryItems.length > 0) {
      setIsValidSubmission(true);
    }
  }
  
  /* 
    When the query items change, update the current query in the app state 
    and alternate active query item type (nodes/predicates)
  */
  useEffect(() => {
    // since useEffect dependency update checks don't work on objects (thanks to shallow equals)
    // check to see if queryItems has actually been updated, if not return
    if(isEqual(prevQueryItems.current, queryItems))
      return;

    prevQueryItems.current = cloneDeep(queryItems);

    // if the current query items and the stored query match, return 
    if(isEqual(queryItems, storedQuery)) 
      return;

    // otherwise, update the stored query in the app state
    dispatch(setCurrentQuery(queryItems));
  }, [queryItems, storedQuery, dispatch]);



  // Handle change to isValidSubmission
  useEffect(() => {
    // If the submission is valid
    if(isValidSubmission) {
      let timestamp = new Date();
      // Update the query history in the application state
      dispatch(incrementHistory({ items: storedQuery, time: timestamp.toDateString()}));
      // Reset the current results in the application state
      dispatch(setCurrentResults({}));
      // Reset isValidSubmission
      setIsValidSubmission(false);
      // Set isLoading to true
      setIsLoading(true);

      let testJson = '';
      
      // If the activeMockID has been set, prep the json to be sent to /query
      if(activeMockID !== -1) {
        let mockJson = { id: activeMockID} 
        testJson = JSON.stringify(mockJson);
      }

      // submit query to /query
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: testJson
      };
      fetch('/query', requestOptions)
        .then(response => response.json())
        .then(data => {
          console.log(data)
          if(data.data && data.status === 'success') {
            // Update the currentQueryResultsID in the application state
            dispatch(setCurrentQueryResultsID(data.data.id));
            setResultsActive(true);
          }
        });
    }

  }, [isValidSubmission, dispatch, queryItems, activeMockID, storedQuery])

  /* 
    If the query has been populated by clicking on an item in the query history
    set the isValidSubmission to true to imitate manual submission of the query
  */
  useEffect(() => {
    if(navigatingFromHistory) {
      setIsValidSubmission(true)
    }
  }, [navigatingFromHistory]);

  // If isResults is true send us to the results page and set loading to true via query param
  useEffect(() => {
    if(isResults) {
      navigate('/results?loading=true');
    }
  }, [isResults, navigate]);

  // Click handler for query items 
  const addQueryItem = (item) => {
    const items = Array.from(queryItems);
    items.push(item);
    setQueryItems(items);
  }

  // Click handler to remove a query item from the list
  const removeQueryItem = (indexToRemove) => {
    let needsChange = false;
    let newItems = Array.from(queryItems);
    queryItems.map(({name}, index) => {
      if(index === indexToRemove) {
        newItems.splice(index, 1);
        needsChange = true;
      }
      return name;
    });

    if(needsChange)
      setQueryItems(newItems);
  } 

  return (
    <>
      <div className={`${styles.queryThree}`} >
        <div className={`${styles.container} container`}>
          {!isResults &&
            <h4 className={styles.heading}>Biomedical Data Translator</h4>
          }
          <SimpleQueryBar
            handleSubmission={handleSubmission}
            isLoading={isLoading}
            storedQuery={storedQuery}
          />
          {!isResults &&
            <div className={styles.examples}>
              <p className={styles.subTwo}>Example Diseases:</p>
              <div className={styles.exampleList}>
                <button className={styles.button}>Abnormal Blood Glucose</button>
                <button className={styles.button}>Neurofibromatosis Type I</button>
                <button className={styles.button}>Alzheimer's</button>
                <button className={styles.button}>Noonan Syndrome</button>
              </div>
            </div>
          }
        </div>
      </div>
      <div className={styles.panels}>
          {isResults && 
          isLoading &&
            <div className="loading-results">
            </div>
          }
      </div>
    </>
  );
}


export default Query3;