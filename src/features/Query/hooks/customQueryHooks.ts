import { useMemo, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import { Example, QueryItem, AutocompleteItem, AutocompleteConfig, ExampleQueries, QueryType } from '@/features/Query/types/querySubmission';
import { incrementHistory } from '@/features/History/slices/historySlice';
import { filterAndSortExamples, getAutocompleteTerms } from '@/features/Query/utils/autocompleteFunctions';
import { getResultsShareURLPath, getPathfinderResultsShareURLPath } from '@/features/Common/utils/web';
import { API_PATH_PREFIX } from '@/features/UserAuth/utils/userApi';
import { queryTypes } from '@/features/Query/utils/queryTypes';
import { currentConfig } from '@/features/UserAuth/slices/userSlice';
import { errorToast } from '@/features/Core/utils/toastMessages';

/**
 * Custom hook that filters and sorts cached queries into categorized example queries.
 * Memoizes the result to prevent unnecessary recalculations on re-renders.
 *
 * @param {Example[] | undefined} cachedQueries - Array of cached query objects to filter and sort
 * @returns Object containing categorized example queries:
 *   - exampleDiseases: Drug-related queries
 *   - exampleChemsUp: Gene queries with 'increased' direction
 *   - exampleChemsDown: Gene queries with 'decreased' direction
 *   - exampleGenesUp: Chemical queries with 'increased' direction
 *   - exampleGenesDown: Chemical queries with 'decreased' direction
 */
export const useExampleQueries = (cachedQueries: Example[] | undefined): ExampleQueries  => {
  return useMemo(() => {
    if (!cachedQueries) return {
      exampleDiseases: [],
      exampleChemsUp: [],
      exampleChemsDown: [],
      exampleGenesUp: [],
      exampleGenesDown: []
    };

    return {
      exampleDiseases: filterAndSortExamples(cachedQueries, 'drug'),
      exampleChemsUp: filterAndSortExamples(cachedQueries, 'gene', 'increased'),
      exampleChemsDown: filterAndSortExamples(cachedQueries, 'gene', 'decreased'),
      exampleGenesUp: filterAndSortExamples(cachedQueries, 'chemical', 'increased'),
      exampleGenesDown: filterAndSortExamples(cachedQueries, 'chemical', 'decreased'),
    };
  }, [cachedQueries]);
};

/**
 * Custom hook that manages query submission logic including API calls, error handling,
 * navigation, and Redux state updates. Provides loading state and submission function.
 *
 * @param {'single' | 'pathfinder'} queryType - Type of query: 'single' for regular queries, 'pathfinder' for dual-item queries
 * @param {boolean} shouldNavigate - Whether to navigate to the results page
 * @param {() => void} submissionCallback - Callback function to call when a query is submitted
 * @returns Object containing:
 *   - isLoading: Boolean indicating if a query is currently being submitted
 *   - setIsLoading: Function to manually set loading state
 *   - submitQuery: Async function to submit a query item to the API
 *   - submitPathfinderQuery: Async function to submit a pathfinder query with two items
 */
export const useQuerySubmission = (queryType: 'single' | 'pathfinder' = 'single', shouldNavigate: boolean = true, submissionCallback: () => void = () => {}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const config = useSelector(currentConfig);

  const submitQuery = useCallback(async (item: QueryItem, projectId?: string) => {
    if (!item?.node) {
      console.error("No node attached to query item, unable to submit");
      return;
    }

    setIsLoading(true);
    const timestamp = new Date();

    try {
      const queryJson = JSON.stringify({
        curie: item.node.id,
        type: item.type.targetType,
        direction: item.type.direction,
        pid: projectId || null,
        node_one_label: item.node.label
      });

      const response = await fetch(`${API_PATH_PREFIX}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: queryJson,
      });

      const data = await response.json();

      if (data.data && data.status === 'complete') {
        dispatch(
          incrementHistory({
            item,
            date: timestamp.toDateString(),
            time: timestamp.toLocaleTimeString([], {
              hour12: true,
              hour: 'numeric',
              minute: '2-digit'
            }),
            id: data.data,
          })
        );

        const nodeLabel = item.node?.label || "";
        const nodeID = item.node?.id || "";
        const newQueryPath = getResultsShareURLPath(
          nodeLabel,
          nodeID,
          item.type.id,
          '0',
          data.data,
          config?.include_hashed_parameters
        );

        submissionCallback();

        if(!shouldNavigate) {
          setIsLoading(false);
          return;
        }

        if (window.location.href.includes('results')) {
          setIsLoading(false);
          window.open(newQueryPath, "_blank", "noopener");
        } else {
          navigate(`/${newQueryPath}`);
        }
      }
    } catch (error) {
      errorToast("We were unable to submit your query at this time. Please attempt to submit it again or try again later.");
      setIsLoading(false);
      console.error(error);
    }
  }, [dispatch, navigate]);

  const submitPathfinderQuery = useCallback(async (
    itemOne: AutocompleteItem,
    itemTwo: AutocompleteItem,
    middleType?: string,
    projectId?: string,
    shouldNavigate: boolean = true,
  ) => {
    setIsLoading(true);

    try {
      let subjectType = (!!itemOne?.types) ? itemOne.types[0] : "";
      let objectType = (!!itemTwo?.types) ? itemTwo.types[0] : "";
      let queryJson = JSON.stringify({
        type: 'pathfinder',
        subject: {id: itemOne.id, category: subjectType},
        object: {id: itemTwo.id, category: objectType},
        pid: projectId || null,
        constraint: middleType || null,
        node_one_label: itemOne.label,
        node_two_label: itemTwo.label
      });

      const response = await fetch(`${API_PATH_PREFIX}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: queryJson
      });

      const data = await response.json();
      let newQueryPath = getPathfinderResultsShareURLPath(
        itemOne,
        itemTwo,
        '0',
        middleType?.replace("biolink:", ""),
        data.data,
        config?.include_hashed_parameters
      );
      submissionCallback();
      if(shouldNavigate)
        navigate(`/${newQueryPath}`);

    } catch (error) {
      errorToast("We were unable to submit your query at this time. Please attempt to submit it again or try again later.");
      setIsLoading(false);
      console.log(error);
      throw error;
    }
  }, [navigate, config]);

  return {
    isLoading,
    setIsLoading,
    submitQuery: queryType === 'single' ? submitQuery : undefined,
    submitPathfinderQuery: queryType === 'pathfinder' ? submitPathfinderQuery : undefined
  };
};

