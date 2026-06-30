import { forbiddenErrorToast, internalServerErrorToast, notFoundErrorToast, unauthorizedErrorToast } from "@/features/Core/utils/toastMessages";
import { AutocompleteItem } from "@/features/Query/types/querySubmission";
import { checkProperties } from "@/features/Core/types/checkers";

const stripTrailingEquals = (str: string): string => {
  let end = str.length;
  while (end > 0 && str[end - 1] === '=') end--;
  return str.slice(0, end);
};

const buildOptions = (method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: unknown) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  const options: { method: string; headers: Record<string, string>; body?: string } = {
    method: method,
    headers: headers
  };

  if (method !== 'GET' && body !== undefined) {
    options.body = JSON.stringify(body);
  }

  return options;
};

export const get = async (url: string): Promise<Response> => {
  return fetch(url, buildOptions('GET'));
};

export const post = async (url: string, body: unknown): Promise<Response> => {
  return fetch(url, buildOptions('POST', body));
};

export const put = async (url: string, body: unknown): Promise<Response> => {
  return fetch(url, buildOptions('PUT', body));
};

export const remove = async (url: string, body?: unknown): Promise<Response> => {
  return fetch(url, buildOptions('DELETE', body));
};

// Error handling utilities
export interface ErrorObject {
  error: string;
  message: string;
  status: number;
}

export type ErrorHandler = (error: Error) => void;

export const defaultHttpErrorHandler: ErrorHandler = (error: Error): void => {
  console.error('HTTP Error:', error.message);
  if (error.message.includes('401')) {
    unauthorizedErrorToast();
  } else if (error.message.includes('403')) {
    forbiddenErrorToast();
  } else if (error.message.includes('404')) {
    notFoundErrorToast();
  } else if (error.message.includes('500')) {
    internalServerErrorToast();
  }
};

export const defaultFetchErrorHandler: ErrorHandler = (error: Error): void => {
  console.error('Fetch Error:', error.message);
};

/**
 * Type guard to check if an object is an ErrorObject
 */
export const isErrorObject = (obj: unknown, warn = false): obj is ErrorObject => {
  if (typeof obj !== 'object' || obj === null) {
    if (warn) console.warn("[isErrorObject] expected object, got:", typeof obj, obj);
    return false;
  }
  const o = obj as Record<string, unknown>;
  return checkProperties("isErrorObject", obj, [
    ["error", "error" in obj, "present", o.error],
    ["message", "message" in obj, "present", o.message],
    ["status", "status" in obj, "present", o.status],
  ], warn);
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  const textResponse = await response.text();
  if (textResponse === 'OK') {
    return textResponse;
  }
  try {
    return JSON.parse(textResponse);
  } catch {
    return textResponse;
  }
};

const handleFetchError = (
  error: unknown,
  httpErrorHandler: ErrorHandler,
  fetchErrorHandler: ErrorHandler
): never => {
  if (error instanceof Error) {
    if (error.message.includes('HTTP Error')) {
      httpErrorHandler(error);
    } else {
      fetchErrorHandler(error);
    }
  } else {
    fetchErrorHandler(new Error('Unknown error occurred'));
  }
  throw error;
};

/**
 * Generic fetch wrapper with error handling
 */
