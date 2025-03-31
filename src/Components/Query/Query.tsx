import { useState, useEffect, useRef, useMemo, useCallback, FC, Dispatch, SetStateAction } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from "react-router-dom";
import { AutocompleteFunctions, AutocompleteItem, QueryType } from "../../Types/querySubmission";
import QueryBar, { QueryItem } from "../QueryBar/QueryBar";
import ExampleQueryList from "../ExampleQueryList/ExampleQueryList";
import QuerySelect from "../QuerySelect/QuerySelect";
import OutsideClickHandler from "../OutsideClickHandler/OutsideClickHandler";
import AutoHeight from "../AutoHeight/AutoHeight";
import { queryTypes } from "../../Utilities/queryTypes";
import { incrementHistory } from "../../Redux/historySlice";
import { currentConfig, currentUser } from "../../Redux/userSlice";
import { setCurrentQuery } from "../../Redux/querySlice";
import { getResultsShareURLPath } from "../../Utilities/resultsInteractionFunctions";
import cloneDeep from "lodash/cloneDeep";
import _ from "lodash";
import { filterAndSortExamples, getAutocompleteTerms } from "../../Utilities/autocompleteFunctions";
import { getEntityLink, getLastItemInArray } from "../../Utilities/utilities";
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import ShareIcon from '../../Icons/Buttons/Link.svg?react';
import ExternalLink from '../../Icons/Buttons/External Link.svg?react';
import Button from "../Core/Button";
import { ToastContainer, toast, Slide } from 'react-toastify';
import styles from './Query.module.scss';
import { API_PATH_PREFIX } from "../../Utilities/userApi";
import Tooltip from "../Tooltip/Tooltip";
import EntityLink from "../EntityLink/EntityLink";
import ResultsSummaryButton from "../ResultsSummaryButton/ResultsSummaryButton";
import { Result } from "../../Types/results";

interface QueryProps {
  isResults: boolean;
  loading: boolean;
  initPresetTypeObject?: QueryType | null;
  initNodeLabelParam: string | null;
  initNodeIdParam: string | null;
  nodeDescription: string | null;
  setShareModalFunction: Dispatch<SetStateAction<boolean>>;
  results: Result[];
  handleResultMatchClick: Function;
  pk: string;
}

