import { forbiddenErrorToast, internalServerErrorToast, notFoundErrorToast, unauthorizedErrorToast } from "@/features/Core/utils/toastMessages";
import { AutocompleteItem } from "@/features/Query/types/querySubmission";

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
  if (error.message.includes('401'))
    unauthorizedErrorToast();

    // TODO: redirect to login page
  if (error.message.includes('403'))
    forbiddenErrorToast();

    // TODO: redirect to login page
  if (error.message.includes('404'))
    notFoundErrorToast();

  if (error.message.includes('500'))
    internalServerErrorToast();

  throw error;
};

export const defaultFetchErrorHandler: ErrorHandler = (error: Error): void => {
  console.error('Fetch Error:', error.message);
  throw error;
};

/**
 * Type guard to check if an object is an ErrorObject
 */
export const isErrorObject = (obj: unknown): obj is ErrorObject => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'error' in obj &&
    'message' in obj &&
    'status' in obj
  );
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
    
    // Handle responses that might be plain text "OK" instead of JSON
    const contentType = response.headers.get('content-type');
    let data: unknown;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // For non-JSON responses, try to get text first
      const textResponse = await response.text();
      // If the response is "OK", return it as is, otherwise try to parse as JSON
      if (textResponse === 'OK') {
        data = textResponse;
      } else {
        try {
          data = JSON.parse(textResponse);
        } catch {
          // If it's not valid JSON, return the text as is
          data = textResponse;
        }
      }
    }
    
    if (responseValidator && !responseValidator(data)) {
      throw new Error('Invalid response format');
    }
    
    return data as T;
  } catch (error) {
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
  }
};

/**
 * Decodes query parameters from a search string.
 * Automatically detects and decodes base64 encoded portions while preserving other parameters.
 *
 * @param {string} search - The search string (e.g., "?param=value" or "param=value").
 * @returns {string} The decoded query parameters.
 */
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
      const decoded = window.atob(segment);
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
  return window.btoa(params);
}

/**
 * Generates the share URL path for a results query.
 *
 * @param {string} label - The label of the result.
 * @param {string | number} nodeID - The ID of the node.
 * @param {string | number} typeID - The ID of the type.
 * @param {string | number} resultID - The ID of the result.
 * @param {string | number} pk - The ID of the query.
 * @param {boolean} shouldHash - Whether to hash the parameters.
 * @returns {string} The share URL path.
 */
export const getResultsShareURLPath = (label: string, nodeID: string | number, typeID: string | number, resultID: string | number, pk: string | number, shouldHash: boolean = false) => {
  let path = "";
  // partially encode params, q (query pk) is not encoded
  if(shouldHash)
    path = `results?${encodeParams(`l=${label}&i=${nodeID}&t=${typeID}&r=${resultID}`)}&q=${pk}`;
  else
    path = `results?${`l=${label}&i=${nodeID}&t=${typeID}&r=${resultID}&q=${pk}`}`;

  return path;
}

/**
 * Generates the share URL path for a pathfinder results query.
 *
 * @param {AutocompleteItem} itemOne - The first item.
 * @param {AutocompleteItem} itemTwo - The second item.
 * @param {string} resultID - The ID of the result.
 * @param {string | undefined} constraint - The constraint.
 * @param {string} pk - The ID of the query.
 * @param {boolean} shouldHash - Whether to hash the parameters.
 * @returns {string} The share URL path.
 */
export const getPathfinderResultsShareURLPath = (itemOne: AutocompleteItem, itemTwo: AutocompleteItem, resultID: string, constraint: string | undefined, pk: string, shouldHash: boolean = false) => {
  let labelOne = (itemOne.label) ? itemOne.label : null;
  let labelTwo = (itemTwo.label) ? itemTwo.label : null;
  let idOne = (itemOne.id) ? itemOne.id : null;
  let idTwo = (itemTwo.id) ? itemTwo.id : null;
  let constraintVar = !!constraint ?  `&c=${constraint}`: '';
  let path = "";
  // partially encode params, q (query pk) is not encoded
  if(shouldHash)
    path = `results?${encodeParams(`lone=${labelOne}&ltwo=${labelTwo}&ione=${idOne}&itwo=${idTwo}&t=p${constraintVar}&r=${resultID}`)}&q=${pk}`;
  else
    path = `results?${`lone=${labelOne}&ltwo=${labelTwo}&ione=${idOne}&itwo=${idTwo}&t=p${constraintVar}&r=${resultID}&q=${pk}`}`;
  return path;
}