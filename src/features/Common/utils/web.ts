import { AutocompleteItem } from "@/features/Query/types/querySubmission";
import { toast } from "react-toastify";

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
    toast.error('Your login has expired or is invalid. Please try logging in again.');
    // TODO: redirect to login page
  }
  if (error.message.includes('403')) {
    toast.error('You do not have permission to access this resource. Please contact support if you believe this is an error.');
    // TODO: redirect to login page
  }
  if (error.message.includes('404')) {
    toast.error('The requested resource was not found. Please contact support if you believe this is an error.');
  }
  if (error.message.includes('500')) {
    toast.error('An internal server error occurred. Please try again later or contact support if the problem persists.');
  }
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
 * Retrieves the decoded query parameters from the URL.
 *
 * @returns {string} The decoded query parameters.
 */
export const getDecodedParams = (): string => {
  if(!window.location.search)
    return "";
  let decodedParams = window.location.search.slice(1);
  try {
    decodedParams = window.atob(decodedParams);
  } catch {
    // if the search is not encoded, return the search without decoding
    decodedParams = window.location.search.slice(1);
  }
  
  return decodedParams;
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
 * @returns {string} The share URL path.
 */
export const getResultsShareURLPath = (label: string, nodeID: string | number, typeID: string | number, resultID: string | number, pk: string | number) => {
  // let path = `results?${encodeParams(`l=${label}&i=${nodeID}&t=${typeID}&r=${resultID}&q=${pk}`)}`;
  // TODO: replace with above if NCATS approves
  let path = `results?${`l=${label}&i=${nodeID}&t=${typeID}&r=${resultID}&q=${pk}`}`;
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
 * @returns {string} The share URL path.
 */
export const getPathfinderResultsShareURLPath = (itemOne: AutocompleteItem, itemTwo: AutocompleteItem, resultID: string, constraint: string | undefined, pk: string) => {
  let labelOne = (itemOne.label) ? itemOne.label : null;
  let labelTwo = (itemTwo.label) ? itemTwo.label : null;
  let idOne = (itemOne.id) ? itemOne.id : null;
  let idTwo = (itemTwo.id) ? itemTwo.id : null;
  let constraintVar = !!constraint ?  `&c=${constraint}`: '';
  // let path = `results?${encodeParams(`lone=${labelOne}&ltwo=${labelTwo}&ione=${idOne}&itwo=${idTwo}&t=p${constraintVar}&r=${resultID}&q=${pk}`)}`;
  // TODO: replace with above if NCATS approves
  let path = `results?${`lone=${labelOne}&ltwo=${labelTwo}&ione=${idOne}&itwo=${idTwo}&t=p${constraintVar}&r=${resultID}&q=${pk}`}`;
  return path;
}