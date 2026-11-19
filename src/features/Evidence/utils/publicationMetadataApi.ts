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

const PMC_ID_PATTERN = /^PMC:?(?:PMC)?(\d+)$/i;
// DOIs are sent unencoded, so ones holding a query delimiter are excluded rather than risk the batch.
const SUPPORTED_CURIE_PATTERN = /^(?:PMID:\d+|PMC:PMC\d+|doi:10\.[^\s,&#]+)$/i;

/**
 * Converts a publication id into the CURIE form the publications endpoint accepts. PMC ids arrive
 * as `PMC123` (or `PMC:123`) but the endpoint only recognizes `PMC:PMC123`, and rejects the whole
 * batch with a 400 when any id is malformed. Other ids (e.g. `PMID:123`) are returned unchanged.
 *
 * @param {string} id - Publication id as it appears on the publication object.
 * @returns {string} The id in the form the endpoint expects.
 */
export const toPublicationCurie = (id: string): string => {
  const trimmed = id.trim();
  const pmcMatch = trimmed.match(PMC_ID_PATTERN);
  return pmcMatch ? `PMC:PMC${pmcMatch[1]}` : trimmed;
};

/**
 * Whether the publications endpoint can look an id up. It only supports PMID, PMC and DOI CURIEs
 * and answers 400 for the whole batch if any other id (e.g. a clinical trial) is included.
 *
 * @param {string} id - Publication id as it appears on the publication object.
 * @returns {boolean} True if the id, once normalized, is one the endpoint accepts.
 */
export const isSupportedPublicationId = (id: string): boolean =>
  SUPPORTED_CURIE_PATTERN.test(toPublicationCurie(id));

/**
 * Builds the request URL for a batch of publication ids against the annotator publications endpoint.
 * Ids are normalized to the endpoint's CURIE form and otherwise sent as-is: the endpoint expects
 * literal colons in the CURIEs, not percent-encoded ones.
 *
 * @param {string} endpoint - Full URL of the publications endpoint.
 * @param {string[]} ids - Publication ids (e.g. PMID:123, PMC123, PMC:PMC123).
 * @returns {string} The request URL.
 */
export const buildPublicationMetadataUrl = (endpoint: string, ids: string[]): string =>
  `${endpoint}?pubids=${ids.map(toPublicationCurie).join(',')}`;

/**
 * Re-keys the endpoint's results, which come back under the normalized CURIEs, by the ids the
 * caller asked for so they can be looked up with the publication's own id.
 *
 * @param {PubmedMetadataMap} results - Metadata keyed by the endpoint's CURIEs.
 * @param {string[]} ids - The ids originally requested.
 * @returns {PubmedMetadataMap} Metadata keyed by the requested ids.
 */
const keyByRequestedIds = (results: PubmedMetadataMap, ids: string[]): PubmedMetadataMap => {
  const data: PubmedMetadataMap = {};
  for (const id of ids) {
    const metadata = results[toPublicationCurie(id)];
    if (metadata) data[id] = metadata;
  }
  return data;
};

/**
 * Fetches metadata for a batch of publications. Never throws: failures (HTTP errors, network
 * errors, aborts, malformed bodies) come back as an unsuccessful result so one bad batch does not
 * stop the others. Ids the service does not know or does not support are simply absent from the
 * returned map, which is keyed by the ids as passed in rather than by the normalized CURIEs sent
 * to the endpoint. Unsupported ids are never sent; if none are supported no request is made.
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
  const supportedIds = ids.filter(isSupportedPublicationId);
  if (supportedIds.length === 0) {
    return { success: true, data: {}, processedCount: 0 };
  }

  try {
    const res = await fetch(buildPublicationMetadataUrl(endpoint, supportedIds), { signal });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const body: unknown = await res.json();
    const results = isObject(body) ? body.results : undefined;
    const data = isObject(results) ? keyByRequestedIds(results as PubmedMetadataMap, supportedIds) : {};

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
