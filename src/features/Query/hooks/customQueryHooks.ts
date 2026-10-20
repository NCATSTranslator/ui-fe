import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { Example, QueryItem, AutocompleteItem, AutocompleteConfig, ExampleQueries, QueryType } from '@/features/Query/types/querySubmission';
import { filterAndSortExamples, getAutocompleteTerms } from '@/features/Query/utils/autocompleteFunctions';
import { defaultQueryFilterFactory } from '@/features/Query/utils/queryTypeFilters';
import { queryTypeAnnotator } from '@/features/Query/utils/queryTypeAnnotators';
import { combinedQueryFormatter } from '@/features/Query/utils/queryTypeFormatters';
import { getResultsShareURLPath, getPathfinderResultsShareURLPath, getLookupResultsShareURLPath } from '@/features/Core/utils/web';
import { API_PATH_PREFIX } from '@/features/UserAuth/utils/userApi';
import { buildInitialQueryItemState } from '@/features/Query/utils/queryInitState';
import { autocompleteItemFromNodeParams } from '@/features/Query/hooks/queryInitHelpers';
import { useStateSyncedTo } from '@/features/Query/hooks/useStateSyncedTo';
import { useClearHomeQueryNodeParams } from '@/features/Query/hooks/useClearHomeQueryNodeParams';
import { currentConfig } from '@/features/UserAuth/slices/userSlice';
import { errorToast, unsupportedSmartQueryCategoryToast } from '@/features/Core/utils/toastMessages';
import { noop } from '@/features/Core/utils/constants';
import { trackEvent } from '@/features/Analytics/utils/dataLayer';
import type { AnalyticsEventMap, QueryTypeName } from '@/features/Analytics/types/analytics';

/** The backend has accepted a submission once it returns the new query's pk with a complete status. */
const isAcceptedSubmission = (data: { data?: unknown; status?: string }): boolean =>
  !!data.data && data.status === 'complete';

type QuerySubmittedParams = Omit<AnalyticsEventMap['query_submitted'], 'query_type' | 'project_attached'>;

/** Reports query_submitted only for a submission the backend accepted, so call sites need no guard. */
const trackAcceptedQuerySubmission = (
  data: { data?: unknown; status?: string },
  queryType: QueryTypeName,
  projectId: string | undefined,
  params: QuerySubmittedParams,
): void => {
  if (!isAcceptedSubmission(data)) return;
  trackEvent('query_submitted', {
    query_type: queryType,
    project_attached: projectId ? 'true' : 'false',
    ...params,
  });
};

const trackQuerySubmissionFailed = (queryType: QueryTypeName, error: unknown): void => {
  trackEvent('query_submission_failed', {
    query_type: queryType,
    error_message: error instanceof Error ? error.message : 'unknown',
  });
};

export const NAME_RESOLVER_FALLBACK_ENDPOINT = 'https://name-lookup.transltr.io/lookup';

export const HOME_QUERY_AUTOCOMPLETE_CONFIG: AutocompleteConfig = {
  functions: {
    filter: defaultQueryFilterFactory,
    annotate: queryTypeAnnotator,
    format: combinedQueryFormatter,
  },
  limitTypes: [
    "Drug",
    "ChemicalEntity",
    "Disease",
    "Gene",
    "SmallMolecule",
    "PhenotypicFeature",
    "BiologicalProcess",
    "AnatomicalEntity",
    "CellLine",
  ],
  limitPrefixes: [],
  excludePrefixes: ["UMLS"],
};

/**
 * Custom hook that resolves the name resolver lookup endpoint from config,
 * falling back to the default public endpoint when config is unavailable.
 *
 * @returns {string} The name resolver lookup endpoint URL.
 */
export const useNameResolverEndpoint = (): string => {
  const config = useSelector(currentConfig);
  const endpoint = config?.name_resolver.endpoint;
  return useMemo(
    () => endpoint
      ? `${endpoint}/lookup`
      : NAME_RESOLVER_FALLBACK_ENDPOINT,
    [endpoint]
  );
};

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

