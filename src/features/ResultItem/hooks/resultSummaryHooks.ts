import { useCallback, useMemo, useRef, useState } from "react";
import { Result, ResultSet } from "@/features/ResultList/types/results";
import { formatSummaryText, resultToSummarySpec } from "@/features/ResultItem/utils/resultSummaryFunctions";
import { createStorageKey, SummaryState } from "@/features/ResultItem/hooks/useResultItemInteractables";
import { createStreamingRequest, logHTTPError } from "@/features/Core/utils/httpUtils";

const SUMMARY_ENDPOINT = 'https://transltr-bma-ui-dev.ncats.io/summarizer/summary-streaming';

/** The distinct pieces the summarizer streams back, kept apart so a late chunk of one cannot clobber another. */
interface StreamParts {
  message: string;
  reasoning: string;
  functionCall: string;
}

const EMPTY_PARTS: StreamParts = { message: '', reasoning: '', functionCall: '' };

/** What one decoded `data:` line did to the stream. */
interface StreamEventResult {
  parts: StreamParts;
  complete: boolean;
  failed: boolean;
}

/**
 * Renders the streamed pieces as the HTML the modal displays. Once the answer
 * itself arrives the progress chatter is dropped, so the reader is left with
 * the summary rather than a transcript of how it was produced.
 */
const composeStreamHtml = ({ message, reasoning, functionCall }: StreamParts): string => {
  if (message) return message;
  return [
    reasoning && `<span class="reasoning">${reasoning}</span>`,
    functionCall && `<span class="function-call">${functionCall}</span>`,
  ].filter(Boolean).join('');
};

/**
 * Applies one decoded SSE payload to the accumulated stream pieces.
 * @param {StreamParts} parts The pieces accumulated so far
 * @param {Record<string, unknown>} payload One parsed `data:` line
 * @returns {StreamEventResult} Updated pieces, plus completion and failure signals
 */
const applyStreamEvent = (
  parts: StreamParts,
  payload: Record<string, unknown>,
): StreamEventResult => {
  if (payload.complete === true)
    return { parts, complete: true, failed: false };

  if (payload.error)
    return { parts, complete: false, failed: true };

  const event = payload.event as { type?: string; output_text?: string } | undefined;
  if (!event?.type)
    return { parts, complete: false, failed: false };

  switch (event.type) {
    case 'message':
      return { parts: { ...parts, message: formatSummaryText(event.output_text ?? '') }, complete: false, failed: false };
    case 'reasoning':
      return { parts: { ...parts, reasoning: formatSummaryText(event.output_text ?? '') }, complete: false, failed: false };
    case 'function_call_outputs':
      return { parts: { ...parts, functionCall: 'calling functions...' }, complete: false, failed: false };
    default:
      return { parts, complete: false, failed: false };
  }
};

/**
 * Consumes an SSE body, reporting each update as it is decoded.
 * @param {ReadableStreamDefaultReader<Uint8Array>} reader Reader over the response body
 * @param {(result: StreamEventResult) => void} onEvent Called once per decoded event
 * @returns {Promise<StreamParts>} The pieces accumulated by the time the stream ended
 */
const readSummaryStream = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (result: StreamEventResult) => void,
): Promise<StreamParts> => {
  const decoder = new TextDecoder('utf-8');
  let accumulated = EMPTY_PARTS;
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) return accumulated;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    // A chunk can end mid-line, so the remainder waits for the next read.
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;

      let applied: StreamEventResult;
      try {
        applied = applyStreamEvent(accumulated, JSON.parse(line.slice(6)));
      } catch (parseError) {
        console.warn('Failed to parse summary event:', line, parseError);
        continue;
      }

      accumulated = applied.parts;
      onEvent(applied);
      if (applied.complete) return accumulated;
    }
  }
};

/**
 * Opens the summary stream and hands back a reader over its body.
 * @param {string} body Serialized summary payload
 * @param {AbortSignal} signal Signal used to cancel the request
 * @returns {Promise<ReadableStreamDefaultReader<Uint8Array>>} Reader over the SSE body
 */
