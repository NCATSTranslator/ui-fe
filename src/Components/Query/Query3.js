import React, {useState, useEffect, useRef, useMemo, useCallback} from "react";
import { useSelector, useDispatch } from 'react-redux'
import { NavigationType, useNavigate, useSearchParams } from 'react-router-dom';
import QueryBar from "../QueryBar/QueryBar";
import OutsideClickHandler from "../OutsideClickHandler/OutsideClickHandler";
import { incrementHistory } from "../../Redux/historySlice";
import { setCurrentQuery, currentQuery} from "../../Redux/querySlice";
import { setCurrentQueryResultsID, setCurrentResults } from "../../Redux/resultsSlice";
import cloneDeep from "lodash/cloneDeep";
import isEqual from 'lodash/isEqual';
import _ from "lodash";
import { getAutocompleteTerms } from "../../Utilities/autocompleteFunctions";
import {ReactComponent as Question} from '../../Icons/Navigation/Question.svg';
import styles from './Query3.module.scss';

const Query3 = ({results, handleAdd, handleRemove, loading, presetDisease}) => {

  // Utilities for navigation and application state dispatch
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // eslint-disable-next-line
  const [searchParams, setSearchParams] = useSearchParams();

  // eslint-disable-next-line
  const navigatingFromHistory = ( new URLSearchParams(window.location.search).get("results") !== null) ? true : false;

  loading = (loading) ? true : false;

  // Bool, are we on the results page
  const isResults = results;
  // Bool, are the results loading
  const [isLoading, setIsLoading] = useState(loading);
  // Bool, is the submitted query valid, determined by validateSubmission 
  const [isValidSubmission, setIsValidSubmission] = useState(false);
  // Bool, is there an error in the submission
  const [isError, setIsError] = useState(false);
  // String, error text
  const [errorText, setErrorText] = useState('');

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

  // Bool, since the query will be submitted whenever a query item is selected, use this to distinguish between
  // when a user selected a query item, or if the query item is manually updated when /creative_results returns
  // the final name for the submitted disease
  const [readyForSubmission, setReadyForSubmission] = useState(false);

  // String, used to set navigation url for example disease buttons
  const [presetURL, setPresetURL] = useState(false);

  // Event handler called when search bar is updated by user
  const handleQueryItemChange = (e) => {
    delayedQuery(e, setLoadingAutocomplete, setAutoCompleteItems);
    setInputText(e);
  }

  // Handler for disease selection (template click or autocomplete item click)
  const handleDiseaseSelection = (disease) => {
    setIsError(false);
    setSelectedDisease(disease);
    setReadyForSubmission(true);
    if(autocompleteItems) 
      setAutoCompleteItems([]);
  }

  // Validation function for submission
  const validateSubmission = useCallback(() => {
    if(selectedDisease === null) {
      setIsError(true);
      setErrorText("No disease selected, please select a valid disease.");
      return;
    }

    setIsValidSubmission(true);
  }, [selectedDisease])

  // Event handler for form submission
  const handleSubmission = useCallback(() => {
    validateSubmission();
  },[validateSubmission])

  const updateQueryItems = (label) => {
    setQueryItems([
      {
        "name": "What Drugs",
        "type": "subject",
        "category": "chemical",
        "value": ""
      },
      {
        "name": "May Treat",
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
    setIsLoading(loading);
  }, [loading]);

  useEffect(() => {
    if(selectedDisease !== null) {
      setInputText(selectedDisease.label);
      updateQueryItems(selectedDisease.label);
      // Uncomment the below to re-enable click to run query
      // if(readyForSubmission) {
      //   setReadyForSubmission(false);
      //   handleSubmission();
      // }
    }
    
  }, [selectedDisease, readyForSubmission, handleSubmission]);

  useEffect(() => {
    if(presetDisease) {
      setSelectedDisease(presetDisease);
    }
  }, [presetDisease]);

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

  // Handle change to isValidSubmission
  useEffect(() => {
    // If the submission is valid
    if(isValidSubmission) {
      let timestamp = new Date();

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
            dispatch(setCurrentQueryResultsID(data.data));
            // Update the query history in the application state
            dispatch(
              incrementHistory(
                { 
                  items: queryItems, 
                  date: timestamp.toDateString(), 
                  time: timestamp.toLocaleTimeString([], {hour12: true, hour: 'numeric', minute:'2-digit'}),
                  id: data.data
                }
              )
            );
            setIsValidSubmission(false);
          }
          if(window.location.href.includes('results')) {
            // If we're submitting from the results page, reload the query with the newly returned queryID
            setSearchParams('?loading=true');
            window.location.reload();
          } else {
            // Otherwise, navigate to the results page and set loading to true
            navigate('/results?loading=true');
          }
        })
        .catch((error) => {
          console.log(error)
        });
    }

  }, [isValidSubmission, dispatch, queryItems, storedQuery, selectedDisease, navigate])

  /* 
    If the query has been populated by clicking on an item in the query history
    set the isValidSubmission to true to imitate manual submission of the query
  */
  useEffect(() => {
    if(navigatingFromHistory) {
      setIsValidSubmission(true)
    }
  }, [navigatingFromHistory]);

  useEffect(() => {
    if(presetURL) {
      const timer = setTimeout(() => {
        navigate(presetURL);
      }, 100 );
      return () => {
        clearTimeout(timer);
      }
    }
  }, [selectedDisease, presetURL]);

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
          <OutsideClickHandler onOutsideClick={()=>{if(autocompleteItems) setAutoCompleteItems([])}}>
            <QueryBar
              handleSubmission={handleSubmission}
              handleChange={handleQueryItemChange}
              isDisabled={isLoading}
              value={inputText}
              autocompleteItems={autocompleteItems}
              autocompleteLoading={loadingAutocomplete}
              handleItemClick={handleDiseaseSelection}
            />
          </OutsideClickHandler>
          <p className={styles.needHelp}>
            <a href="/help" rel="noreferrer " target="_blank"><Question/> Need Help?</a>
          </p>
          {!isResults &&
            <div className={styles.examples}>
              <p className={styles.subTwo}>Example Diseases:</p>
              {/* <div className={styles.exampleList}>
                <button className={styles.button} onClick={()=>handleDiseaseSelection({ id: 'UMLS:C0580546', label:'Abnormal Blood Glucose'})}>Abnormal Blood Glucose</button>
                <button className={styles.button} onClick={()=>handleDiseaseSelection({ id: 'MONDO:0018975', label:'Neurofibromatosis Type I'})}>Neurofibromatosis Type I</button>
                <button className={styles.button} onClick={()=>handleDiseaseSelection({ id: 'MONDO:0004975', label:'Alzheimer\'s'})}>Alzheimer's</button>
                <button className={styles.button} onClick={()=>handleDiseaseSelection({ id: 'MONDO:0018997', label:'Noonan Syndrome'})}>Noonan Syndrome</button>
              </div> */}
    
              <div className={styles.exampleList}>
                <button 
                  className={styles.button} 
                  onClick={(e)=>{ 
                    setSelectedDisease({ id: '0000', label:'Heart Disease'}); 
                    setPresetURL(e.target.dataset.url);
                  }} 
                  data-url="/results?q=6d7ce863-e4d3-4cf8-8a38-3b7191d17964"
                  >Heart Disease
                </button>
                <button 
                  className={styles.button}
                  onClick={(e)=>{ 
                    setSelectedDisease({ id: '0000', label:'Type 2 Diabetes'}); 
                    setPresetURL(e.target.dataset.url);
                  }}
                  data-url="/results?q=26394fad-bfd9-4e32-bb90-ef9d5044f593"
                  >Type 2 Diabetes
                </button>
                <button 
                  className={styles.button}
                  onClick={(e)=>{ 
                    setSelectedDisease({ id: '0000', label:'Alzheimer\'s'}); 
                    setPresetURL(e.target.dataset.url);
                  }}
                  data-url="/results?q=6752ab77-ff70-4805-8f7c-c55d078b0a50"
                  >Alzheimer's
                </button>
                <button 
                  className={styles.button}
                  onClick={(e)=>{ 
                    setSelectedDisease({ id: '0000', label:'Multiple Sclerosis'}); 
                    setPresetURL(e.target.dataset.url);
                  }}
                  data-url="/results?q=5c255e94-16d0-4668-8957-45daa995566b"
                  >Multiple Sclerosis
                </button>
                <button 
                  className={styles.button}
                  onClick={(e)=>{ 
                    setSelectedDisease({ id: '0000', label:'NGLY1-Deficiency'}); 
                    setPresetURL(e.target.dataset.url);
                  }}
                  data-url="/results?q=a333d77d-3f53-4b6c-a311-d3dc067b29a2"
                  >NGLY1-Deficiency
                </button>
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