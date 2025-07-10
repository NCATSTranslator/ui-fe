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

export const remove = async (url: string): Promise<Response> => {
  return fetch(url, buildOptions('DELETE'));
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
    
    const data = await response.json();
    
    if (responseValidator && !responseValidator(data)) {
      throw new Error('Invalid response format');
    }
    
    return data;
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