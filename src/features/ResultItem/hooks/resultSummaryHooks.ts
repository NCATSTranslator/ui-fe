import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Result, ResultSet } from "@/features/ResultList/types/results";
import { useQuery } from "@tanstack/react-query";
import { resultToSummarySpec } from "@/features/ResultItem/utils/resultSummaryFunctions";
import { createStreamingRequest, logHTTPError } from "@/features/Common/utils/httpUtils";

const API_URL = `https://transltr-bma-ui-dev.ncats.io/summarizer/summary-streaming`;

// old, non-streaming summary hook (not used anymore)
export const useResultSummary = (resultSet: ResultSet | null, result: Result, diseaseId: string, diseaseName: string, diseaseDescription: string) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["resultSummary", result, diseaseId, diseaseName, diseaseDescription],
    queryFn: async () => {
      const response = await fetch(`${API_URL}`, {
        method: "POST",
        body: JSON.stringify(resultToSummarySpec(resultSet!, result, diseaseId, diseaseName, diseaseDescription)),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok)
        throw new Error("Failed to fetch summary");
      
      return response.json();
    },
    enabled: false,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  return { data, isLoading, error, refetch };
}

/**
 * Custom hook to fetch and stream a summary of a result with simplified event handling.
 * @param {ResultSet} resultSet - The result set to fetch the summary for.
 * @param {string} endpoint - The endpoint to fetch the summary from.
 * @param {Result} result - The result to fetch the summary for.
 * @param {string} diseaseId - The disease ID to fetch the summary for.  
 * @param {string} diseaseName - The disease name to fetch the summary for.
 * @param {string} diseaseDescription - The disease description to fetch the summary for.
 * @param {() => void} onComplete - The function to call when the summary is complete.
 * @param {() => void} onCancel - The function to call when the summary is cancelled.
 * @returns {Object} - An object containing the streamed text, reasoning text, message text, is streaming, is error, summary state, is loading, start stream, cancel stream, update summary, clear summary, fetch and update summary, clear and refetch summary, and storage key.
 */
