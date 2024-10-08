import {useState, useEffect, useRef, useMemo, useCallback} from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from "react-router-dom";
import QueryBar from "../QueryBar/QueryBar";
import ExampleQueryList from "../ExampleQueryList/ExampleQueryList";
import QuerySelect from "../QuerySelect/QuerySelect";
import OutsideClickHandler from "../OutsideClickHandler/OutsideClickHandler";
import AutoHeight from "../AutoHeight/AutoHeight";
import { queryTypes } from "../../Utilities/queryTypes";
import { incrementHistory } from "../../Redux/historySlice";
import { currentConfig, currentUser } from "../../Redux/rootSlice";
import { setCurrentQuery } from "../../Redux/querySlice";
import { currentQueryTimestamp, setCurrentQueryResultsID, setCurrentResults } from "../../Redux/resultsSlice";
import { getResultsShareURLPath } from "../../Utilities/resultsInteractionFunctions";
import cloneDeep from "lodash/cloneDeep";
import _ from "lodash";
import { filterAndSortExamples, getAutocompleteTerms } from "../../Utilities/autocompleteFunctions";
import { getEntityLink, generateEntityLink, getLastItemInArray, getFormattedDate, isValidDate } from "../../Utilities/utilities";
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import ShareIcon from '../../Icons/Buttons/Link.svg?react';
import Button from "../Core/Button";
import { ToastContainer, toast, Slide } from 'react-toastify';
import styles from './Query.module.scss';
import { API_PATH_PREFIX } from "../../Utilities/userApi";

