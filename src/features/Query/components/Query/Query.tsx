import { useState, useEffect, useCallback, FC, Dispatch, SetStateAction } from "react";
import { useSelector } from 'react-redux';
import { useLocation } from "react-router-dom";
import { AutocompleteItem, QueryItem, QueryType } from "@/features/Query/types/querySubmission";
import { currentConfig, currentUser } from "@/features/UserAuth/slices/userSlice";
import { useQueryItem, useAutocompleteConfig, useAutocomplete, useQuerySubmission, useExampleQueries } from "@/features/Query/hooks/customQueryHooks";
import { queryTypes } from "@/features/Query/utils/queryTypes";
import styles from './Query.module.scss';
import QueryResultsView from '@/features/Query/components/QueryResultsView/QueryResultsView';
import QueryInputView from '@/features/Query/components/QueryInputView/QueryInputView';
import { User } from "@/features/UserAuth/types/user";
import { ProjectRaw } from "@/features/Projects/types/projects";

interface QueryProps {
  isResults?: boolean;
  loading?: boolean;
  initPresetTypeObject?: QueryType | null;
  initNodeLabelParam?: string | null;
  initNodeIdParam?: string | null;
  nodeDescription?: string | null;
  setShareModalFunction?: Dispatch<SetStateAction<boolean>>;
  pk?: string;
  selectedProject?: ProjectRaw | null;
  combinedStyles?: { [key: string]: string };
  shouldNavigate?: boolean;
  submissionCallback?: () => void;
}

const Query: FC<QueryProps> = ({
  isResults = false,
  loading = false,
  initPresetTypeObject = null,
  initNodeLabelParam = null,
  initNodeIdParam = null,
  nodeDescription = null,
  setShareModalFunction = () => {},
  pk = "",
  selectedProject = null,
  combinedStyles,
  shouldNavigate = true,
  submissionCallback = () => {}
}) => {
  const { pathname } = useLocation();
  const config = useSelector(currentConfig);
  const user = useSelector(currentUser) as User | null;

  const nameResolverEndpoint = config?.name_resolver.endpoint
    ? `${config.name_resolver.endpoint}/lookup`
    : 'https://name-lookup.transltr.io/lookup';

  const {
    queryItem,
    setQueryItem,
    clear: clearQueryItem,
    inputText,
    setInputText,
  } = useQueryItem(initPresetTypeObject, initNodeLabelParam, initNodeIdParam);

  const autocompleteConfig = useAutocompleteConfig(queryItem.type);

  const {
    autocompleteItems,
    loadingAutocomplete,
    autocompleteVisibility,
    delayedQuery,
    setAutocompleteVisibility,
    clearAutocompleteItems
  } = useAutocomplete(autocompleteConfig, nameResolverEndpoint);

  const { isLoading, setIsLoading, submitQuery } = useQuerySubmission('single', shouldNavigate, submissionCallback);

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
      clearAutocompleteItems();

      if (resetInputText) {
        setQueryItem({ node: null, type: newQueryType });
        setInputText("");
      } else {
        setQueryItem((prev) => ({ ...prev, type: newQueryType }));
      }
    }
  }, [clearAutocompleteItems, setQueryItem, setInputText]);

  const handleItemSelection = useCallback((item: AutocompleteItem) => {
    setIsError(false);
    if (item.id.includes("NCBIGene") && item?.match) {
      item.label += ` (${item.match})`;
    }
    setInputText(item.label);
    setQueryItem((prev) => ({ type: prev.type, node: item }));
    setAutocompleteVisibility(false);
  }, [setInputText, setQueryItem, setAutocompleteVisibility]);

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
    submitQuery(item, selectedProject?.id?.toString() || undefined);
  }, [submitQuery, selectedProject]);

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
      <div className={`${styles.query} ${isResults ? styles.results : ''}`}>
        <div className={styles.container}>
          {isResults ? (
            <QueryResultsView
              queryItem={queryItem}
              nodeDescription={nodeDescription}
              pk={pk}
              setShareModalFunction={setShareModalFunction}
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
              autocompleteVisibility={autocompleteVisibility}
              setAutocompleteVisibility={setAutocompleteVisibility}
              combinedStyles={combinedStyles}
            />
          )}
        </div>
      </div>
      <div className={styles.panels}>
        {isResults && isLoading && <div className="loading-results"></div>}
      </div>
    </>
  );
};

export default Query;
