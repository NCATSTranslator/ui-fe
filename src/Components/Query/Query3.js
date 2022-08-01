import React, {useState, useEffect, useRef, useMemo} from "react";
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom';
import SimpleQueryBar from "../QueryComponents/SimpleQueryBar";
import { incrementHistory } from "../../Redux/historySlice";
import { setCurrentQuery, currentQuery} from "../../Redux/querySlice";
import { setCurrentQueryResultsID, setCurrentResults } from "../../Redux/resultsSlice";
import cloneDeep from "lodash/cloneDeep";
import isEqual from 'lodash/isEqual';
import _ from "lodash";
import { getAutocompleteTerms } from "../../Utilities/autocompleteFunctions";
import styles from './Query3.module.scss';

const Query3 = ({results, handleAdd, handleRemove, loading}) => {

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
  // Bool, is there an error in the submission
  const [isError, setIsError] = useState(false);
  // String, error text
  const [errorText, setErrorText] = useState('');
  // Int, active mock ARS ID. For testing purposes
  const [activeMockID, setActiveMockID] = useState('e01');

  // Get the current query from the application state
  let storedQuery = useSelector(currentQuery);
  storedQuery = (storedQuery === undefined) ? [] : storedQuery;
  // Array, currently selected query items
  const [queryItems, setQueryItems] = useState(storedQuery);
  // Array, for use in useEffect hooks with queryItems as a dependency
  var prevQueryItems = useRef(storedQuery);
  let presetInputText = 
    (prevQueryItems.current[prevQueryItems.current.length - 1] !== undefined
      && isResults) 
    ? prevQueryItems.current[prevQueryItems.current.length - 1].name 
    : '';
  const [inputText, setInputText] = useState(presetInputText);
  const [selectedDisease, setSelectedDisease] = useState(null);

  // Array, List of items to display in the autocomplete window
  const [autocompleteItems, setAutoCompleteItems] = useState([]);
  // Bool, are autocomplete items loading
  const [loadingAutocomplete, setLoadingAutocomplete] = useState(false);
  // Function, delay query for fetching autocomplete items by 750ms each time the user types, so we only send a request once they're done
  const delayedQuery = useMemo(() => _.debounce((i, sl, sa) => getAutocompleteTerms(i, sl, sa), 750), []);

  // Event handler called when search bar is updated by user
  const handleQueryItemChange = (e) => {
    delayedQuery(e, setLoadingAutocomplete, setAutoCompleteItems);
    setInputText(e);
  }

  // Handler for disease selection (template click or autocomplete item click)
  const handleDiseaseSelection = (disease) => {
    setIsError(false);
    setSelectedDisease(disease);
  }

  const updateQueryItems = (label) => {
    setQueryItems([
      {
        "name": "What Drugs",
        "type": "subject",
        "category": "chemical",
        "value": ""
      },
      {
        "name": "Treat",
        "type": "action",
        "category": "treats"
      },
      {
        "name": label,
        "type": "subject",
        "category": "disease",
        "value": ""
      }
    ]);
  }

  useEffect(() => {
    if(selectedDisease !== null) {
      setInputText(selectedDisease.label);
      updateQueryItems(selectedDisease.label);
    }
  }, [selectedDisease]);

  /* 
    When the query items change, update the current query in the app state 
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

  // Event handler for form submission
  const handleSubmission = (e) => {
    e.preventDefault();
    validateSubmission(e);
  }

  // Validation function for submission
  const validateSubmission = (e) => {
    if(selectedDisease === null) {
      setIsError(true);
      setErrorText("No disease selected, please select a valid disease.");
      return;
    }

    setIsValidSubmission(true);
  }

  // Handle change to isValidSubmission
  useEffect(() => {
    // If the submission is valid
    if(isValidSubmission) {
      let timestamp = new Date();
      // Update the query history in the application state
      dispatch(
        incrementHistory(
          { 
            items: storedQuery, 
            date: timestamp.toDateString(), 
            time: timestamp.toLocaleTimeString([], {hour12: true, hour: 'numeric', minute:'2-digit'})
          }
        )
      );
      // Reset the current results in the application state
      dispatch(setCurrentResults({}));
      // Reset isValidSubmission
      setIsValidSubmission(false);
      // Set isLoading to true
      setIsLoading(true);

      let queryJson = JSON.stringify({disease: selectedDisease.id});
      
      // submit query to /query
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: queryJson
      };
      fetch('/creative_query', requestOptions)
        .then(response => response.json())
        .then(data => {
          console.log(data)
          if(data.data && data.status === 'success') {
            // Update the currentQueryResultsID in the application state
            dispatch(setCurrentQueryResultsID(data.data.id));
          }
          setResultsActive(true);
        })
        .catch((error) => {
          console.log(error)
        });
    }

  }, [isValidSubmission, dispatch, queryItems, activeMockID, storedQuery, selectedDisease])

  // Set isResults to true when resultsActive so we can navigate to the results page
  useEffect(() => {
    if(resultsActive) {
      setIsResults(true);
    }
  }, [resultsActive]);

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

  return (
    <>
      <div className={`${styles.queryThree}`} >
        <div className={`${styles.container} container`}>
          {!isResults &&
            <h4 className={styles.heading}>Biomedical Data Translator</h4>
          }
          {
            isError &&
            <p className={styles.error}>{errorText}</p>
          }
          <SimpleQueryBar
            handleSubmission={handleSubmission}
            handleChange={handleQueryItemChange}
            isLoading={isLoading}
            value={inputText}
            autocompleteItems={autocompleteItems}
            autocompleteLoading={loadingAutocomplete}
            handleItemClick={handleDiseaseSelection}
          />
          {!isResults &&
            <div className={styles.examples}>
              <p className={styles.subTwo}>Example Diseases:</p>
              <div className={styles.exampleList}>
                <button className={styles.button} onClick={()=>handleDiseaseSelection({ id: '', label:'Abnormal Blood Glucose'})}>Abnormal Blood Glucose</button>
                <button className={styles.button} onClick={()=>handleDiseaseSelection({ id: '', label:'Neurofibromatosis Type I'})}>Neurofibromatosis Type I</button>
                <button className={styles.button} onClick={()=>handleDiseaseSelection({ id: '', label:'Alzheimer\'s'})}>Alzheimer's</button>
                <button className={styles.button} onClick={()=>handleDiseaseSelection({ id: '', label:'Noonan Syndrome'})}>Noonan Syndrome</button>
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