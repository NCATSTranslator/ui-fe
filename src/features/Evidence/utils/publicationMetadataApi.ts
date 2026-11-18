import { isObject } from '@/features/Core/types/checkers';
import type { PubmedMetadataMap } from '@/features/Evidence/types/evidence';

// Used when the backend config has not loaded or predates the `publication_metadata` entry.
export const PUBLICATION_METADATA_FALLBACK_ENDPOINT = 'https://annotator.transltr.io/publications';

export interface PublicationMetadataResult {
  success: boolean;
  data?: PubmedMetadataMap;
  error?: string;
  processedCount: number;
}

/**
 * Builds the request URL for a batch of publication ids against the annotator publications endpoint.
 * Ids are percent-encoded individually so one containing `&`, `#` or `+` cannot corrupt the batch.
 *
 * @param {string} endpoint - Full URL of the publications endpoint.
 * @param {string[]} ids - Publication CURIEs (e.g. PMID:123, PMC:PMC123).
 * @returns {string} The request URL.
 */
export const buildPublicationMetadataUrl = (endpoint: string, ids: string[]): string =>
  `${endpoint}?pubids=${ids.map(encodeURIComponent).join(',')}`;

/**
 * Fetches metadata for a batch of publications. Never throws: failures (HTTP errors, network
 * errors, aborts, malformed bodies) come back as an unsuccessful result so one bad batch does not
 * stop the others. Ids the service does not know are simply absent from the returned map.
 *
 * @param {string} endpoint - Full URL of the publications endpoint.
 * @param {string[]} ids - Publication CURIEs to look up.
 * @param {AbortSignal} signal - Signal used to cancel the request.
 * @returns {Promise<PublicationMetadataResult>} The metadata keyed by publication id, or the failure.
 */
export const fetchPublicationMetadata = async (
  endpoint: string,
  ids: string[],
  signal?: AbortSignal,
): Promise<PublicationMetadataResult> => {
  try {
    const res = await fetch(buildPublicationMetadataUrl(endpoint, ids), { signal });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const body: unknown = await res.json();
    const results = isObject(body) ? body.results : undefined;
    const data = isObject(results) ? results as PubmedMetadataMap : {};

    return { success: true, data, processedCount: Object.keys(data).length };
  } catch (error) {
    // Checked by name: not every runtime's DOMException is an Error instance.
    if ((error as { name?: unknown } | null)?.name === 'AbortError') {
      console.warn('Fetch aborted for chunk:', ids, 'error:', error);
      return { success: false, error: 'aborted', processedCount: 0 };
    }

    console.warn('Error fetching publication metadata for chunk:', ids, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processedCount: 0,
    };
  }
};