const Query = ({results, loading, initPresetTypeObject = null, initNodeLabelParam, initNodeIdParam, nodeDescription, setShareModalFunction}) => {

  // Utilities for navigation and application state dispatch
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const config = useSelector(currentConfig);
  const user = useSelector(currentUser);
  const queryTimestamp = useSelector(currentQueryTimestamp);
  const nameResolverEndpoint = (config?.name_resolver) ? `${config.name_resolver}/lookup` : 'https://name-lookup.transltr.io/lookup';
  loading = (loading) ? true : false;

  // Bool, are the results loading
  const [isLoading, setIsLoading] = useState(loading);
  // Bool, is there an error in the submission
  const [isError, setIsError] = useState(false);
  // String, error text
  const [errorText, setErrorText] = useState('');
  // String, input text from query var
  const [inputText, setInputText] = useState(initNodeLabelParam);

  initPresetTypeObject = (initPresetTypeObject === null) ? queryTypes[0] : initPresetTypeObject;
  const initAutocompleteFunctions = (initPresetTypeObject === null) ? null : initPresetTypeObject.functions;
  const initLimitType = (initPresetTypeObject === null) ? null : initPresetTypeObject.filterType;
  const initLimitPrefixes = (initPresetTypeObject === null) ? null : initPresetTypeObject.limitPrefixes;
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
  const autocompleteFunctions = useRef(initAutocompleteFunctions);
  const limitPrefixes = useRef(initLimitPrefixes);
  const limitTypes = useRef([initLimitType]);
  // Array, List of items to display in the autocomplete window
  const [autocompleteItems, setAutoCompleteItems] = useState(null);
  // Bool, are autocomplete items loading
  const [loadingAutocomplete, setLoadingAutocomplete] = useState(false);
  // Function, delay query for fetching autocomplete items by 750ms each time the user types, so we only send a request once they're done
  const delayedQuery = useMemo(() => _.debounce(
    (inputText, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFunctions, limitTypes, limitPrefixes, endpoint) =>
      getAutocompleteTerms(inputText, setLoadingAutocomplete, setAutoCompleteItems, 
        autocompleteFunctions, limitTypes, limitPrefixes, endpoint), 750), []
  );

  // String, used to set navigation url for example disease buttons
  const [presetURL, setPresetURL] = useState(false);

  const exampleDiseases = (!config?.cached_queries) 
    ? null
    : filterAndSortExamples(config.cached_queries, 'drug');
  const exampleChemsUp = (!config?.cached_queries) 
    ? null
    : filterAndSortExamples(config.cached_queries, 'gene', 'increased');
  const exampleChemsDown = (!config?.cached_queries) 
    ? null
    : filterAndSortExamples(config.cached_queries, 'gene', 'decreased');
  const exampleGenesUp = (!config?.cached_queries) 
    ? null
    : filterAndSortExamples(config.cached_queries, 'chemical', 'increased');
  const exampleGenesDown = (!config?.cached_queries) 
    ? null
    : filterAndSortExamples(config.cached_queries, 'chemical', 'decreased');

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
    fetch(`${API_PATH_PREFIX}/query`, requestOptions)
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
        let newQueryPath = getResultsShareURLPath(item.node.label, item.node.id, item.type.id, '0', data.data);

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
        toast.error(
          <div>
            <h5 className='heading'>Error</h5>
            <p>We were unable to submit your query at this time. Please attempt to submit it again or try again later.</p>
          </div>
        );
        setIsLoading(false);
        clearSelectedItem();
        console.log(error)
      });
  }

  const updateQueryItem = (selectedNode = {id:'', label: ''}) => {
    // add in match text for genes, which should be the species
    if(selectedNode.id.includes("NCBIGene") && selectedNode?.match)
      selectedNode.label += ` (${selectedNode.match})`;

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

        // automatically submits when item is clicked in autocomplete
        // if(selectedNode.id !== '' && selectedNode.label !== '') {
        //   handleSubmission(newQueryItem);
        // }
        return newQueryItem;
      }
    )
  }

  // Event handler called when search bar is updated by user
  const handleQueryItemChange = useCallback((e) => {
    if(Object.keys(queryItem.type).length) {
      delayedQuery(e, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFunctions.current, limitTypes.current, limitPrefixes.current, nameResolverEndpoint);
      setInputText(e);
    } else {
      setIsError(true);
    }
  },[setLoadingAutocomplete, setAutoCompleteItems, setInputText, setIsError, delayedQuery, queryItem.type, nameResolverEndpoint]);

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
    limitTypes.current = [newQueryType.filterType];
    limitPrefixes.current = newQueryType.limitPrefixes;
    clearAutocompleteItems();
    if(resetInputText || resetInputText === undefined) {
      setQueryItem({node: {}, type: newQueryType});
      clearSelectedItem();
    } else {
      setQueryItem((prev) => {return {...prev, type: newQueryType}});
    }
  }

  // Handler for item selection (template click or autocomplete item click)
  const handleItemSelection = (item) => {
    setIsError(false);
    updateQueryItem(item);

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
    if(!item)
      validateSubmission(queryItem);
    else  
      validateSubmission(item);
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
      <ToastContainer
        position="top-center"
        autoClose={3000}
        theme="light"
        transition={Slide}
        pauseOnFocusLoss={false}
        hideProgressBar
        className="toastContainer"
        closeOnClick={false}
        closeButton={false}
      />
        <AutoHeight className={styles.autoHeightContainer} duration={0}>
          <div className={`${styles.container}`}>
            {results 
              ?
              <>
                <div className={styles.resultsHeader}>
                  <div className={styles.showingResultsContainer}>
                      <h6 className={styles.subHeading}>{queryItem.type.label.replaceAll("a disease?", "").replaceAll("a chemical?", "").replaceAll("a gene?", "")}
                        {(queryItem?.node?.id && 
                          generateEntityLink(queryItem.node.id, styles.searchedTerm, ()=>queryItem.node.label, false)) 
                          ?
                            generateEntityLink(queryItem.node.id, styles.searchedTerm, ()=>queryItem.node.label, false)
                          :
                            <span className={styles.searchedTerm}>{queryItem.node && queryItem.node.label}</span>
                        }
                        ?
                      </h6>
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
                <h3 className={styles.h3}>Translator finds associations between drugs, genes, and diseases</h3>
                <h6 className={styles.h6}>Select a question and enter a search term to get started</h6>
                {
                  isError &&
                  <p className={styles.error}>{errorText}</p>
                }
                {
                  <OutsideClickHandler onOutsideClick={()=>{clearAutocompleteItems();}} className={styles.queryBarContainer}>
                    <QuerySelect
                      label=""
                      name="Select a question"
                      handleChange={(val)=>{
                        handleQueryTypeChange(val, true);
                      }}
                      noanimate
                      >
                        {
                          queryTypes.map((type, i) => {
                            return(
                              <option value={type.id} key={type.id}>
                                <span modifiedName={type.label.replaceAll("a disease?", "...").replaceAll("a chemical?", "...").replaceAll("a gene?", "...")}>
                                  { type.label } 
                                </span>
                              </option>
                            )
                          })
                        }
                    </QuerySelect>
                    <QueryBar
                      handleSubmission={handleSubmission}
                      handleChange={handleQueryItemChange}
                      handleQueryTypeChange={handleQueryTypeChange}
                      value={inputText}
                      queryType={queryItem.type}
                      queryItem={queryItem}
                      autocompleteItems={autocompleteItems}
                      autocompleteLoading={loadingAutocomplete}
                      handleItemClick={handleItemSelection}
                      disabled={user === null ? true : false}
                      placeholderText={user === null ? "Log In to Enter a Search Term" : false}
                    />
                    { 
                      <img src={loadingIcon} className={`${styles.loadingIcon} ${isLoading ? styles.active : ''} loadingIcon`} alt="loading icon"/>
                    }
                  </OutsideClickHandler>
                }
                {/* Example Diseases */}
                {
                  queryItem.type.id === 0 &&
                  <ExampleQueryList 
                    examples={exampleDiseases} 
                    setPresetURL={setPresetURL} 
                    label="Example Diseases:"
                  />
                }
                {/* Examples for chemicals UPregulated by a particular gene */}
                {
                  queryItem.type.id === 1 &&
                  <ExampleQueryList 
                    examples={exampleGenesUp} 
                    setPresetURL={setPresetURL} 
                    label="Example Genes:"
                  />
                }
                {/* Examples for chemicals DOWNregulated by a particular gene */}
                {
                  queryItem.type.id === 2 &&
                  <ExampleQueryList 
                    examples={exampleGenesDown} 
                    setPresetURL={setPresetURL} 
                    label="Example Genes:"
                  />
                }
                {/* Examples for genes UPregulated by a particular chemical */}
                {
                  queryItem.type.id === 3 &&
                  <ExampleQueryList 
                    examples={exampleChemsUp} 
                    setPresetURL={setPresetURL} 
                    label="Example Chemicals:"
                  />
                }
                {/* Examples for genes DOWNregulated by a particular chemical */}
                {
                  queryItem.type.id === 4 &&
                  <ExampleQueryList 
                    examples={exampleChemsDown} 
                    setPresetURL={setPresetURL} 
                    label="Example Chemicals:"
                  />
                }
              </>
            }
            {
              results &&
              <div className={styles.bottom}>
                <div className="left">
                  {
                    queryItem?.node?.id &&
                    <p className={styles.nodeLink}>
                      {getEntityLink(queryItem.node.id, styles.nodeLinkAnchor, queryItem.type)}
                    </p>
                  }
                  <div className={`${styles.timestamp} ${queryTimestamp && styles.active}`}>
                    {
                      queryTimestamp && isValidDate(queryTimestamp) && results &&
                      <p>Submitted {getFormattedDate(queryTimestamp)}</p>
                    }
                  </div>
                </div>
                <div className="right">
                  <Button 
                    isSecondary
                    handleClick={()=>{setShareModalFunction(true)}}
                  >
                    <ShareIcon/>Share Result Set
                  </Button>
                </div>
              </div>
            }
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
