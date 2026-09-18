/**
 * Opens a server-sent-events POST request.
 *
 * `Connection` and `keep-alive` are deliberately absent: they are forbidden
 * header names, so the browser strips them and only the Accept header actually
 * tells the server to stream.
 * @param {string} endpoint URL to POST to
 * @param {string} body Serialized request payload
 * @param {AbortSignal} [signal] Signal used to cancel the stream
 * @returns {Promise<Response>} The streaming response
 */
export const createStreamingRequest = (
  endpoint: string,
  body: string,
  signal?: AbortSignal,
): Promise<Response> =>
  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
    body,
    signal,
  });

/**
 * Logs a failed request with enough detail to tell a network failure apart from
 * a server error when only a user's console output is available.
 * @param {unknown} error The thrown value
 * @param {string} context Label identifying the request that failed
 */
export const logHTTPError = (error: unknown, context: string = 'HTTP Request'): void => {
  console.error(`${context} failed:`, {
    message: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : 'Unknown',
    stack: error instanceof Error ? error.stack : undefined,
  });
};
