import { useCallback } from 'react';
import { useResultListContext } from '@/features/ResultList/context/ResultListContext';
import { useLastViewedPath } from '@/features/ResultItem/hooks/resultHooks';
import type { Path } from '@/features/ResultList/types/results.d';

interface OpenPathEvidenceOptions {
  path: Path;
  /** 1-based position of the path among all of its result's paths, when known. */
  pathNumber?: number;
  /** The result the path belongs to; falls back to the result in the route. */
  resultId?: string;
}

/**
 * Opens a path's evidence view on the path's first edge and records the path as last viewed.
 *
 * @returns A function that reports whether it navigated, so callers only track an opening that happened.
 */
export const useOpenPathEvidence = () => {
  const { setLastViewedPathID } = useLastViewedPath();
  const { navigateToEvidenceView } = useResultListContext();

  return useCallback(({ path, pathNumber, resultId }: OpenPathEvidenceOptions): boolean => {
    if (!path.id) return false;
    setLastViewedPathID(path.id);
    // subgraph alternates node/edge, so index 1 is the path's first edge.
    const firstEdgeId = path.subgraph[1];
    if (!firstEdgeId) return false;

    navigateToEvidenceView({
      edgeId: firstEdgeId,
      path,
      pathKey: pathNumber?.toString() ?? '-',
      resultId,
    });
    return true;
  }, [setLastViewedPathID, navigateToEvidenceView]);
};