/**
 * Custom hook that manages autocomplete functionality including debounced API calls,
 * loading states, and autocomplete item management. Provides a 750ms debounced
 * query function to reduce API calls during user typing.
 *
 * @param {AutocompleteConfig} config - Configuration object containing functions, types, and prefixes
 * @param {string} nameResolverEndpoint - API endpoint URL for name resolution
 * @returns Object containing:
 *   - autocompleteItems: Array of autocomplete suggestions or null
 *   - loadingAutocomplete: Boolean indicating if autocomplete is loading
 *   - delayedQuery: Debounced function to trigger autocomplete search
 *   - clearAutocompleteItems: Function to clear autocomplete suggestions
 *   - autocompleteVisibility: Boolean controlling visibility of autocomplete dropdown
 *   - setAutocompleteVisibility: Function to control autocomplete visibility
 */
export const useAutocomplete = (
  config: AutocompleteConfig,
  nameResolverEndpoint: string
) => {
  const [autocompleteItems, setAutoCompleteItems] = useState<AutocompleteItem[] | null>(null);
  const [autocompleteVisibility, setAutocompleteVisibility] = useState<boolean>(true);
  const [loadingAutocomplete, setLoadingAutocomplete] = useState<boolean>(false);

  // Internal ref to capture latest config for debounced callback
  // This prevents stale closures while avoiding debounce recreation
  const configRef = useRef(config);
  configRef.current = config;

  const delayedQuery = useMemo(
    () => debounce(
      (inputText: string) => {
        const { functions, limitTypes, limitPrefixes, excludePrefixes } = configRef.current;
        if (functions) {
          getAutocompleteTerms(
            inputText,
            setLoadingAutocomplete,
            setAutoCompleteItems,
            functions,
            limitTypes || [],
            limitPrefixes || [],
            excludePrefixes || [],
            nameResolverEndpoint
          );
        }
      },
      750
    ),
    [nameResolverEndpoint]
  );

  const clearAutocompleteItems = useCallback(() => setAutoCompleteItems(null), []);

  return {
    autocompleteItems,
    loadingAutocomplete,
    autocompleteVisibility,
    delayedQuery,
    setAutocompleteVisibility,
    clearAutocompleteItems
  };
};

