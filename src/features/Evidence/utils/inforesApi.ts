import { fetchWithErrorHandling } from '@/features/Core/utils/web';
import { API_PATH_PREFIX } from '@/features/UserAuth/utils/userApi';
import type { ProvenanceCatalogEntry } from '@/features/Evidence/types/evidence';
import { isProvenanceCatalogEntry } from '@/features/Evidence/types/checkers';
import type { ResultEdge } from '@/features/ResultList/types/results.d';
import { LOOKUP_SETTLE_TIMEOUT_MS } from '@/features/Core/utils/lookupTimeout';

// An infores missing from the catalog 404s and callers fall back to the raw infores id, so a failed
// lookup is logged rather than surfaced as an error toast.
const warnOnLookupError = (error: Error): void => {
  console.warn('Infores catalog lookup failed:', error.message);
};

/**
 * Collects the distinct infores ids an edge's evidence refers to: its provenance sources and the
 * source of each publication.
 */
export const getEdgeInforesIds = (edge: ResultEdge | null): string[] => {
  if (!edge) return [];
  const ids = new Set<string>();
  for (const source of edge.provenance) ids.add(source.infores);
  for (const pubEntries of Object.values(edge.publications)) {
    if (!Array.isArray(pubEntries)) continue;
    for (const pubEntry of pubEntries) {
      if (pubEntry.infores) ids.add(pubEntry.infores);
    }
  }
  return [...ids].sort();
};

export const getInforesCatalogEntry = async (infores: string): Promise<ProvenanceCatalogEntry> =>
  fetchWithErrorHandling<ProvenanceCatalogEntry>(
    () => fetch(
      `${API_PATH_PREFIX}/biolink/infores/${encodeURIComponent(infores)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(LOOKUP_SETTLE_TIMEOUT_MS),
      },
    ),
    warnOnLookupError,
    warnOnLookupError,
    isProvenanceCatalogEntry,
  );