const openSummaryStream = async (
  body: string,
  signal: AbortSignal,
): Promise<ReadableStreamDefaultReader<Uint8Array>> => {
  const response = await createStreamingRequest(SUMMARY_ENDPOINT, body, signal);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  if (!response.body) throw new Error('No response body received');
  return response.body.getReader();
};

interface StreamingSummaryOptions {
  resultSet: ResultSet | null;
  result: Result;
  diseaseId: string;
  diseaseName: string;
  diseaseDescription: string;
}

/** Request state for the stream, grouped so a single update moves them together. */
interface StreamStatus {
  isLoading: boolean;
  isStreaming: boolean;
  isError: boolean;
}

const IDLE_STATUS: StreamStatus = { isLoading: false, isStreaming: false, isError: false };

interface StreamingSummary {
  summaryState: SummaryState;
  isLoading: boolean;
  isStreaming: boolean;
  isError: boolean;
  streamedText: string;
  fetchAndUpdateSummary: () => Promise<void>;
  clearAndRefetchSummary: () => Promise<void>;
  cancelStream: () => void;
}

/**
 * Streams an LLM summary for a single result, caching the finished summary in
 * localStorage so reopening the modal does not pay for the same answer twice.
 * @param {StreamingSummaryOptions} options The result and disease context to summarize
 * @returns {StreamingSummary} Stream state plus the controls the modal needs
 */
export const useStreamingSummaryState = ({
  resultSet,
  result,
  diseaseId,
  diseaseName,
  diseaseDescription,
}: StreamingSummaryOptions): StreamingSummary => {
  const storageKey = createStorageKey(result.id);

  const [parts, setParts] = useState<StreamParts>(EMPTY_PARTS);
  const [status, setStatus] = useState<StreamStatus>(IDLE_STATUS);
  const [summaryState, setSummaryState] = useState<SummaryState>(() => {
    const cached = localStorage.getItem(createStorageKey(result.id));
    return { content: cached, hasCached: !!cached };
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  const streamedText = useMemo(() => composeStreamHtml(parts), [parts]);

  const cancelStream = useCallback(() => {
    readerRef.current?.cancel().catch(() => { /* already closed */ });
    readerRef.current = null;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setStatus(IDLE_STATUS);
  }, []);

  const clearSummary = useCallback(() => {
    localStorage.removeItem(storageKey);
    setSummaryState({ content: null, hasCached: false });
    setParts(EMPTY_PARTS);
  }, [storageKey]);

  const fetchAndUpdateSummary = useCallback(async () => {
    if (!resultSet) return;

    cancelStream();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setParts(EMPTY_PARTS);
    setStatus({ isLoading: true, isStreaming: true, isError: false });

    try {
      const body = JSON.stringify(
        resultToSummarySpec(resultSet, result, diseaseId, diseaseName, diseaseDescription)
      );
      readerRef.current = await openSummaryStream(body, controller.signal);

      // The returned value is used rather than state: the summary has to be
      // persisted the moment the stream ends, before React has re-rendered.
      const accumulated = await readSummaryStream(readerRef.current, applied => {
        setParts(applied.parts);
        if (applied.failed) setStatus(prev => ({ ...prev, isError: true }));
      });

      if (accumulated.message) {
        const finalHtml = composeStreamHtml(accumulated);
        localStorage.setItem(storageKey, finalHtml);
        setSummaryState({ content: finalHtml, hasCached: true });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      logHTTPError(error, 'Result summary stream');
      setStatus(prev => ({ ...prev, isError: true }));
    } finally {
      readerRef.current = null;
      abortControllerRef.current = null;
      setStatus(prev => ({ ...prev, isLoading: false, isStreaming: false }));
    }
  }, [resultSet, result, diseaseId, diseaseName, diseaseDescription, storageKey, cancelStream]);

  const clearAndRefetchSummary = useCallback(async () => {
    clearSummary();
    await fetchAndUpdateSummary();
  }, [clearSummary, fetchAndUpdateSummary]);

  return {
    summaryState,
    isLoading: status.isLoading,
    isStreaming: status.isStreaming,
    isError: status.isError,
    streamedText,
    fetchAndUpdateSummary,
    clearAndRefetchSummary,
    cancelStream,
  };
};
