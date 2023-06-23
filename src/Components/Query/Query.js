import React, {useState, useEffect, useRef, useMemo, useCallback} from "react";
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom';
import QueryBar from "../QueryBar/QueryBar";
import OutsideClickHandler from "../OutsideClickHandler/OutsideClickHandler";
import { incrementHistory } from "../../Redux/historySlice";
import { setCurrentQuery } from "../../Redux/querySlice";
import { setCurrentQueryResultsID, setCurrentResults } from "../../Redux/resultsSlice";
import cloneDeep from "lodash/cloneDeep";
import _ from "lodash";
import { getAutocompleteTerms } from "../../Utilities/autocompleteFunctions";
import { getEntityLink, handleFetchErrors, getLastItemInArray } from "../../Utilities/utilities";
import {ReactComponent as Question} from '../../Icons/Navigation/Question.svg';
import styles from './Query.module.scss';
import { getResultsShareURLPath } from "../../Utilities/resultsInteractionFunctions";

const Query = ({results, loading, initPresetTypeID, initPresetTypeObject = null, initNodeLabelParam, initNodeIdParam}) => {

  // Utilities for navigation and application state dispatch
  const navigate = useNavigate();
  const dispatch = useDispatch();

  loading = (loading) ? true : false;

  // Bool, are the results loading
  const [isLoading, setIsLoading] = useState(loading);
  // Bool, is there an error in the submission
  const [isError, setIsError] = useState(false);
  // String, error text
  const [errorText, setErrorText] = useState('');
  // Int, type id from query var
  const [presetTypeID, setPresetTypeID] = useState(initPresetTypeID);
  // String, input text from query var
  const [inputText, setInputText] = useState(initNodeLabelParam);

  // build initial node from query vars
  const initSelectedNode = (initNodeIdParam && initNodeLabelParam) ? {id: initNodeIdParam, label: initNodeLabelParam} : null;
  const [selectedNode, setSelectedNode] = useState(initSelectedNode);

  const initQueryItem = {
    type: initPresetTypeObject, 
    node: initSelectedNode
  };
  // Array, currently selected query item
  const [queryItem, setQueryItem] = useState(initQueryItem);
  // Array, for use in useEffect hooks with queryItems as a dependency
  var prevQueryItems = useRef([initQueryItem]);

  // Function, type to send to autocomplete for result filtering
  const autocompleteFunctions = useRef(null);
  // Array, List of items to display in the autocomplete window
  const [autocompleteItems, setAutoCompleteItems] = useState(null);
  // Bool, are autocomplete items loading
  const [loadingAutocomplete, setLoadingAutocomplete] = useState(false);
  // Function, delay query for fetching autocomplete items by 750ms each time the user types, so we only send a request once they're done
  const delayedQuery = useMemo(() => _.debounce(
    (inputText, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFunctions) =>
      getAutocompleteTerms(inputText, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFunctions), 750), []
  );

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

  const submitQuery = useCallback(() => {

    const handleRevertQueryItem = (item) => {
      setInputText(item.node.label);
      setPresetTypeID(item.type.id);
      setSelectedNode(item.node);
      setQueryItem(item);
      dispatch(setCurrentQuery(item));
    }

    let timestamp = new Date();

    // Reset the current results in the application state
    dispatch(setCurrentResults({}));
    // Set isLoading to true
    setIsLoading(true);

    let queryJson = JSON.stringify({curie: selectedNode.id, type: queryItem.type.targetType, direction: queryItem.type.direction});

    // submit query to /query
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: queryJson
    };
    fetch('/api/creative_query', requestOptions)
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
        }
        let newQueryPath = getResultsShareURLPath(queryItem.node.label, queryItem.node.id, queryItem.type.id, data.data);

        // If we're submitting from the results page
        if(window.location.href.includes('results')) {

          // set isLoading to false so we can submit another query if we want to
          setIsLoading(false);

          // Then open the new query in a new tab
          window.open( newQueryPath, "_blank", "noopener");

          // reset the query bar back to the values for the current query
          // remove most recently added item (the query item we just submitted)
          let newPrevQueryItems = cloneDeep(prevQueryItems.current).slice(0,-1);
          
          prevQueryItems.current = newPrevQueryItems;

          let originalQueryItem = getLastItemInArray(newPrevQueryItems);
          handleRevertQueryItem(originalQueryItem);
        } else {
          // Otherwise, navigate to the results page 
          navigate(newQueryPath);
        }
      })
      .catch((error) => {
        console.log(error)
      });
  },[dispatch, navigate, queryItem, selectedNode]);

  const updateQueryItem = useCallback((selectedNode = {id:'', label: ''}) => {
    setQueryItem(
      prev => {
        let newQueryItem = {
          type: prev.type,
          node: selectedNode
        }
        dispatch(setCurrentQuery(newQueryItem));
        let newPrevItems = cloneDeep(prevQueryItems.current);
        newPrevItems.push(newQueryItem);
        prevQueryItems.current = newPrevItems;
        return newQueryItem;
      }
    )
  },[dispatch]);

  const handleSetSelectedNode = useCallback((node) => {
    setSelectedNode(node);
    if(node !== null) {
      setInputText(node.label);
      updateQueryItem(node, prevQueryItems.current);
      // Uncomment the below to re-enable click to run query
      // if(readyForSubmission) {
      //   handleSubmission();
      // }
    }
  },[updateQueryItem])

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
    setPresetTypeID(value.id);
    clearAutocompleteItems();
    if(resetInputText || resetInputText === undefined) {
      setQueryItem({node: {}, type: value});
      clearSelectedItem();
    } else {
      setQueryItem((prev) => {return {...prev, type: value}});
    }
  },[clearSelectedItem]);

  // Handler for disease selection (template click or autocomplete item click)
  const handleDiseaseSelection = (disease) => {
    setIsError(false);
    handleSetSelectedNode(disease);

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

    submitQuery();
  }, [selectedNode, submitQuery])

  // Event handler for form submission
  const handleSubmission = useCallback(() => {
    validateSubmission();
  },[validateSubmission])

  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

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
        <div className={`${styles.container}`}>
          {!results &&
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
            results && selectedNode && selectedNode.id &&
            <p className={styles.needHelp}>
              {getEntityLink(selectedNode.id, styles.monarchLink, queryItem.type)}
            </p>
          }
          <p className={styles.needHelp}>
            <a href="/help" rel="noreferrer " target="_blank"><Question/> Need Help?</a>
          </p>

          {!results &&
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
                            data-url={getResultsShareURLPath(item.name, item.id, 0, item.uuid)}
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
          {results &&
          isLoading &&
            <div className="loading-results">
            </div>
          }
      </div>
    </>
  );
}


export default Query;
