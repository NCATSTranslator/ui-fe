import { useState, useEffect, useRef, RefObject } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResultContextObject } from '@/features/ResultList/utils/llm';

interface TextStreamHookResult {
  streamedText: string;
  isStreaming: boolean;
  isError: boolean;
  startStream: () => Promise<void>;
  cancelStream: () => void;
}

const readStream = async (
  response: Response,
  readerRef: RefObject<ReadableStreamDefaultReader<Uint8Array> | null>,
  onChunk: (chunk: string) => void,
): Promise<string> => {
  if (!response.body)
    throw new Error('No response body received');

  const reader = response.body.getReader();
  readerRef.current = reader;
  const decoder = new TextDecoder('utf-8');
  let result = '';

  while (true) {
    try {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      result += chunk;
      onChunk(chunk);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError')
        break;
      throw error;
    }
  }

  return result;
};

interface FetchStreamOptions {
  endpoint: string;
  queryString: string;
  resultContext: RefObject<ResultContextObject[] | null>;
  signal: AbortSignal;
  readerRef: RefObject<ReadableStreamDefaultReader<Uint8Array> | null>;
  onChunk: (chunk: string) => void;
}

const fetchTextStream = async ({
  endpoint, queryString, resultContext, signal, readerRef, onChunk,
}: FetchStreamOptions): Promise<string | null> => {
  console.log("Fetching new summary...");
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: queryString, results: resultContext.current }),
    signal,
  };

  try {
    const response = await fetch(endpoint, requestOptions);
    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);
    return await readStream(response, readerRef, onChunk);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Stream cancelled');
      return null;
    }
    throw error;
  } finally {
    readerRef.current = null;
  }
};

export const useTextStream = (
  endpoint: string,
  queryString: string,
  resultContext: RefObject<ResultContextObject[] | null>,
  onComplete?: () => void,
  onCancel?: () => void
): TextStreamHookResult => {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const hasBeenCanceled = useRef<boolean>(false);

  const { isError, refetch, data, error } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['textStream'],
    queryFn: () => {
      abortControllerRef.current = new AbortController();
      return fetchTextStream({
        endpoint, queryString, resultContext,
        signal: abortControllerRef.current.signal,
        readerRef,
        onChunk: (chunk) => setStreamedText((prev) => prev + chunk),
      });
    },
    enabled: false,
    refetchOnWindowFocus: false,
    retry: 3,
  });

  useEffect(() => {
    if (data !== undefined) {
      setIsStreaming(false);
      if (onComplete && data !== null && !hasBeenCanceled.current)
        onComplete();
      hasBeenCanceled.current = false;
    }
  }, [data, onComplete]);

  useEffect(() => {
    if (error) {
      setIsStreaming(false);
      if (!(error instanceof Error && error.name === 'AbortError')) {
        console.error('Stream error:', error);
      }
    }
  }, [error]);

  const startStream = async () => {
    setStreamedText('');
    setIsStreaming(true);
    hasBeenCanceled.current = false;
    await refetch();
  };

  const cancelStream = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    } catch (error) {
      console.log('Error during cancellation:', error);
    } finally {
      if(onCancel)
        onCancel();
      hasBeenCanceled.current = true;
      setIsStreaming(false);
    }
  };

  return { streamedText, isStreaming, isError, startStream, cancelStream };
};