const SUBMISSION_ERROR_TEXT = "We were unable to submit your query at this time. Please attempt to submit it again or try again later.";

type QuerySubmissionResponse = { data: string; status?: string };

/** The request body for a query plus the analytics attributes describing it. */
interface SubmissionRequest {
  body: object;
  analytics: QuerySubmittedParams;
}

interface SubmissionOptions {
  /** Only navigate when the backend accepted the query (single queries); others navigate regardless. */
  requireAccepted?: boolean;
  /** From the results page, open the new query in a new tab instead of navigating. */
  openInNewTabFromResults?: boolean;
  /** Re-throw after reporting so the caller can react. */
  rethrow?: boolean;
}

/** POSTs a query request and returns the parsed response. */
const postQuery = async (body: object): Promise<QuerySubmissionResponse> => {
  const response = await fetch(`${API_PATH_PREFIX}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
};

const singleSubmission = (item: QueryItem, node: NonNullable<QueryItem['node']>, projectId?: string): SubmissionRequest => ({
  body: {
    curie: node.id,
    type: item.type.targetType,
    direction: item.type.direction,
    pid: projectId || null,
    node_one_label: node.label,
  },
  analytics: {
    query_template_id: String(item.type.id),
    query_template_label: item.type.label,
    subject_category: item.type.filterType,
    object_category: item.type.targetType,
  },
});

const pathfinderSubmission = (itemOne: AutocompleteItem, itemTwo: AutocompleteItem, middleType?: string, projectId?: string) => {
  const subjectType = itemOne?.types?.[0] ?? "";
  const objectType = itemTwo?.types?.[0] ?? "";
  const constraint = middleType?.replace("biolink:", "");
  const request: SubmissionRequest = {
    body: {
      type: 'pathfinder',
      subject: { id: itemOne.id, category: subjectType },
      object: { id: itemTwo.id, category: objectType },
      pid: projectId || null,
      constraint: middleType || null,
      node_one_label: itemOne.label,
      node_two_label: itemTwo.label,
    },
    analytics: { subject_category: subjectType, object_category: objectType, constraint_category: constraint },
  };
  return { request, constraint };
};

const lookupSubmission = (item: AutocompleteItem, objectCategory: string, projectId?: string) => {
  const rawCategory = objectCategory.replace("biolink:", "");
  const subjectType = item.types?.[0] || "";
  const request: SubmissionRequest = {
    body: {
      type: 'lookup',
      subject: { id: item.id, category: subjectType },
      object: { category: rawCategory },
      node_one_label: item.label,
      pid: projectId || null,
    },
    analytics: { subject_category: subjectType, object_category: rawCategory },
  };
  return { request, rawCategory };
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
export const useQuerySubmission = (queryType: 'single' | 'pathfinder' | 'lookup' = 'single', shouldNavigate: boolean = true, submissionCallback: () => void = noop) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const config = useSelector(currentConfig);

  // Shared tail of an accepted submission: notify the caller, then go to the new query's results unless told not to.
  const completeSubmission = useCallback((newQueryPath: string, openInNewTabFromResults: boolean) => {
    submissionCallback();
    if (!shouldNavigate) {
      setIsLoading(false);
      return;
    }
    if (openInNewTabFromResults && window.location.href.includes('results')) {
      setIsLoading(false);
      window.open(newQueryPath, "_blank", "noopener");
      return;
    }
    navigate(`/${newQueryPath}`);
  }, [navigate, shouldNavigate, submissionCallback]);

  // Posts a query, reports the outcome, and navigates to its results page
  const runSubmission = useCallback(async (
    type: QueryTypeName,
    projectId: string | undefined,
    { body, analytics }: SubmissionRequest,
    buildResultsPath: (data: QuerySubmissionResponse) => string,
    { requireAccepted = false, openInNewTabFromResults = false, rethrow = false }: SubmissionOptions = {},
  ) => {
    setIsLoading(true);
    try {
      const data = await postQuery(body);
      trackAcceptedQuerySubmission(data, type, projectId, analytics);
      if (requireAccepted && !isAcceptedSubmission(data)) return;
      completeSubmission(buildResultsPath(data), openInNewTabFromResults);
    } catch (error) {
      trackQuerySubmissionFailed(type, error);
      errorToast(SUBMISSION_ERROR_TEXT);
      setIsLoading(false);
      console.error(error);
      if (rethrow) throw error;
    }
  }, [completeSubmission]);

  const submitQuery = useCallback(async (item: QueryItem, projectId?: string) => {
    const node = item?.node;
    if (!node) {
      console.error("No node attached to query item, unable to submit");
      return;
    }
    await runSubmission('single', projectId, singleSubmission(item, node, projectId),
      (data) => getResultsShareURLPath({
        label: node.label || "",
        nodeID: node.id || "",
        typeID: item.type.id,
        resultID: '0',
        pk: data.data,
        shouldHash: config?.include_hashed_parameters,
      }),
      { requireAccepted: true, openInNewTabFromResults: true });
  }, [config, runSubmission]);

  const submitPathfinderQuery = useCallback(async (itemOne: AutocompleteItem, itemTwo: AutocompleteItem, middleType?: string, projectId?: string) => {
    const { request, constraint } = pathfinderSubmission(itemOne, itemTwo, middleType, projectId);
    await runSubmission('pathfinder', projectId, request,
      (data) => getPathfinderResultsShareURLPath({ itemOne, itemTwo, resultID: '0', constraint, pk: data.data, shouldHash: config?.include_hashed_parameters }),
      { rethrow: true });
  }, [config, runSubmission]);

  const submitLookupQuery = useCallback(async (item: AutocompleteItem, objectCategory: string, projectId?: string) => {
    const { request, rawCategory } = lookupSubmission(item, objectCategory, projectId);
    await runSubmission('lookup', projectId, request,
      (data) => getLookupResultsShareURLPath(item, rawCategory, '0', data.data, config?.include_hashed_parameters),
      { rethrow: true });
  }, [config, runSubmission]);

  return {
    isLoading,
    setIsLoading,
    submitQuery: queryType === 'single' ? submitQuery : undefined,
    submitPathfinderQuery: queryType === 'pathfinder' ? submitPathfinderQuery : undefined,
    submitLookupQuery: queryType === 'lookup' ? submitLookupQuery : undefined,
  };
};

/**
 * Custom hook that manages autocomplete functionality including debounced API calls,
 * loading states, and autocomplete item management. Provides a 750ms debounced
 * query function to reduce API calls during user typing. Autocomplete fetch only
 * runs when the input is at least 2 characters; shorter input clears suggestions.
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

  // Monotonic id so only the latest in-flight request may update state
  const requestIdRef = useRef(0);

  const delayedQuery = useMemo(
    () => debounce(
      (inputText: string) => {
        if (inputText.length < 2) {
          requestIdRef.current += 1;
          setAutoCompleteItems(null);
          setLoadingAutocomplete(false);
          return;
        }
        const config = configRef.current;
        if (config.functions) {
          const requestId = ++requestIdRef.current;
          setLoadingAutocomplete(true);
          getAutocompleteTerms(inputText, config, nameResolverEndpoint)
            .then((items) => {
              if (requestId !== requestIdRef.current) return;
              setAutoCompleteItems(items);
            })
            .catch((error) => {
              if (requestId !== requestIdRef.current) return;
              console.log(error);
            })
            .finally(() => {
              if (requestId !== requestIdRef.current) return;
              setLoadingAutocomplete(false);
            });
        }
      },
      750
    ),
    [nameResolverEndpoint]
  );

  useEffect(() => {
    return () => {
      delayedQuery.cancel();
      requestIdRef.current += 1;
    };
  }, [delayedQuery]);

  const clearAutocompleteItems = useCallback(() => {
    delayedQuery.cancel();
    requestIdRef.current += 1;
    setAutoCompleteItems(null);
    setLoadingAutocomplete(false);
  }, [delayedQuery]);

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
export { autocompleteItemFromNodeParams } from '@/features/Query/hooks/queryInitHelpers';
export { useStateSyncedTo } from '@/features/Query/hooks/useStateSyncedTo';

export const useSyncedAutocompleteFromNodeParams = (
  initNodeIdParam: string | null | undefined,
  initNodeLabelParam: string | null | undefined,
  initNodeCategoryParam?: string | null,
) => {
  const clearHomeQueryNodeParams = useClearHomeQueryNodeParams();
  const initItem = useMemo(
    () => autocompleteItemFromNodeParams(initNodeIdParam, initNodeLabelParam, initNodeCategoryParam),
    [initNodeIdParam, initNodeLabelParam, initNodeCategoryParam],
  );
  const initInputText = initNodeLabelParam || initNodeIdParam || '';
  const [queryItem, setQueryItem] = useStateSyncedTo(initItem);
  const [inputText, setInputText] = useStateSyncedTo(initInputText);

  const clear = useCallback(() => {
    setQueryItem(null);
    setInputText('');
    clearHomeQueryNodeParams();
  }, [setQueryItem, setInputText, clearHomeQueryNodeParams]);

  return { queryItem, setQueryItem, inputText, setInputText, clear };
};

export const useQueryItem = (
  initPresetTypeObject: QueryType | null,
  initNodeLabelParam: string | null,
  initNodeIdParam: string | null,
  initNodeCategoryParam?: string | null,
) => {
  const initState = useMemo(
    () => buildInitialQueryItemState(
      initPresetTypeObject,
      initNodeLabelParam,
      initNodeIdParam,
      initNodeCategoryParam,
    ),
    [initPresetTypeObject, initNodeIdParam, initNodeLabelParam, initNodeCategoryParam],
  );
  const toastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!initState.categoryUnsupported) return;
    const toastKey = initNodeCategoryParam ?? '';
    if (toastKeyRef.current === toastKey) return;
    toastKeyRef.current = toastKey;
    unsupportedSmartQueryCategoryToast();
  }, [initState.categoryUnsupported, initNodeCategoryParam]);

  const { queryItem: initQueryItem, inputText: initInputText } = initState;
  const nodeParamsKey = `${initNodeIdParam ?? ''}|${initNodeLabelParam ?? ''}|${initNodeCategoryParam ?? ''}`;
  const hasNodeParams = !!(initNodeIdParam || initNodeLabelParam || initNodeCategoryParam);

  // Sync queryItem from URL prefills when they appear/change, but not when they are
  // cleared — clearing must keep the current query type (init falls back to queryTypes[0]).
  const [queryItem, setQueryItem] = useState(initQueryItem);
  useEffect(() => {
    if (!hasNodeParams) return;
    setQueryItem(initQueryItem);
  }, [hasNodeParams, nodeParamsKey, initQueryItem]);

  const [inputText, setInputText] = useStateSyncedTo(initInputText, nodeParamsKey);
  const clearHomeQueryNodeParams = useClearHomeQueryNodeParams();

  // Clear the selected entity while keeping the current query type.
  // Do not reset to initQueryItem — when landing from canvas/node URL params,
  // that would re-apply the prefilled node instead of clearing.
  // Also strip those URL params so a remount/refresh cannot re-prefill.
  const clear = useCallback(() => {
    setQueryItem((prev) => ({ type: prev.type, node: null }));
    setInputText('');
    clearHomeQueryNodeParams();
  }, [setQueryItem, setInputText, clearHomeQueryNodeParams]);

  return {
    queryItem,
    setQueryItem,
    inputText,
    setInputText,
    clear
  };
};