export const useStreamingSummaryState = (
  resultSet: ResultSet | null,
  endpoint: string,
  result: Result,
  diseaseId: string,
  diseaseName: string,
  diseaseDescription: string,
  onComplete?: () => void,
  onCancel?: () => void
): {
  streamedText: string;
  reasoningText: string;
  messageText: string;
  functionCallText: string;
  isStreaming: boolean;
  isError: boolean;
  summaryState: { content: ReactNode | null; hasCached: boolean };
  isLoading: boolean;
  startStream: () => Promise<void>;
  cancelStream: () => void;
  updateSummary: (content: ReactNode | null) => void;
  clearSummary: () => void;
  fetchAndUpdateSummary: () => Promise<void>;
  clearAndRefetchSummary: () => Promise<void>;
  storageKey: string;
} => {
  const [streamedText, setStreamedText] = useState('');
  const [reasoningText, setReasoningText] = useState('');
  const [messageText, setMessageText] = useState('');
  const [functionCallText, setFunctionCallText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isError, setIsError] = useState(false);
  const [summaryState, setSummaryState] = useState<{ content: ReactNode | null; hasCached: boolean }>(() => {
    const storageKey = `resultSummary_${result.id}`;
    const cachedSummary = localStorage.getItem(storageKey);
    return {
      content: cachedSummary,
      hasCached: !!cachedSummary
    };
  });
  const [isLoading, setIsLoading] = useState(false);
  const isComplete = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const hasBeenCanceled = useRef<boolean>(false);
  const storageKey = `resultSummary_${result.id}`;
  const body = JSON.stringify(resultToSummarySpec(resultSet!, result, diseaseId, diseaseName, diseaseDescription));

  const linkifyReferences = (text: string): string => {
    // Link PMC IDs (e.g., PMC4163991, PMC 4163991) to PubMed Central
    text = text.replace(
      /\bPMC[:\s]?(\d+)\b/g,
      '<a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC$1/" target="_blank" rel="noopener noreferrer">PMC$1</a>'
    );
    // Link PMID IDs (e.g., PMID:14974815, PMID 14974815, PMID14974815) to PubMed
    text = text.replace(
      /\bPMID[:\s]?(\d+)\b/g,
      '<a href="https://pubmed.ncbi.nlm.nih.gov/$1/" target="_blank" rel="noopener noreferrer">PMID:$1</a>'
    );
    // Link NCT IDs (e.g., NCT00977977) to ClinicalTrials.gov
    text = text.replace(
      /\bNCT(\d+)\b/g,
      '<a href="https://clinicaltrials.gov/ct2/show/NCT$1" target="_blank" rel="noopener noreferrer">NCT$1</a>'
    );
    return text;
  };

  const formatOutputText = (text: string) => {
    const formatted = text.replace(/\.\*\*/g, '.<br />**').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return linkifyReferences(formatted);
  }

  const updateSummary = useCallback((content: ReactNode | null) => {
    setSummaryState({
      content,
      hasCached: !!content
    });
    
    if (content) {
      localStorage.setItem(storageKey, content as string);
    }
  }, [storageKey]);

  const clearSummary = useCallback(() => {
    setSummaryState({ content: null, hasCached: false });
    setStreamedText('');
    setReasoningText('');
    setMessageText('');
  }, []);

  const fetchTextStream = async (signal: AbortSignal) => {
    console.log("Fetching new summary...");
    
    try {
      const response = await createStreamingRequest(endpoint, body, signal);
      
      if (!response.ok) 
        throw new Error(`HTTP error! status: ${response.status}`);
      if (!response.body) 
        throw new Error('No response body received');

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        try {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Process complete lines from the buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.trim()) {
              try {
                // Handle SSE format: lines starting with "data: " contain the JSON
                if (line.startsWith('data: ')) {
                  const jsonStr = line.substring(6); // Remove "data: " prefix
                  const eventData = JSON.parse(jsonStr);
                  
                  // Check for completion signal
                  if (eventData.complete === true) {
                    setIsStreaming(false);
                    continue;
                  }
                  if (eventData.error) {
                    setIsError(true);
                    setStreamedText(prev => {
                      const withoutError = prev.replace(/<div class="error">[\s\S]*?<\/div>/, '');
                      return `${withoutError}<div class="error">${eventData.error}</div>`;
                    });
                    continue;
                  }
                  
                  // Handle event object
                  const event = eventData.event;
                  if (!event) continue;
                  
                  if (event.type === 'message') {
                    if (event.output_text) {
                      const outputText = formatOutputText(event.output_text);
                      setMessageText(outputText);
                      setStreamedText(outputText);
                    }
                  } else if (event.type === 'reasoning') {
                    if (event.output_text) {
                      const outputText = formatOutputText(event.output_text);
                      setReasoningText(outputText);
                      setStreamedText(prev => {
                        // Replace any previous reasoning with new content
                        const withoutReasoning = prev.replace(/<div class="reasoning">[\s\S]*?<\/div>/, '');
                        return `${withoutReasoning}<div class="reasoning">${outputText}</div>`;
                      });
                    }
                  } else if (event.type === 'function_call_outputs') {
                    // Show "calling functions..." message
                    setFunctionCallText('calling functions...');
                    setStreamedText(prev => {
                      const withoutFunctionCall = prev.replace(/<div class="function-call">[\s\S]*?<\/div>/, '');
                      return `${withoutFunctionCall}<div class="function-call">calling functions...</div>`;
                    });
                  } else if (event === 'error') {
                    setIsError(true);
                    setStreamedText(prev => {
                      const withoutError = prev.replace(/<div class="error">[\s\S]*?<\/div>/, '');
                      return `${withoutError}<div class="error">${event.error_message}</div>`;
                    });
                  }
                }
                // Skip lines that start with "event: " as they're just event type indicators
              } catch (parseError) {
                console.warn('Failed to parse event:', line, parseError);
              }
            }
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') 
            break;
          throw error;
        }
      }

      return streamedText;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Stream cancelled');
        return null;
      }
      
      // Log detailed error information for debugging
      logHTTPError(error, 'Stream Summary');
      
      throw error;
    } finally {
      readerRef.current = null;
    }
  };

  const { refetch } = useQuery({
    queryKey: ['newTextStream', result.id],
    queryFn: () => {
      abortControllerRef.current = new AbortController();
      return fetchTextStream(abortControllerRef.current.signal);
    },
    enabled: false,
    refetchOnWindowFocus: false,
    retry: 3
  });

  useEffect(() => {
    if (streamedText && !isStreaming && !isComplete.current) {
      isComplete.current = true;
      // Update the summary state with the final streamed text
      updateSummary(streamedText);
      console.log('reasoningText: ', reasoningText || 'no reasoning provided');
      if (onComplete)
        onComplete();
    }
  }, [streamedText, isStreaming, updateSummary, onComplete]);

  const startStream = async () => {
    setStreamedText('');
    setReasoningText('');
    setMessageText('');
    setIsStreaming(true);
    setIsError(false);
    isComplete.current = false;
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
      if (onCancel) onCancel();
      hasBeenCanceled.current = true;
      setIsStreaming(false);
    }
  };

  const fetchAndUpdateSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      await startStream();
    } catch (error) {
      console.error('Error starting stream:', error);
      
      // Check if it's an HTTP/2 protocol error
      if (error instanceof Error && 
          (error.message.includes('HTTP2_PROTOCOL_ERROR') || 
           error.message.includes('ERR_HTTP2_PROTOCOL_ERROR'))) {
        console.error('HTTP/2 Protocol Error - This may indicate server compatibility issues. Consider:');
        console.error('1. Checking if the server supports HTTP/2 properly');
        console.error('2. Verifying the endpoint URL is correct');
        console.error('3. Checking network connectivity');
      }
      
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearAndRefetchSummary = useCallback(async () => {
    clearSummary();
    await fetchAndUpdateSummary();
  }, [clearSummary, fetchAndUpdateSummary]);

  return {
    streamedText,
    reasoningText,
    messageText,
    functionCallText,
    isStreaming,
    isError,
    summaryState,
    isLoading,
    startStream,
    cancelStream,
    updateSummary,
    clearSummary,
    fetchAndUpdateSummary,
    clearAndRefetchSummary,
    storageKey
  };
};