const Query: FC<QueryProps> = ({
  isResults,
  loading,
  initPresetTypeObject = null,
  initNodeLabelParam,
  initNodeIdParam,
  nodeDescription,
  setShareModalFunction,
  results,
  handleResultMatchClick,
  pk
}) => {
  // Utilities for navigation and application state dispatch
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const config = useSelector(currentConfig);
  const user = useSelector(currentUser);
  const nameResolverEndpoint = config?.name_resolver ? `${config.name_resolver}/lookup` : 'https://name-lookup.transltr.io/lookup';
  loading = !!loading;

  const [isLoading, setIsLoading] = useState<boolean>(loading);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');
  const [inputText, setInputText] = useState<string>(!!initNodeLabelParam ? initNodeLabelParam : "");

  initPresetTypeObject = initPresetTypeObject || queryTypes[0];
  const initAutocompleteFunctions = initPresetTypeObject?.functions || null;
  const initLimitType = initPresetTypeObject?.filterType || null;
  const initLimitPrefixes = initPresetTypeObject?.limitPrefixes || null;
  const initSelectedNode = initNodeIdParam && initNodeLabelParam ? { id: initNodeIdParam, label: initNodeLabelParam, match: "", types: [] } : null;
  const initQueryItem: QueryItem = {
    type: initPresetTypeObject,
    node: initSelectedNode
  };

  const [queryItem, setQueryItem] = useState<QueryItem>(initQueryItem);
  const prevQueryItems = useRef<QueryItem[]>([initQueryItem]);

  const autocompleteFunctions = useRef(initAutocompleteFunctions);
  const limitPrefixes = useRef(initLimitPrefixes);
  const limitTypes = useRef(!!initLimitType ? [initLimitType] : []);
  const [autocompleteItems, setAutoCompleteItems] = useState<AutocompleteItem[] | null>(null);
  const [loadingAutocomplete, setLoadingAutocomplete] = useState<boolean>(false);
  const delayedQuery = useMemo(
    () =>
      _.debounce(
        (
          inputText: string,
          setLoadingAutocomplete: Dispatch<SetStateAction<boolean>>,
          setAutoCompleteItems: Dispatch<SetStateAction<AutocompleteItem[] | null>>,
          autocompleteFunctions: AutocompleteFunctions,
          limitTypes: string[],
          limitPrefixes: string[],
          endpoint: string
        ) => {
          getAutocompleteTerms(inputText, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFunctions, limitTypes, limitPrefixes, endpoint);
        },
        750
      ),
    []
  );

  const [presetURL, setPresetURL] = useState<string | false>(false);

  const exampleDiseases = config?.cached_queries ? filterAndSortExamples(config.cached_queries, 'drug') : null;
  const exampleChemsUp = config?.cached_queries ? filterAndSortExamples(config.cached_queries, 'gene', 'increased') : null;
  const exampleChemsDown = config?.cached_queries ? filterAndSortExamples(config.cached_queries, 'gene', 'decreased') : null;
  const exampleGenesUp = config?.cached_queries ? filterAndSortExamples(config.cached_queries, 'chemical', 'increased') : null;
  const exampleGenesDown = config?.cached_queries ? filterAndSortExamples(config.cached_queries, 'chemical', 'decreased') : null;

  const resultsPaneQuestionText = queryItem.type.label.replaceAll("a disease?", "").replaceAll("a chemical?", "").replaceAll("a gene?", "");

  const submitQuery = (item: QueryItem) => {
    const handleRevertQueryItem = (item: QueryItem) => {
      if(!!item?.node) {
        setInputText(item.node.label);
        setQueryItem(item);
        dispatch(setCurrentQuery(item));
      }
    };

    let timestamp = new Date();
    setIsLoading(true);

    if(!item?.node) {
      console.error("no node attached to query item, unable to submit");
      return;
    }

    const queryJson = JSON.stringify({
      curie: item.node.id,
      type: item.type.targetType,
      direction: item.type.direction,
    });

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: queryJson,
    };

    fetch(`${API_PATH_PREFIX}/query`, requestOptions)
      .then((response) => response.json())
      .then((data) => {
        if (data.data && data.status === 'success') {
          dispatch(
            incrementHistory({
              item: item,
              date: timestamp.toDateString(),
              time: timestamp.toLocaleTimeString([], { hour12: true, hour: 'numeric', minute: '2-digit' }),
              id: data.data,
            })
          );
          let nodeLabel = !!item?.node ? item.node.label : "";
          let nodeID = !!item?.node ? item.node.id : "";
          const newQueryPath = getResultsShareURLPath(nodeLabel, nodeID, item.type.id, '0', data.data);

          if (window.location.href.includes('results')) {
            setIsLoading(false);
            window.open(newQueryPath, "_blank", "noopener");
            const newPrevQueryItems = cloneDeep(prevQueryItems.current).slice(0, -1);
            prevQueryItems.current = newPrevQueryItems;
            const originalQueryItem = getLastItemInArray(newPrevQueryItems);
            handleRevertQueryItem(originalQueryItem);
          } else {
            navigate(newQueryPath);
          }
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
        clearInputText();
        console.error(error);
      });
  };

  const updateQueryItem = (selectedNode: AutocompleteItem | null = null) => {
    if (!selectedNode) return;
    if (selectedNode.id.includes("NCBIGene") && selectedNode?.match) {
      selectedNode.label += ` (${selectedNode.match})`;
    }

    setInputText(selectedNode.label);
    setQueryItem((prev) => {
      const newQueryItem = { type: prev.type, node: selectedNode };
      dispatch(setCurrentQuery(newQueryItem));
      const newPrevItems = cloneDeep(prevQueryItems.current);
      newPrevItems.push(newQueryItem);
      prevQueryItems.current = newPrevItems;
      return newQueryItem;
    });
  };

  const handleQueryItemChange = useCallback(
    (e: string) => {
      if (Object.keys(queryItem.type).length) {
        delayedQuery(e, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFunctions.current, limitTypes.current, limitPrefixes.current, nameResolverEndpoint);
        setInputText(e);
        setIsError(false);
      } else {
        setIsError(true);
      }
    },
    [setLoadingAutocomplete, setAutoCompleteItems, setInputText, setIsError, delayedQuery, queryItem.type, nameResolverEndpoint]
  );

  const clearAutocompleteItems = useCallback(() => setAutoCompleteItems(null),[]);

  const clearInputText = () => {
    setInputText("");
  };

  const handleQueryTypeChange = (value: string, resetInputText = true) => {
    setIsError(false);
    const newQueryType = queryTypes.find((type) => type.id === parseInt(value));
    if (newQueryType) {
      autocompleteFunctions.current = newQueryType.functions;
      limitTypes.current = [newQueryType.filterType];
      limitPrefixes.current = newQueryType.limitPrefixes;
      clearAutocompleteItems();
      if (resetInputText) {
        setQueryItem({ node: null, type: newQueryType });
        clearInputText();
      } else {
        setQueryItem((prev) => ({ ...prev, type: newQueryType }));
      }
    }
  };

  const handleItemSelection = (item: AutocompleteItem) => {
    setIsError(false);
    updateQueryItem(item);
    if (autocompleteItems) {
      clearAutocompleteItems();
    }
  };

  const validateSubmission = (item: QueryItem) => {
    if (!item.node || !item.node.id) {
      setIsError(true);
      setErrorText("No term selected, please select a valid term.");
      return;
    }
    if (!item.type) {
      setIsError(true);
      setErrorText("No query type selected, please select a valid query type.");
      return;
    }
    submitQuery(item);
  };

  const handleSubmission = (item: QueryItem | null) => validateSubmission(item || queryItem);

  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  useEffect(() => {
    if (presetURL) {
      const timer = setTimeout(() => {
        const cleanedURL = presetURL.replaceAll("//", "/");
        navigate(cleanedURL);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [presetURL, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <div className={styles.query}>
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
          <div className={styles.container}>
            {isResults ? (
              <>
                <div className={styles.resultsHeader}>
                  <div className={styles.showingResultsContainer}>
                    <h6 className={styles.subHeading}>
                      { resultsPaneQuestionText }
                      <span className={styles.entityLinkContainer}>
                        <EntityLink
                          id={queryItem.node?.id || ""}
                          className={styles.searchedTerm}
                          linkTextGenerator={() => `${queryItem.node?.label}` || ""}
                          useIcon
                          fallbackText={queryItem.node?.label}
                          data-tooltip-id="query-node-description-tooltip"
                        />
                        ?
                      </span>
                    </h6>
                    {nodeDescription && (
                      <Tooltip id="query-node-description-tooltip" place="bottom">
                        <span>{nodeDescription}</span>
                        {queryItem?.node?.id && (
                          <span className={styles.nodeLink}>
                            {getEntityLink(
                              queryItem.node.id,
                              styles.nodeLinkAnchor,
                              queryItem.type
                            )}
                            <ExternalLink/>
                          </span>
                        )}
                      </Tooltip>
                    )}
                  </div>
                </div>
                <div className={styles.bottom}>
                  <Button
                    isSecondary
                    handleClick={() => setShareModalFunction(true)}
                    smallFont
                  >
                    <ShareIcon className={styles.shareIcon} />
                    <span>Share Result Set</span>
                  </Button>
                  {
                    !loading &&
                    <ResultsSummaryButton
                      results={results}
                      queryString={`${resultsPaneQuestionText}${queryItem.node?.label || ""}`}
                      handleResultMatchClick={handleResultMatchClick}
                      pk={pk}
                    />
                  }
                </div>
              </>
            ) : (
              <>
                <h3 className={styles.h3}>
                  Translator finds associations between drugs, genes, and
                  diseases
                </h3>
                <h6 className={styles.h6}>
                  Select a question and enter a search term to get started
                </h6>
                {isError && <p className={styles.error}>{errorText}</p>}
                <OutsideClickHandler
                  onOutsideClick={clearAutocompleteItems}
                  className={styles.queryBarContainer}
                >
                  <QuerySelect
                    label=""
                    handleChange={(val: string) => handleQueryTypeChange(val, true)}
                    noanimate
                    value={queryItem.type.label}
                  >
                    {queryTypes.map((type) => (
                      <option value={type.id} key={type.id}>
                        <span
                          data-modified-name={type.label
                            .replaceAll("a disease?", "...")
                            .replaceAll("a chemical?", "...")
                            .replaceAll("a gene?", "...")}
                        >
                          {type.label}
                        </span>
                      </option>
                    ))}
                  </QuerySelect>
                  <QueryBar
                    handleSubmission={handleSubmission}
                    handleChange={handleQueryItemChange}
                    value={inputText}
                    queryType={queryItem.type}
                    queryItem={queryItem}
                    autocompleteItems={autocompleteItems}
                    autocompleteLoading={loadingAutocomplete}
                    handleItemClick={handleItemSelection}
                    disabled={user === null}
                    placeholderText={
                      user === null ? "Log In to Enter a Search Term" : undefined
                    }
                  />
                  <img
                    src={loadingIcon}
                    className={`${styles.loadingIcon} ${
                      isLoading ? styles.active : ""
                    } loadingIcon`}
                    alt="loading icon"
                  />
                </OutsideClickHandler>
                {queryItem.type.id === 0 && (
                  <ExampleQueryList
                    examples={exampleDiseases}
                    setPresetURL={setPresetURL}
                  />
                )}
                {queryItem.type.id === 1 && (
                  <ExampleQueryList
                    examples={exampleGenesUp}
                    setPresetURL={setPresetURL}
                  />
                )}
                {queryItem.type.id === 2 && (
                  <ExampleQueryList
                    examples={exampleGenesDown}
                    setPresetURL={setPresetURL}
                  />
                )}
                {queryItem.type.id === 3 && (
                  <ExampleQueryList
                    examples={exampleChemsUp}
                    setPresetURL={setPresetURL}
                  />
                )}
                {queryItem.type.id === 4 && (
                  <ExampleQueryList
                    examples={exampleChemsDown}
                    setPresetURL={setPresetURL}
                  />
                )}
              </>
            )}
          </div>
        </AutoHeight>
      </div>
      <div className={styles.panels}>
        {isResults && isLoading && <div className="loading-results"></div>}
      </div>
    </>
  );
};

export default Query;
