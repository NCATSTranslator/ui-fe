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
import { getEntityLink, generateEntityLink, handleFetchErrors, getLastItemInArray } from "../../Utilities/utilities";
import {ReactComponent as Question} from '../../Icons/Navigation/Question.svg';
import {ReactComponent as Drug} from '../../Icons/drug.svg';
import {ReactComponent as Chemical} from '../../Icons/Queries/Chemical.svg';
import {ReactComponent as Gene} from '../../Icons/Queries/Gene.svg';
import {ReactComponent as Back} from '../../Icons/Directional/Undo.svg';
import {ReactComponent as Search} from '../../Icons/Buttons/Search.svg';
import styles from './Query.module.scss';
import { getResultsShareURLPath } from "../../Utilities/resultsInteractionFunctions";
import { queryTypes } from "../../Utilities/queryTypes";
import AutoHeight from "../AutoHeight/AutoHeight";
import { Link, useLocation } from "react-router-dom";

const Query = ({results, loading, initPresetTypeObject = null, initNodeLabelParam, initNodeIdParam, nodeDescription}) => {

  // Utilities for navigation and application state dispatch
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  loading = (loading) ? true : false;

  // Bool, are the results loading
  const [isLoading, setIsLoading] = useState(loading);
  // Bool, is there an error in the submission
  const [isError, setIsError] = useState(false);
  // String, error text
  const [errorText, setErrorText] = useState('');
  // String, input text from query var
  const [inputText, setInputText] = useState(initNodeLabelParam);

  // build initial node from query vars
  const initSelectedNode = (initNodeIdParam && initNodeLabelParam) ? {id: initNodeIdParam, label: initNodeLabelParam} : null;
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
  const limitPrefixes = useRef(null);
  const limitType = useRef(null);
  // Array, List of items to display in the autocomplete window
  const [autocompleteItems, setAutoCompleteItems] = useState(null);
  // Bool, are autocomplete items loading
  const [loadingAutocomplete, setLoadingAutocomplete] = useState(false);
  // Function, delay query for fetching autocomplete items by 750ms each time the user types, so we only send a request once they're done
  const delayedQuery = useMemo(() => _.debounce(
    (inputText, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFunctions, limitType, limitPrefixes) =>
      getAutocompleteTerms(inputText, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFunctions, limitType, limitPrefixes), 750), []
  );

  // String, used to set navigation url for example disease buttons
  const [presetURL, setPresetURL] = useState(false);

  const [exampleDiseases, setExampleDiseases] = useState(null);
  // const [nodeDescription, setNodeDescription] = useState(null);

  const getInitSelectedUpperButton = (presetTypeObject) => {
    if(!presetTypeObject)
    return null;
    let upperButtonId = null;
    let typeId = presetTypeObject.id;
    if(typeId === 0) 
      upperButtonId = 0;
    else if(typeId === 1 || typeId === 2)
      upperButtonId = 1;
    else if(typeId === 3 || typeId === 4)
      upperButtonId = 2;

    return upperButtonId;
  }

  const getInitSelectedLowerButton = (presetTypeObject) => {
    if(!presetTypeObject)
      return null;
    let lowerButtonId = null;
    let typeId = presetTypeObject.id;

    if(typeId === 0)
      lowerButtonId = null;
    else if(typeId % 2 === 0) 
      lowerButtonId = 1;
    else
      lowerButtonId = 0;
    
    return lowerButtonId;
  }

  const initSelectedUpperButton = getInitSelectedUpperButton(initPresetTypeObject);
  const initSelectedLowerButton = getInitSelectedLowerButton(initPresetTypeObject);
  const [selectedUpperButton, setSelectedUpperButton] = useState(initSelectedUpperButton);
  const [selectedLowerButton, setSelectedLowerButton] = useState(initSelectedLowerButton);

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

  const submitQuery = (item) => {

    const handleRevertQueryItem = (item) => {
      setInputText(item.node.label);
      setQueryItem(item);
      dispatch(setCurrentQuery(item));
    }

    let timestamp = new Date();

    // Reset the current results in the application state
    dispatch(setCurrentResults({}));
    // Set isLoading to true
    setIsLoading(true);

    let queryJson = JSON.stringify({curie: item.node.id, type: item.type.targetType, direction: item.type.direction});

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
                item: item,
                date: timestamp.toDateString(),
                time: timestamp.toLocaleTimeString([], {hour12: true, hour: 'numeric', minute:'2-digit'}),
                id: data.data
              }
            )
          );
        }
        let newQueryPath = getResultsShareURLPath(item.node.label, item.node.id, item.type.id, data.data);

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
  }

  const updateQueryItem = (selectedNode = {id:'', label: ''}) => {
    setInputText(selectedNode.label);
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

        if(selectedNode.id !== '' && selectedNode.label !== '') {
          handleSubmission(newQueryItem);
        }
        return newQueryItem;
      }
    )
  }

  // Event handler called when search bar is updated by user
  const handleQueryItemChange = useCallback((e) => {
    if(Object.keys(queryItem.type).length) {
      delayedQuery(e, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFunctions.current, limitType.current, limitPrefixes.current);
      setInputText(e);
    } else {
      setIsError(true);
    }
  },[setLoadingAutocomplete, setAutoCompleteItems, setInputText, setIsError, delayedQuery, queryItem.type]);

  const clearAutocompleteItems = () => {
    setAutoCompleteItems(null);
  }

  const clearSelectedItem = () => {
    updateQueryItem();
  }

  const handleQueryTypeChange = (value, resetInputText) => {
    setIsError(false);
    const newQueryType = queryTypes.find(type => {
      return type.id === parseInt(value)
    })
    autocompleteFunctions.current = newQueryType.functions;
    limitType.current = newQueryType.filterType;
    limitPrefixes.current = newQueryType.limitPrefixes;
    clearAutocompleteItems();
    if(resetInputText || resetInputText === undefined) {
      setQueryItem({node: {}, type: newQueryType});
      clearSelectedItem();
    } else {
      setQueryItem((prev) => {return {...prev, type: newQueryType}});
    }
  }

  // Handler for disease selection (template click or autocomplete item click)
  const handleItemSelection = (disease) => {
    setIsError(false);
    updateQueryItem(disease);

    if(autocompleteItems) {
      clearAutocompleteItems();
    }
  }

  // Validation function for submission
  const validateSubmission = (item) => {
    if(item.node === null || item.node.id === "") {
      setIsError(true);
      setErrorText("No term selected, please select a valid term.");
      return;
    }
    if(item.type === null || item.type.id === "") {
      setIsError(true);
      setErrorText("No query type selected, please select a valid query type.");
      return;
    }

    submitQuery(item);
  }

  // Event handler for form submission
  const handleSubmission = (item) => {
    validateSubmission(item);
  }

  const handleSelectUpperButton = (index) => {
    setSelectedLowerButton(null);
    setSelectedUpperButton(index);

    // if we've picked drug/disease, set the query type to 0 and reset the input text
    if(index === 0) {
      handleQueryTypeChange(0, true);
    }
  }

  const handleSelectLowerButton = (index, prevIndex) => {
    setSelectedLowerButton(index);
    // if prevIndex is null, we're coming from another upper button, so reset the input text. otherwise keep it the same.
    const resetInputText = (prevIndex === null) ? true : false;
    switch (selectedUpperButton) {
      case 1:
        if(index === 0)
          handleQueryTypeChange(1, resetInputText);
        else 
          handleQueryTypeChange(2, resetInputText);
        break;
      case 2:
        if(index === 0)
          handleQueryTypeChange(3, resetInputText);
        else 
          handleQueryTypeChange(4, resetInputText);
        break;
      default:
        break;
    }
  }

  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  useEffect(() => {
    if(presetURL) {
      const timer = setTimeout(() => {
        let cleanedURL = presetURL.replaceAll("//", "/");
        navigate(cleanedURL);
      }, 100 );
      return () => {
        clearTimeout(timer);
      }
    }
  }, [presetURL, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <div className={`${styles.query}`} >
        <AutoHeight className={styles.autoHeightContainer}>
          <div className={`${styles.container}`}>
            {results 
              ?
              <>
                <div className={styles.resultsHeader}>
                  <div className={styles.buttons}>
                    <Link to={`${pathname.includes("main")? '/main' : '/demo' }`} className={styles.button}><Back/>Return To Home Page</Link>
                    <Link to={`${pathname.includes("main")? '/main' : '/demo' }`} target="_blank" className={`${styles.button} ${styles.buttonTwo}`}><Search className={styles.svgFillWhite}/>Submit Another Query</Link>
                  </div>
                  <div className={styles.showingResultsContainer}>
                    <div>
                      <h4 className={styles.showingResultsText}>Showing results for:</h4>
                      <h5 className={styles.subHeading}>{queryItem.type.label}: 
                        {(queryItem?.node?.id &&
                          generateEntityLink(queryItem.node.id, styles.searchedTerm, ()=>queryItem.node.label, false)) 
                          ?
                            generateEntityLink(queryItem.node.id, styles.searchedTerm, ()=>queryItem.node.label, false)
                          :
                            <span className={styles.searchedTerm}>{queryItem.node.label}</span>
                        }
                      </h5>
                    </div>
                    <div className={styles.nodeDescriptionContainer}>
                      {
                        nodeDescription && 
                        <>
                          <p className={styles.nodeDescriptionHeading}>Description:</p>
                          <p className={styles.nodeDescription}>{nodeDescription}</p>
                        </>
                      }
                    </div>
                  </div>
                </div>
              </>
              :
              <>
                <h4 className={styles.heading}>What relationship would you like to explore?</h4>
                <div className={styles.upperButtons}>
                  <button className={`${styles.upperButton} ${selectedUpperButton === 0 ? styles.selected : ''}`} onClick={()=>handleSelectUpperButton(0)}>
                    <Drug />Drug/Disease
                  </button>
                  <button className={`${styles.upperButton} ${selectedUpperButton === 1 ? styles.selected : ''}`} onClick={()=>handleSelectUpperButton(1)}>
                    <Chemical />Chemical/Gene
                  </button>
                  <button className={`${styles.upperButton} ${selectedUpperButton === 2 ? styles.selected : ''}`} onClick={()=>handleSelectUpperButton(2)}>
                    <Gene />Gene/Chemical
                  </button>
                </div>
                {(selectedUpperButton && selectedUpperButton > 0)
                  ? 
                    <div className={`${styles.lowerButtons} visible`}>
                      <button className={`${styles.lowerButton} ${selectedLowerButton === 0 ? styles.selected : ''}`} onClick={()=>handleSelectLowerButton(0, selectedLowerButton)}>
                        Upregulators
                      </button>
                      <button className={`${styles.lowerButton} ${selectedLowerButton === 1 ? styles.selected : ''}`} onClick={()=>handleSelectLowerButton(1, selectedLowerButton)}>
                        Downregulators
                      </button>
                    </div>
                  :
                    <div className={`${styles.lowerButtons}`}></div>
                }
                {isError &&
                  <p className={styles.error}>{errorText}</p>
                }
                {(selectedLowerButton !== null || selectedUpperButton === 0) &&
                  <OutsideClickHandler onOutsideClick={()=>{clearAutocompleteItems();}}>
                    <QueryBar
                      handleSubmission={handleSubmission}
                      handleChange={handleQueryItemChange}
                      handleQueryTypeChange={handleQueryTypeChange}
                      value={inputText}
                      queryType={queryItem.type}
                      autocompleteItems={autocompleteItems}
                      autocompleteLoading={loadingAutocomplete}
                      handleItemClick={handleItemSelection}
                    />
                  </OutsideClickHandler>
                }

                {selectedUpperButton === 0 &&
                  <div className={styles.examples}>
                    {exampleDiseases && Array.isArray(exampleDiseases) &&
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
              </>
            }
            {queryItem?.node?.id &&
              <p className={styles.needHelp}>
                {getEntityLink(queryItem.node.id, styles.monarchLink, queryItem.type)}
              </p>
            }
            <p className={styles.needHelp}>
              <a href="/help" rel="noreferrer " target="_blank"><Question/> Need Help?</a>
            </p>
          </div>
        </AutoHeight>
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
