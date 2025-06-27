import { useState, useEffect, useCallback, FC, Dispatch, SetStateAction } from "react";
import { useSelector } from 'react-redux';
import { useLocation } from "react-router-dom";
import { QueryItem, QueryType } from "@/features/Query/types/querySubmission";
import { Result } from "@/features/ResultList/types/results.d";
import { currentConfig, currentUser } from "@/features/User-Auth/slices/userSlice";
import AutoHeight from "@/features/Common/components/AutoHeight/AutoHeight";
import { useQueryState, useAutocomplete, useQuerySubmission, useExampleQueries } from "@/features/Query/hooks/customQueryHooks";
import { queryTypes } from "@/features/Query/utils/queryTypes";
import cloneDeep from "lodash/cloneDeep";
import styles from './Query.module.scss';
import { AppToastContainer } from '@/features/Common/components/AppToastContainer/AppToastContainer';
import QueryResultsView from '@/features/Query/components/QueryResultsView/QueryResultsView';
import QueryInputView from '@/features/Query/components/QueryInputView/QueryInputView';

interface QueryProps {
  isResults?: boolean;
  loading?: boolean;
  initPresetTypeObject?: QueryType | null;
  initNodeLabelParam?: string | null;
  initNodeIdParam?: string | null;
  nodeDescription?: string | null;
  setShareModalFunction?: Dispatch<SetStateAction<boolean>>;
  results?: Result[];
  handleResultMatchClick?: Function;
  pk?: string;
}

const Query: FC<QueryProps> = ({
  isResults = false,
  loading = false,
  initPresetTypeObject = null,
  initNodeLabelParam = null,
  initNodeIdParam = null,
  nodeDescription = null,
  setShareModalFunction = () => {},
  results = [],
  handleResultMatchClick = () => {},
  pk = ""
}) => {
  const { pathname } = useLocation();
  const config = useSelector(currentConfig);
  const user = useSelector(currentUser);
  
  const nameResolverEndpoint = config?.name_resolver 
    ? `${config.name_resolver}/lookup` 
    : 'https://name-lookup.transltr.io/lookup';

  const {
    queryItem,
    setQueryItem,
    clearQueryItem,
    inputText,
    setInputText,
    prevQueryItems,
    autocompleteFunctions,
    limitPrefixes,
    limitTypes
  } = useQueryState(initPresetTypeObject, initNodeLabelParam, initNodeIdParam);

  const {
    autocompleteItems,
    loadingAutocomplete,
    delayedQuery,
    clearAutocompleteItems
  } = useAutocomplete(autocompleteFunctions, limitTypes, limitPrefixes, nameResolverEndpoint);

  const { isLoading, setIsLoading, submitQuery } = useQuerySubmission();

  const exampleQueries = useExampleQueries(config?.cached_queries);

  // State management
  const [isError, setIsError] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');

  // Event handlers
  const handleQueryItemChange = useCallback(
    (e: string) => {
      if (Object.keys(queryItem.type).length) {
        delayedQuery(e);
        setInputText(e);
        setIsError(false);
      } else {
        setIsError(true);
      }
    },
    [delayedQuery, setInputText, queryItem.type]
  );

  const handleQueryTypeChange = useCallback((value: string, resetInputText = true) => {
    setIsError(false);
    const newQueryType = queryTypes.find((type) => type.id === parseInt(value));
    if (newQueryType) {
      autocompleteFunctions.current = newQueryType.functions;
      limitTypes.current = [newQueryType.filterType];
      limitPrefixes.current = newQueryType.limitPrefixes;
      clearAutocompleteItems();
      
      if (resetInputText) {
        setQueryItem({ node: null, type: newQueryType });
        setInputText("");
      } else {
        setQueryItem((prev) => ({ ...prev, type: newQueryType }));
      }
    }
  }, [autocompleteFunctions, limitTypes, limitPrefixes, clearAutocompleteItems, setQueryItem, setInputText]);

  const handleItemSelection = useCallback((item: any) => {
    setIsError(false);
    if (item.id.includes("NCBIGene") && item?.match) {
      item.label += ` (${item.match})`;
    }
    setInputText(item.label);
    setQueryItem((prev) => {
      const newQueryItem = { type: prev.type, node: item };
      const newPrevItems = cloneDeep(prevQueryItems.current);
      newPrevItems.push(newQueryItem);
      prevQueryItems.current = newPrevItems;
      return newQueryItem;
    });
    clearAutocompleteItems();
  }, [setInputText, setQueryItem, prevQueryItems, clearAutocompleteItems]);

  const validateSubmission = useCallback((item: QueryItem | null) => {
    if (!item?.node || !item.node.id) {
      setIsError(true);
      setErrorText("No term selected, please select a valid term.");
      return;
    }
    if (!item?.type) {
      setIsError(true);
      setErrorText("No query type selected, please select a valid query type.");
      return;
    }
    if(!submitQuery)
      return;
    submitQuery(item);
  }, [submitQuery]);

  const handleSubmission = useCallback((item: QueryItem | null) => {
    validateSubmission(item || queryItem);
  }, [validateSubmission, queryItem]);

  // Effects
  useEffect(() => {
    setIsLoading(loading);
  }, [loading, setIsLoading]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <div className={styles.query}>
        <AppToastContainer />
        <AutoHeight className={styles.autoHeightContainer} duration={0}>
          <div className={styles.container}>
            {isResults ? (
              <QueryResultsView
                queryItem={queryItem}
                nodeDescription={nodeDescription}
                results={results}
                loading={loading}
                pk={pk}
                setShareModalFunction={setShareModalFunction}
                handleResultMatchClick={handleResultMatchClick}
              />
            ) : (
              <QueryInputView
                queryItem={queryItem}
                inputText={inputText}
                autocompleteItems={autocompleteItems}
                loadingAutocomplete={loadingAutocomplete}
                isLoading={isLoading}
                isError={isError}
                errorText={errorText}
                user={user}
                exampleQueries={exampleQueries}
                onQueryTypeChange={handleQueryTypeChange}
                onQueryItemChange={handleQueryItemChange}
                onItemSelection={handleItemSelection}
                onSubmission={handleSubmission}
                onClearQueryItem={clearQueryItem}
                onClearAutocomplete={clearAutocompleteItems}
              />
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