export const fetchWithErrorHandling = async <T>(
  fetchMethod: () => Promise<Response>,
  httpErrorHandler: ErrorHandler = defaultHttpErrorHandler,
  fetchErrorHandler: ErrorHandler = defaultFetchErrorHandler,
  responseValidator?: (data: unknown) => data is T
): Promise<T> => {
  try {
    const response = await fetchMethod();

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (isErrorObject(errorData)) {
        throw new Error(`${errorData.error}: ${errorData.message}`);
      } else {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await parseResponseBody(response);

    if (responseValidator && !responseValidator(data)) {
      throw new Error('Invalid response format');
    }

    return data as T;
  } catch (error) {
    return handleFetchError(error, httpErrorHandler, fetchErrorHandler);
  }
};

/**
 * Decodes query parameters from a search string.
 * Automatically detects and decodes base64 encoded portions while preserving other parameters.
 *
 * @param {string} search - The search string (e.g., "?param=value" or "param=value").
 * @returns {string} The decoded query parameters.
 */
/**
 * Decodes a single URL-safe or standard base64 segment.
 * Handles URI-encoded characters, URL-safe base64 substitutions (-/_ → +//),
 * and normalizes padding before decoding.
 *
 * @param {string} segment - A raw query string segment that may be base64.
 * @returns {string} The decoded string.
 * @throws If the segment is not valid base64.
 */
export const decodeBase64Param = (segment: string): string => {
  const uriDecoded = decodeURIComponent(segment);
  const standardB64 = uriDecoded.replace(/-/g, '+').replace(/_/g, '/');
  const strippedPadding = stripTrailingEquals(standardB64);
  const normalizedB64 = strippedPadding + '='.repeat((4 - strippedPadding.length % 4) % 4);
  return window.atob(normalizedB64);
}

export const getDecodedParamsFromSearch = (search: string): string => {
  if (!search)
    return "";

  // Remove leading ? if present
  const searchParams = search.startsWith('?') ? search.slice(1) : search;
  
  // Split by & to handle individual parameter segments
  const segments = searchParams.split('&');
  const decodedSegments: string[] = [];

  for (const segment of segments) {
    // Skip empty segments
    if (!segment)
      continue;

    // Try to decode as base64 first
    // If successful and results in valid query parameters, use decoded version
    // Otherwise treat as regular key=value parameter
    try {
      const decoded = decodeBase64Param(segment);
      // Verify the decoded content looks like query parameters
      // It should contain at least one = that's not at the start or end
      const hasValidQueryFormat = decoded.includes('=') && 
        decoded.indexOf('=') > 0 && 
        decoded.indexOf('=') < decoded.length - 1;
      
      if (hasValidQueryFormat) {
        decodedSegments.push(decoded);
      } else {
        // If decoded content doesn't look like query parameters, keep original
        decodedSegments.push(segment);
      }
    } catch {
      // If decoding fails, this is a regular key=value parameter or invalid base64
      // Keep the original segment
      decodedSegments.push(segment);
    }
  }

  return decodedSegments.join('&');
}

/**
 * Retrieves the decoded query parameters from the URL.
 * Automatically detects and decodes base64 encoded portions while preserving other parameters.
 *
 * @returns {string} The decoded query parameters.
 */
export const getDecodedParams = (): string => {
  return getDecodedParamsFromSearch(window.location.search);
}

/**
 * Encodes the query parameters.
 *
 * @param {string} params - The query parameters to encode.
 * @returns {string} The encoded query parameters.
 */
export const encodeParams = (params: string): string => {
  if(!params)
    return "";
  return stripTrailingEquals(
    window.btoa(params)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  );
}

/**
 * Generates the share URL path for a results query.
 *
 * @param {string} label - The label of the result.
 * @param {string} nodeID - The ID of the node.
 * @param {string | number} typeID - The ID of the type.
 * @param {string} resultID - The ID of the result. Used as a URL path segment
 *   (`results/{resultID}?...`). Pass `'0'` for list-only links (`results?...`).
 * @param {string | number} pk - The ID of the query.
 * @param {boolean} shouldHash - Whether to hash the parameters.
 * @returns {string} The share URL path — either `results?{params}` when
 *   resultID is `'0'`, or `results/{resultID}?{params}` otherwise.
 */
/**
 * Builds a results share URL path from a raw query string, optionally hashing
 * the parameters and appending the query id.
 *
 * @param {string} rawParams - The unencoded query parameters (without the `q` param).
 * @param {string} resultID - The result id. Pass `'0'` for list-only links.
 * @param {string | number} pk - The id of the query.
 * @param {boolean} shouldHash - Whether to hash the parameters.
 * @returns {string} `results?{params}` when resultID is `'0'`, otherwise `results/{resultID}?{params}`.
 */
const buildResultsShareURLPath = (rawParams: string, resultID: string, pk: string | number, shouldHash: boolean): string => {
  const params = shouldHash
    ? `${encodeParams(rawParams)}&q=${pk}`
    : `${rawParams}&q=${pk}`;

  return resultID === '0'
    ? `results?${params}`
    : `results/${resultID}?${params}`;
}

interface ResultsShareURLParams {
  label: string;
  nodeID: string;
  typeID: string | number;
  resultID: string;
  pk: string | number;
  shouldHash?: boolean;
}

export const getResultsShareURLPath = ({ label, nodeID, typeID, resultID, pk, shouldHash = false }: ResultsShareURLParams) => {
  return buildResultsShareURLPath(`l=${label}&i=${nodeID}&t=${typeID}`, resultID, pk, shouldHash);
}

/**
 * Generates the share URL path for a pathfinder results query.
 *
 * @param {AutocompleteItem} itemOne - The first item.
 * @param {AutocompleteItem} itemTwo - The second item.
 * @param {string} resultID - The ID of the result. Used as a URL path segment
 *   (`results/{resultID}?...`). Pass `'0'` for list-only links (`results?...`).
 * @param {string | undefined} constraint - The constraint.
 * @param {string} pk - The ID of the query.
 * @param {boolean} shouldHash - Whether to hash the parameters.
 * @returns {string} The share URL path — either `results?{params}` when
 *   resultID is `'0'`, or `results/{resultID}?{params}` otherwise.
 */
interface PathfinderShareURLParams {
  itemOne: AutocompleteItem;
  itemTwo: AutocompleteItem;
  resultID: string;
  constraint: string | undefined;
  pk: string;
  shouldHash?: boolean;
}

export const getPathfinderResultsShareURLPath = ({ itemOne, itemTwo, resultID, constraint, pk, shouldHash = false }: PathfinderShareURLParams) => {
  const labelOne = (itemOne.label) ? itemOne.label : null;
  const labelTwo = (itemTwo.label) ? itemTwo.label : null;
  const idOne = (itemOne.id) ? itemOne.id : null;
  const idTwo = (itemTwo.id) ? itemTwo.id : null;
  const constraintVar = !!constraint ?  `&c=${constraint}`: '';
  return buildResultsShareURLPath(`lone=${labelOne}&ltwo=${labelTwo}&ione=${idOne}&itwo=${idTwo}&t=p${constraintVar}`, resultID, pk, shouldHash);
}

export const getLookupResultsShareURLPath = (item: AutocompleteItem, objectCategory: string, resultID: string, pk: string, shouldHash: boolean = false) => {
  const label = item.label || '';
  const id = item.id || '';
  return buildResultsShareURLPath(`lone=${label}&ione=${id}&cat=${objectCategory}&t=l`, resultID, pk, shouldHash);
}