/**
 * Custom hook that derives autocomplete configuration from a QueryType.
 * Returns a memoized config object that stays in sync with the query type.
 *
 * @param {QueryType} queryType - The query type to derive config from
 * @returns {AutocompleteConfig} Memoized configuration object for useAutocomplete
 */
export const useAutocompleteConfig = (queryType: QueryType): AutocompleteConfig => {
  return useMemo(() => ({
    functions: queryType.functions,
    limitTypes: queryType.filterType ? [queryType.filterType] : [],
    limitPrefixes: queryType.limitPrefixes,
    excludePrefixes: queryType.excludePrefixes,
  }), [queryType.functions, queryType.filterType, queryType.limitPrefixes, queryType.excludePrefixes]);
};

/**
 * Custom hook that manages query item state with proper prop synchronization.
 * When props change, state automatically resets to reflect the new values.
 *
 * @param {QueryType | null} initPresetTypeObject - Initial query type object or null to use default
 * @param {string | null} initNodeLabelParam - Initial node label parameter from URL or props
 * @param {string | null} initNodeIdParam - Initial node ID parameter from URL or props
 * @returns Object containing:
 *   - queryItem: Current query item with type and node information
 *   - setQueryItem: Function to update the current query item
 *   - inputText: Current input text value
 *   - setInputText: Function to update input text
 *   - clear: Function to reset state to initial values
 */
export const useQueryItem = (
  initPresetTypeObject: QueryType | null,
  initNodeLabelParam: string | null,
  initNodeIdParam: string | null
) => {
  // Compute derived initial query item
  const initQueryItem = useMemo((): QueryItem => {
    const initPresetType = initPresetTypeObject || queryTypes[0];
    const initSelectedNode = initNodeIdParam && initNodeLabelParam
      ? { id: initNodeIdParam, label: initNodeLabelParam, match: "", isExact: false, score: Infinity, types: [] }
      : null;

    return {
      type: initPresetType,
      node: initSelectedNode
    };
  }, [initPresetTypeObject, initNodeIdParam, initNodeLabelParam]);

  // State
  const [queryItem, setQueryItem] = useState<QueryItem>(initQueryItem);
  const [inputText, setInputText] = useState<string>(initNodeLabelParam || "");

  // Track previous initQueryItem to detect prop changes (React 19 recommended pattern)
  const [prevInitQueryItem, setPrevInitQueryItem] = useState<QueryItem>(initQueryItem);

  // Adjust state during render when props change (avoids extra useEffect render cycle)
  if (prevInitQueryItem !== initQueryItem) {
    setPrevInitQueryItem(initQueryItem);
    setQueryItem(initQueryItem);
    setInputText(initNodeLabelParam || "");
  }

  // Clear function to reset state
  const clear = useCallback(() => {
    setQueryItem(initQueryItem);
    setInputText(initNodeLabelParam || "");
  }, [initQueryItem, initNodeLabelParam]);

  return {
    queryItem,
    setQueryItem,
    inputText,
    setInputText,
    clear
  };
};
