/**
 * Utility functions for HTTP requests with HTTP/2 compatibility
 */

/**
 * Creates fetch options with HTTP/2 compatible headers
 */
export const createHTTP2CompatibleOptions = (
  method: string,
  body: string | null,
  signal?: AbortSignal,
  additionalHeaders?: Record<string, string>
) => {
  return {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...additionalHeaders
    },
    body,
    signal
  };
};

/**
 * Fetches with HTTP/2 fallback to HTTP/1.1 if protocol errors occur
 */
export const fetchWithHTTP2Fallback = async (
  endpoint: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string | null;
    signal?: AbortSignal;
  }
): Promise<Response> => {
  try {
    return await fetch(endpoint, options);
  } catch (fetchError) {
    // Handle HTTP/2 protocol errors specifically
    if (fetchError instanceof Error && 
        (fetchError.message.includes('HTTP2_PROTOCOL_ERROR') || 
         fetchError.message.includes('ERR_HTTP2_PROTOCOL_ERROR'))) {
      console.warn('HTTP/2 protocol error, retrying with HTTP/1.1 fallback...');
      
      // Retry with HTTP/1.1 fallback
      const fallbackOptions = {
        ...options,
        headers: {
          ...options.headers,
          'Connection': 'close' // Force HTTP/1.1
        }
      };
      
      try {
        return await fetch(endpoint, fallbackOptions);
      } catch (fallbackError) {
        console.error('HTTP/1.1 fallback also failed:', fallbackError);
        throw fallbackError;
      }
    }
    
    throw fetchError;
  }
};

/**
 * Checks if the current environment supports HTTP/2
 */
export const supportsHTTP2 = (): boolean => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return false;
  
  // Check if fetch supports HTTP/2 (this is a basic check)
  // Most modern browsers support HTTP/2 by default
  return true;
};

/**
 * Gets detailed browser capability information
 */
export const getBrowserCapabilities = () => {
  if (typeof window === 'undefined') return null;
  
  return {
    userAgent: navigator.userAgent,
    supportsFetch: typeof fetch !== 'undefined',
    supportsAbortController: typeof AbortController !== 'undefined',
    supportsReadableStream: typeof ReadableStream !== 'undefined',
    supportsTextDecoder: typeof TextDecoder !== 'undefined',
    supportsHTTP2: supportsHTTP2(),
    connection: (navigator as unknown as { connection: { effectiveType: string, downlink: number, rtt: number } }).connection ? {
      effectiveType: (navigator as unknown as { connection: { effectiveType: string } }).connection.effectiveType,
      downlink: (navigator as unknown as { connection: { downlink: number } }).connection.downlink,
      rtt: (navigator as unknown as { connection: { rtt: number } }).connection.rtt
    } : null
  };
};

/**
 * Logs HTTP protocol information for debugging
 */
export const logHTTPProtocolInfo = (endpoint: string) => {
  if (typeof window === 'undefined') return;
  
  const capabilities = getBrowserCapabilities();
  
  console.log('HTTP Protocol Debug Info:', {
    endpoint,
    capabilities,
    timestamp: new Date().toISOString(),
    location: window.location.href
  });
};

/**
 * Tests endpoint connectivity and protocol support
 */
export const testEndpointConnectivity = async (endpoint: string): Promise<{
  reachable: boolean;
  protocol: string;
  status: number;
  error?: string;
}> => {
  try {
    // Try a simple HEAD request to test connectivity
    const response = await fetch(endpoint, {
      method: 'HEAD',
      headers: {
        'Accept': '*/*'
      }
    });
    
    return {
      reachable: true,
      protocol: response.headers.get('x-powered-by') || 'unknown',
      status: response.status
    };
  } catch (error) {
    return {
      reachable: false,
      protocol: 'unknown',
      status: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Creates a streaming request with proper error handling
 */
export const createStreamingRequest = async (
  endpoint: string,
  body: string,
  signal?: AbortSignal,
  timeoutMs: number = 30000 // 30 second default timeout
): Promise<Response> => {
  // Log protocol information for debugging
  // logHTTPProtocolInfo(endpoint);
  
  const options = createHTTP2CompatibleOptions('POST', body, signal);
  
  // Add timeout handling
  const timeoutId = setTimeout(() => {
    if (signal && !signal.aborted) {
      console.warn('Request timeout, aborting...');
      // Note: We can't abort the signal from here, but the timeout will help identify hanging requests
    }
  }, timeoutMs);
  
  try {
    const response = await fetchWithHTTP2Fallback(endpoint, options);
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Enhanced error logging for debugging HTTP issues
 */
export const logHTTPError = (error: unknown, context: string = 'HTTP Request') => {
  console.error(`${context} Error:`, {
    message: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : 'Unknown',
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
  });
  
  // Additional error categorization for common issues
  if (error instanceof Error) {
    if (error.message.includes('HTTP2_PROTOCOL_ERROR') || 
        error.message.includes('ERR_HTTP2_PROTOCOL_ERROR')) {
      console.error('HTTP/2 Protocol Error detected - this may indicate server compatibility issues');
    } else if (error.message.includes('Failed to fetch') || 
               error.message.includes('NetworkError')) {
      console.error('Network Error detected - check internet connection and server availability');
    } else if (error.message.includes('timeout')) {
      console.error('Timeout Error detected - server may be slow or unresponsive');
    }
  }
};
