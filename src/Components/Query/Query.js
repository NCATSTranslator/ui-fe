import React, {useState, useEffect, useRef, useMemo, useCallback} from "react";
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import styles from './Query.module.scss';
import { getEntityLink } from "../../Utilities/utilities";

const Query = ({results, loading, presetDisease}) => {

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
  // String, type of query
  const [queryType, setQueryType] = useState(null);
  // String, type to send to autocomplete for result filtering
  const autocompleteFilterTerm = useRef(null);
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
  const [autocompleteItems, setAutoCompleteItems] = useState(null);
  // Bool, are autocomplete items loading
  const [loadingAutocomplete, setLoadingAutocomplete] = useState(false);
  // Function, delay query for fetching autocomplete items by 750ms each time the user types, so we only send a request once they're done
  const delayedQuery = useMemo(() => _.debounce(
    (inputText, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFilterTerm) =>
      getAutocompleteTerms(inputText, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFilterTerm), 750), []
  );

  // Bool, since the query will be submitted whenever a query item is selected, use this to distinguish between
  // when a user selected a query item, or if the query item is manually updated when /creative_results returns
  // the final name for the submitted disease
  const [readyForSubmission, setReadyForSubmission] = useState(false);

  // String, used to set navigation url for example disease buttons
  const [presetURL, setPresetURL] = useState(false);

  // Event handler called when search bar is updated by user
  const handleQueryItemChange = (e) => {
    if(queryType) {
      delayedQuery(e, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFilterTerm.current);
      setInputText(e);
    } else {
      setIsError(true);
      setErrorText("No query selected, please select a query from the dropdown.");
    }
  }

  const handleQueryTypeChange = (value) => {
    setIsError(false);
    autocompleteFilterTerm.current = value.filterType;
    setQueryType(value);
  }

  // Handler for disease selection (template click or autocomplete item click)
  const handleDiseaseSelection = (disease) => {
    setIsError(false);
    setSelectedDisease(disease);
    setReadyForSubmission(true);
    if(autocompleteItems)
      setAutoCompleteItems(null);
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

      let queryJson = JSON.stringify({curie: selectedDisease.id, type: queryType.targetType, direction: null});

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

  }, [isValidSubmission, dispatch, queryItems, storedQuery, selectedDisease, navigate, setSearchParams])

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
  }, [selectedDisease, presetURL, navigate]);

  useEffect(() => {
    if(!queryType)
      return;
    console.log(queryType)
  }, [queryType]);

  return (
    <>
      <div className={`${styles.query}`} >
        <div className={`${styles.container} container`}>
          {!isResults &&
            <h4 className={styles.heading}>Biomedical Data Translator</h4>
          }
          {
            isError &&
            <p className={styles.error}>{errorText}</p>
          }
          <OutsideClickHandler onOutsideClick={()=>{setAutoCompleteItems(null)}}>
            <QueryBar
              handleSubmission={handleSubmission}
              handleChange={handleQueryItemChange}
              handleQueryTypeChange={handleQueryTypeChange}
              isDisabled={isLoading}
              value={inputText}
              autocompleteItems={autocompleteItems}
              autocompleteLoading={loadingAutocomplete}
              handleItemClick={handleDiseaseSelection}
            />
          </OutsideClickHandler>
          {
            isResults && selectedDisease && selectedDisease.id &&
            <p className={styles.needHelp}>
              {getEntityLink(selectedDisease.id, styles.monarchLink)}
            </p>
          }
          <p className={styles.needHelp}>
            <a href="/help" rel="noreferrer " target="_blank"><Question/> Need Help?</a>
          </p>

          {!isResults &&
            <div className={styles.examples}>
              <p className={styles.subTwo}>Example Diseases:</p>
              <div className={styles.exampleList}>
                <button
                  className={styles.button}
                  onClick={(e)=>{
                    setSelectedDisease({ id: process.env.REACT_APP_EX_DISEASE_ONE_ID, label: process.env.REACT_APP_EX_DISEASE_ONE_NAME});
                    setPresetURL(e.target.dataset.url);
                  }}
                  data-testid="heart-disease"
                  data-url={`/results?q=${process.env.REACT_APP_EX_DISEASE_ONE_UUID}`}
                  >{process.env.REACT_APP_EX_DISEASE_ONE_NAME}
                </button>
                <button
                  className={styles.button}
                  onClick={(e)=>{
                    setSelectedDisease({ id: process.env.REACT_APP_EX_DISEASE_TWO_ID, label: process.env.REACT_APP_EX_DISEASE_TWO_NAME});
                    setPresetURL(e.target.dataset.url);
                  }}
                  data-url={`/results?q=${process.env.REACT_APP_EX_DISEASE_TWO_UUID}`}
                  >{process.env.REACT_APP_EX_DISEASE_TWO_NAME}
                </button>
                <button
                  className={styles.button}
                  onClick={(e)=>{
                    setSelectedDisease({ id: process.env.REACT_APP_EX_DISEASE_THREE_ID, label: process.env.REACT_APP_EX_DISEASE_THREE_NAME});
                    setPresetURL(e.target.dataset.url);
                  }}
                  data-url={`/results?q=${process.env.REACT_APP_EX_DISEASE_THREE_UUID}`}
                  >{process.env.REACT_APP_EX_DISEASE_THREE_NAME}
                </button>
                <button
                  className={styles.button}
                  onClick={(e)=>{
                    setSelectedDisease({ id: process.env.REACT_APP_EX_DISEASE_FOUR_ID, label: process.env.REACT_APP_EX_DISEASE_FOUR_NAME});
                    setPresetURL(e.target.dataset.url);
                  }}
                  data-url={`/results?q=${process.env.REACT_APP_EX_DISEASE_FOUR_UUID}`}
                  >{process.env.REACT_APP_EX_DISEASE_FOUR_NAME}
                </button>
                <button
                  className={styles.button}
                  onClick={(e)=>{
                    setSelectedDisease({ id: process.env.REACT_APP_EX_DISEASE_FIVE_ID, label: process.env.REACT_APP_EX_DISEASE_FIVE_NAME});
                    setPresetURL(e.target.dataset.url);
                  }}
                  data-url={`/results?q=${process.env.REACT_APP_EX_DISEASE_FIVE_UUID}`}
                  >{process.env.REACT_APP_EX_DISEASE_FIVE_NAME}
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


export default Query;
