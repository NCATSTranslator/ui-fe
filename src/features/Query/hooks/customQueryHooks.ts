import { useMemo, useState, useCallback, useRef, RefObject  } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';
import { Example, QueryItem } from '@/features/Query/types/querySubmission';
import { incrementHistory } from '@/features/History/slices/historySlice';
import { filterAndSortExamples, getAutocompleteTerms } from '@/features/Query/utils/autocompleteFunctions';
import { getResultsShareURLPath, getPathfinderResultsShareURLPath } from '@/features/ResultList/utils/resultsInteractionFunctions';
import { API_PATH_PREFIX } from '@/features/UserAuth/utils/userApi';
import { getQueryTitle, queryTypes } from '@/features/Query/utils/queryTypes';
import { AutocompleteItem, AutocompleteFunctions, ExampleQueries, QueryType } from '@/features/Query/types/querySubmission';

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
 * @returns Object containing:
 *   - isLoading: Boolean indicating if a query is currently being submitted
 *   - setIsLoading: Function to manually set loading state
 *   - submitQuery: Async function to submit a query item to the API
 *   - submitPathfinderQuery: Async function to submit a pathfinder query with two items
 */
export const useQuerySubmission = (queryType: 'single' | 'pathfinder' = 'single') => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submitQuery = useCallback(async (item: QueryItem, projectId?: string) => {
    if (!item?.node) {
      console.error("No node attached to query item, unable to submit");
      return;
    }

    setIsLoading(true);
    const timestamp = new Date();
    const title = getQueryTitle('smart', item.type, item.node);

    try {
      const queryJson = JSON.stringify({
        curie: item.node.id,
        type: item.type.targetType,
        direction: item.type.direction,
        pid: projectId || null,
        title: title,
        node_one_label: item.node.label
      });

      const response = await fetch(`${API_PATH_PREFIX}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: queryJson,
      });

      const data = await response.json();

      if (data.data && data.status === 'success') {
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
          data.data
        );

        if (window.location.href.includes('results')) {
          setIsLoading(false);
          window.open(newQueryPath, "_blank", "noopener");
        } else {
          navigate(newQueryPath);
        }
      }
    } catch (error) {
      toast.error(
        "We were unable to submit your query at this time. Please attempt to submit it again or try again later."
      );
      setIsLoading(false);
      console.error(error);
    }
  }, [dispatch, navigate]);

  const submitPathfinderQuery = useCallback(async (
    itemOne: AutocompleteItem, 
    itemTwo: AutocompleteItem, 
    middleType?: string, 
    projectId?: string
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
      console.log(data);
      
      let newQueryPath = getPathfinderResultsShareURLPath(
        itemOne, 
        itemTwo, 
        '0', 
        middleType?.replace("biolink:", ""), 
        data.data
      ); 
      navigate(newQueryPath);
    } catch (error) {
      toast.error(
        "We were unable to submit your query at this time. Please attempt to submit it again or try again later."
      );
      setIsLoading(false);
      console.log(error);
      throw error;
    }
  }, [navigate]);

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
 * @param {RefObject<AutocompleteFunctions | null>} autocompleteFunctions - Mutable ref containing autocomplete filter functions
 * @param {RefObject<string[]>} limitTypes - Mutable ref containing array of type filters for autocomplete
 * @param {RefObject<string[] | null>} limitPrefixes - Mutable ref containing array of prefix filters for autocomplete
 * @param {string} nameResolverEndpoint - API endpoint URL for name resolution
 * @returns Object containing:
 *   - autocompleteItems: Array of autocomplete suggestions or null
 *   - loadingAutocomplete: Boolean indicating if autocomplete is loading
 *   - delayedQuery: Debounced function to trigger autocomplete search
 *   - clearAutocompleteItems: Function to clear autocomplete suggestions
 */
export const useAutocomplete = (
  autocompleteFunctions: RefObject<AutocompleteFunctions | null>,
  nameResolverEndpoint: string,
  limitTypes?: RefObject<string[]>,
  limitPrefixes?: RefObject<string[] | null>,
  excludePrefixes?: RefObject<string[] | null>
) => {
  const [autocompleteItems, setAutoCompleteItems] = useState<AutocompleteItem[] | null>(null);
  const [loadingAutocomplete, setLoadingAutocomplete] = useState<boolean>(false);

  const delayedQuery = useMemo(
    () => debounce(
      (inputText: string) => {
        if (autocompleteFunctions.current) {
          getAutocompleteTerms(
            inputText,
            setLoadingAutocomplete,
            setAutoCompleteItems,
            autocompleteFunctions.current,
            limitTypes?.current || [],
            limitPrefixes?.current || [],
            excludePrefixes?.current || [],
            nameResolverEndpoint
          );
        }
      },
      750
    ),
    [autocompleteFunctions, limitTypes, limitPrefixes, nameResolverEndpoint]
  );

  const clearAutocompleteItems = useCallback(() => setAutoCompleteItems(null), []);

  return {
    autocompleteItems,
    loadingAutocomplete,
    delayedQuery,
    clearAutocompleteItems
  };
}; 

/**
 * Custom hook that manages the main query state including query item, input text,
 * and related configuration refs. Initializes state based on provided parameters
 * and maintains history of previous query items.
 * 
 * @param {QueryType | null} initPresetTypeObject - Initial query type object or null to use default
 * @param {string | null} initNodeLabelParam - Initial node label parameter from URL or props
 * @param {string | null} initNodeIdParam - Initial node ID parameter from URL or props
 * @returns Object containing:
 *   - queryItem: Current query item with type and node information
 *   - setQueryItem: Function to update the current query item
 *   - inputText: Current input text value
 *   - setInputText: Function to update input text
 *   - prevQueryItems: Ref containing history of previous query items
 *   - autocompleteFunctions: Ref containing current autocomplete functions
 *   - limitPrefixes: Ref containing current prefix limits
 *   - limitTypes: Ref containing current type limits
 *   - clearQueryItem: Function to clear the query item back to initial state
 */
export const useQueryState = (
  initPresetTypeObject: QueryType | null,
  initNodeLabelParam: string | null,
  initNodeIdParam: string | null
) => {
  const initQueryItem = useMemo((): QueryItem => {
    const initPresetType = initPresetTypeObject || queryTypes[0];
    const initSelectedNode = initNodeIdParam && initNodeLabelParam 
      ? { id: initNodeIdParam, label: initNodeLabelParam, match: "", types: [] } 
      : null;
    
    return {
      type: initPresetType,
      node: initSelectedNode
    };
  }, [initPresetTypeObject, initNodeIdParam, initNodeLabelParam]);

  const [queryItem, setQueryItem] = useState<QueryItem>(initQueryItem);
  const [inputText, setInputText] = useState<string>(initNodeLabelParam || "");
  const prevQueryItems = useRef<QueryItem[]>([initQueryItem]);

  const autocompleteFunctions = useRef(initQueryItem.type.functions);
  const limitPrefixes = useRef(initQueryItem.type.limitPrefixes);
  const limitTypes = useRef(initQueryItem.type.filterType ? [initQueryItem.type.filterType] : []);

  const clearQueryItem = useCallback(() => {
    setQueryItem(initQueryItem);
    setInputText(initNodeLabelParam || "");
  }, [initQueryItem, initNodeLabelParam]);

  return {
    queryItem,
    setQueryItem,
    inputText,
    setInputText,
    prevQueryItems,
    autocompleteFunctions,
    limitPrefixes,
    limitTypes,
    clearQueryItem
  };
}; 