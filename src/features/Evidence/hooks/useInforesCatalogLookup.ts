import { getInforesCatalogEntry, getEdgeInforesIds } from '@/features/Evidence/utils/inforesApi';
import type { ProvenanceCatalogEntry } from '@/features/Evidence/types/evidence';
import type { ResultEdge } from '@/features/ResultList/types/results.d';
import { useCallback, useMemo, useRef } from 'react';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { reuseRecordIfEqual } from '@/features/Core/utils/recordHelpers';
import useSettleTimeout from '@/features/Core/hooks/useSettleTimeout';

export const inforesCatalogEntryQueryKey = (infores: string) =>
  ['inforesCatalogEntry', infores] as const;

export interface InforesCatalogLookup {
  catalog: Record<string, ProvenanceCatalogEntry>;
  // True once every lookup has resolved, failed, or timed out; a failed/timed-out id is left out.
  isSettled: boolean;
}

/**
 * Fetches the infores catalog entry for each source an edge's evidence refers to. The catalog only
 * changes with a server deploy, so entries are never considered stale and are shared across edges.
 */
const useInforesCatalogLookup = (edge: ResultEdge | null, enabled: boolean): InforesCatalogLookup => {
  const inforesIds = useMemo(() => (enabled ? getEdgeInforesIds(edge) : []), [edge, enabled]);
  const catalogRef = useRef<Record<string, ProvenanceCatalogEntry>>({});

  const combine = useCallback((results: UseQueryResult<ProvenanceCatalogEntry>[]) => {
    const next: Record<string, ProvenanceCatalogEntry> = {};
    results.forEach((result, i) => {
      if (result.data) next[inforesIds[i]] = result.data;
    });
    catalogRef.current = reuseRecordIfEqual(catalogRef.current, next);
    return {
      catalog: catalogRef.current,
      queriesSettled: results.every(result => !result.isPending),
    };
  }, [inforesIds]);

  const { catalog, queriesSettled } = useQueries({
    queries: inforesIds.map(infores => ({
      queryKey: inforesCatalogEntryQueryKey(infores),
      queryFn: () => getInforesCatalogEntry(infores),
      staleTime: Infinity,
      retry: false,
    })),
    combine,
  });

  const timedOut = useSettleTimeout(enabled && !queriesSettled);

  return { catalog, isSettled: !enabled || queriesSettled || timedOut };
};

export default useInforesCatalogLookup;
