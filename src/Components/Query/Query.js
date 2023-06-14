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
import { queryTypes } from "../../Utilities/queryTypes";
import { getEntityLink, handleFetchErrors } from "../../Utilities/utilities";
import {ReactComponent as Question} from '../../Icons/Navigation/Question.svg';
import styles from './Query.module.scss';

const Query = ({results, loading}) => {

  // Utilities for navigation and application state dispatch
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

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

  let blankQueryItem = {type:{}, node:{}};
  // Get the current query from the application state
  let storedQuery = useSelector(currentQuery);
  storedQuery = (storedQuery !== undefined && isResults) ? storedQuery : blankQueryItem;
  // Array, currently selected query items
  const [queryItem, setQueryItem] = useState(storedQuery);
  // Function, type to send to autocomplete for result filtering
  const autocompleteFunctions = useRef(null);
  // Array, for use in useEffect hooks with queryItems as a dependency
  var prevQueryItem = useRef(storedQuery);

  let presetInputText =
    (Object.keys(prevQueryItem.current).length && isResults)
    ? prevQueryItem.current.node.label
    : '';
  const [inputText, setInputText] = useState(presetInputText);

  const presetQueryTypeIDParam = searchParams.get('t');
  const initPresetTypeID = (presetQueryTypeIDParam)
    ? presetQueryTypeIDParam
    : (Object.keys(prevQueryItem.current).length && isResults) ? prevQueryItem.current.type.id : null;
  const [presetTypeID, setPresetTypeID] = useState(initPresetTypeID);

  const presetDiseaseLabelParam = searchParams.get("l")
  const initSelectedNode = (presetDiseaseLabelParam) ? {id: '', label:presetDiseaseLabelParam}: null;
  const [selectedNode, setSelectedNode] = useState(initSelectedNode);

  // Array, List of items to display in the autocomplete window
  const [autocompleteItems, setAutoCompleteItems] = useState(null);
  // Bool, are autocomplete items loading
  const [loadingAutocomplete, setLoadingAutocomplete] = useState(false);
  // Function, delay query for fetching autocomplete items by 750ms each time the user types, so we only send a request once they're done
  const delayedQuery = useMemo(() => _.debounce(
    (inputText, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFunctions) =>
      getAutocompleteTerms(inputText, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFunctions), 750), []
  );

  // Bool, since the query will be submitted whenever a query item is selected, use this to distinguish between
  // when a user selected a query item, or if the query item is manually updated when /creative_results returns
  // the final name for the submitted disease
  const [readyForSubmission, setReadyForSubmission] = useState(false);

  // String, used to set navigation url for example disease buttons
  const [presetURL, setPresetURL] = useState(false);

  const [exampleDiseases, setExampleDiseases] = useState(null);

  // Get example diseases from config endpoint on component mount
  useEffect(() => {
    const requestOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    };
    fetch('/config', requestOptions)
    .then(response => handleFetchErrors(response))
    .then(response => response.json())
    .then(data => {
      if(data)
        setExampleDiseases(data);
    });
  }, []);

  const updateQueryItem = useCallback((selectedNode = {id:'', label: ''}) => {
    setQueryItem(
      prev => {
        return {
          type: prev.type,
          node: selectedNode
        }
      }
    )
  },[]);

  const handleSetSelectedNode = useCallback((node) => {
    setSelectedNode(node);
    if(selectedNode !== null) {
      setInputText(selectedNode.label);
      updateQueryItem(selectedNode);
      // Uncomment the below to re-enable click to run query
      // if(readyForSubmission) {
      //   setReadyForSubmission(false);
      //   handleSubmission();
      // }
    }
  },[updateQueryItem, selectedNode])

  // Event handler called when search bar is updated by user
  const handleQueryItemChange = useCallback((e) => {
    if(Object.keys(queryItem.type).length) {
      delayedQuery(e, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFunctions.current);
      setInputText(e);
    } else {
      setIsError(true);
      setErrorText("No query selected, please select a query from the dropdown.");
    }
  },[setLoadingAutocomplete, setAutoCompleteItems, setInputText, setIsError, setErrorText, delayedQuery, queryItem.type]);

  const clearAutocompleteItems = () => {
    setAutoCompleteItems(null);
  }

  const clearSelectedItem = useCallback(() => {
    handleSetSelectedNode(null);
    setInputText('');
  }, [handleSetSelectedNode]);

  const handleQueryTypeChange = useCallback((value, resetInputText) => {
    setIsError(false);
    autocompleteFunctions.current = value.functions;
    setQueryItem((prev) => {return {...prev, type: value}});
    setPresetTypeID(value.id);
    clearAutocompleteItems();
    if(resetInputText || resetInputText === undefined)
      clearSelectedItem();
  },[clearSelectedItem]);

  // Handler for disease selection (template click or autocomplete item click)
  const handleDiseaseSelection = (disease) => {
    setIsError(false);
    handleSetSelectedNode(disease);
    setReadyForSubmission(true);

    if(autocompleteItems) {
      clearAutocompleteItems();
    }
  }

  // Validation function for submission
  const validateSubmission = useCallback(() => {
    if(selectedNode === null || selectedNode.id === "") {
      setIsError(true);
      setErrorText("No term selected, please select a valid term.");
      return;
    }

    setIsValidSubmission(true);
  }, [selectedNode])

  // Event handler for form submission
  const handleSubmission = useCallback(() => {
    validateSubmission();
  },[validateSubmission])

  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  useEffect(() => {
    if(selectedNode !== null) {
      setInputText(selectedNode.label);
      updateQueryItem(selectedNode);
      // Uncomment the below to re-enable click to run query
      // if(readyForSubmission) {
      //   setReadyForSubmission(false);
      //   handleSubmission();
      // }
    }

  }, [selectedNode, readyForSubmission, handleSubmission, updateQueryItem]);

  /*
    When the query items change, update the current query in the app state
  */
  useEffect(() => {
    // since useEffect dependency update checks don't work on objects (thanks to shallow equals)
    // check to see if queryItems has actually been updated, if not return
    if(prevQueryItem.current.node === undefined || isEqual(prevQueryItem.current, queryItem))
      return;

    // If the node ids match, but the new queryItem has no type, don't replace
    // (addresses strange behavior with) template queries and share urls
    if(prevQueryItem.current.node.id === queryItem.node.id && Object.keys(queryItem.type).length === 0)
      return;

    prevQueryItem.current = cloneDeep(queryItem);

    // if the current query items and the stored query match, return
    if(isEqual(queryItem, storedQuery))
      return;

    // otherwise, update the stored query in the app state
    dispatch(setCurrentQuery(queryItem));
  }, [queryItem, storedQuery, dispatch]);

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

      let queryJson = JSON.stringify({curie: selectedNode.id, type: queryItem.type.targetType, direction: queryItem.type.direction});

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
                  item: queryItem,
                  date: timestamp.toDateString(),
                  time: timestamp.toLocaleTimeString([], {hour12: true, hour: 'numeric', minute:'2-digit'}),
                  id: data.data
                }
              )
            );
            setIsValidSubmission(false);
          }
          // If we're submitting from the results page
          if(window.location.href.includes('results')) {
            
            // reset the query bar back to the values for the current query
            let prevTypeID = searchParams.get("t");
            let prevLabel = searchParams.get("l");

            if(prevLabel) {
              setInputText(prevLabel);
              console.log(prevLabel);
            }
            if(prevTypeID !== undefined) {
              let newType = queryTypes.find(type => {
                return type.id === parseInt(prevTypeID)
              })
              let newQueryItem = {node:{id:'', label: prevLabel}, type: newType};
              
              setQueryItem(newQueryItem);
            }
            
            // set isLoading to false so we can submit another query if we want to
            setIsLoading(false);

            // Then open the new query in a new tab 
            window.open( 
              `results?l=${queryItem.node.label}&t=${queryItem.type.id}&q=${data.data}`, "_blank", "noopener");
          } else {
            // Otherwise, navigate to the results page and set loading to true
            navigate('/results?loading=true');
          }
        })
        .catch((error) => {
          console.log(error)
        });
    }

  }, [isValidSubmission, dispatch, queryItem, storedQuery, 
    selectedNode, navigate, searchParams, setSearchParams])

  useEffect(() => {
    if(presetURL) {
      const timer = setTimeout(() => {
        navigate(presetURL);
      }, 100 );
      return () => {
        clearTimeout(timer);
      }
    }
  }, [selectedNode, presetURL, navigate]);

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
          <OutsideClickHandler onOutsideClick={()=>{clearAutocompleteItems();}}>
            <QueryBar
              handleSubmission={handleSubmission}
              handleChange={handleQueryItemChange}
              handleQueryTypeChange={handleQueryTypeChange}
              isDisabled={isLoading}
              value={inputText}
              presetTypeID={presetTypeID}
              autocompleteItems={autocompleteItems}
              autocompleteLoading={loadingAutocomplete}
              handleItemClick={handleDiseaseSelection}
            />
          </OutsideClickHandler>
          {
            isResults && selectedNode && selectedNode.id &&
            <p className={styles.needHelp}>
              {getEntityLink(selectedNode.id, styles.monarchLink, queryItem.type)}
            </p>
          }
          <p className={styles.needHelp}>
            <a href="/help" rel="noreferrer " target="_blank"><Question/> Need Help?</a>
          </p>

          {!isResults &&
            <div className={styles.examples}>
              {
                exampleDiseases && Array.isArray(exampleDiseases) &&
                <>
                  <p className={styles.subTwo}>Example Diseases:</p>
                  <div className={styles.exampleList}>
                    {
                      exampleDiseases.map((item, i)=> {
                        return(
                          <button
                            className={styles.button}
                            onClick={(e)=>{
                              setPresetURL(e.target.dataset.url);
                            }}
                            data-testid={item.name}
                            data-url={`/results?l=${encodeURIComponent(item.name)}&t=0&q=${item.uuid}`}
                            >
                            {item.name}
                        </button>
                        )
                      })
                    }
                  </div>
                </>
              }
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
