import { redirect } from 'react-router-dom';
import { decodeBase64Param, encodeParams } from '@/features/Common/utils/web';
import { getEdgeById, getPathById } from '@/features/ResultList/slices/resultsSlice';
import { Result, ResultEdge, ResultSet, Path } from '@/features/ResultList/types/results.d';
import { getCompressedEdge, intToChar, intToNumeral } from '@/features/Common/utils/utilities';

export const MAIN_CONTENT_ELEMENT_ID = 'main';

/**
 * Derives the display key for a path (e.g. "2", "1.a", "1.a.i") by searching
 * the result's top-level paths and then walking support chains recursively.
 * Matches the depth-based convention from SupportPathGroup:
 *   depth 0 → numeric (1, 2, 3)
 *   depth 1 → intToChar (a, b, c)
 *   depth 2 → intToNumeral (i, ii, iii)
 *   alternates for deeper levels
 */
export const derivePathKey = (
  resultSet: ResultSet | null | undefined,
  result: Result | undefined,
  pathId: string | undefined,
): string | null => {
  if (!resultSet || !result || !pathId) return null;

  const paths = result.paths;
  for (let i = 0; i < paths.length; i++) {
    const p = paths[i];
    const pId = typeof p === 'string' ? p : p.id;
    if (pId === pathId) return (i + 1).toString();
  }

  for (let i = 0; i < paths.length; i++) {
    const p = paths[i];
    const pId = typeof p === 'string' ? p : p.id;
    if (!pId) continue;
    const found = findInSupportChain(resultSet, pId, pathId, (i + 1).toString(), 1);
    if (found) return found;
  }

  return null;
};

const depthKeyFormatter = (depth: number, index: number): string => {
  return depth % 2 === 1 ? intToChar(index) : intToNumeral(index);
};

const findInSupportChain = (
  resultSet: ResultSet,
  parentPathId: string,
  targetPathId: string,
  parentKey: string,
  depth: number,
): string | null => {
  const parentPath = getPathById(resultSet, parentPathId);
  if (!parentPath) return null;

  for (let i = 1; i < parentPath.subgraph.length; i += 2) {
    const edgeId = parentPath.subgraph[i];
    const edge = getEdgeById(resultSet, edgeId);
    if (!edge || !edge.inferred) continue;

    const supportPaths = edge.support;
    if (!Array.isArray(supportPaths)) continue;

    for (let j = 0; j < supportPaths.length; j++) {
      const sp = supportPaths[j];
      const spId = typeof sp === 'string' ? sp : (sp as Path).id;
      if (!spId) continue;

      const childKey = depthKeyFormatter(depth, j + 1);
      const fullKey = `${parentKey}.${childKey}`;

      if (spId === targetPathId) return fullKey;

      const deeper = findInSupportChain(resultSet, spId, targetPathId, fullKey, depth + 1);
      if (deeper) return deeper;
    }
  }

  return null;
};


/**
 * Extracts all compressed edge groups from a path's compressedSubgraph (or subgraph).
 * Each group is an array of edge IDs that occupy the same compressed position.
 * Only groups with more than one edge are included.
 */
export const extractCompressedEdgeSets = (path: Path): string[][] => {
  const subgraph = path.compressedSubgraph ?? path.subgraph;
  const sets: string[][] = [];
  for (let i = 1; i < subgraph.length; i += 2) {
    const item = subgraph[i];
    if (Array.isArray(item) && item.length > 1) {
      sets.push(item as string[]);
    }
  }
  return sets;
};

interface EvidenceUrlOptions {
  resultId: string;
  pathId?: string;
  primaryEdgeId: string;
  compressedEdgeSets?: string[][];
  pathKey?: string;
  tab?: string;
}
/**
 * Builds the evidence URL and extraParams object for evidence navigation.
 *
 * The `ceids` query param is serialized as pipe-delimited groups of comma-delimited
 * edge IDs (e.g. `"id1,id2|id3,id4"`). Edge IDs are assumed to be alphanumeric,
 * so `|` and `,` are safe delimiters. URLSearchParams handles any necessary
 * percent-encoding of the delimiters in the query string.
 *
 * @param resultId - The result ID.
 * @param pathId - The path ID.
 * @param primaryEdgeId - The edge ID to display in the URL path (the actively selected edge).
 * @param compressedEdgeSets - All compressed edge groups in the path (passed via `ceids` query param).
 * @param pathKey - The path key.
 * @returns The evidence URL and extraParams object.
 */
export const buildEvidenceUrl = ({
  resultId,
  pathId,
  primaryEdgeId,
  compressedEdgeSets,
  pathKey,
  tab,
}: EvidenceUrlOptions): { path: string; params?: Record<string, string> } => {
  const encodedEdgeId = encodeURIComponent(primaryEdgeId);
  const path = pathId
    ? `/results/${resultId}/path/${pathId}/evidence/${encodedEdgeId}`
    : `/results/${resultId}/evidence/${encodedEdgeId}`;

  const params: Record<string, string> = {};
  if (pathKey) params.pkey = pathKey;
  if (tab) params.tab = tab;
  if (compressedEdgeSets && compressedEdgeSets.length > 0) {
    params.ceids = compressedEdgeSets
      .map(group => group.join(','))
      .join('|');
  }

  return {
    path,
    params: Object.keys(params).length > 0 ? params : undefined,
  };
};

/**
 * Resolves an edge from a path's subgraph data. If the path has a compressedSubgraph,
 * finds the compressed group containing the edgeId and merges them.
 * Falls back to a simple edge lookup.
 * @param resultSet - The result set.
 * @param path - The path.
 * @param edgeId - The edge ID.
 * @returns The edge.
 */
export const resolveEdgeFromPath = (
  resultSet: ResultSet,
  path: Path | null,
  edgeId: string,
): ResultEdge | null => {
  if (path?.compressedSubgraph) {
    for (let i = 1; i < path.compressedSubgraph.length; i += 2) {
      const item = path.compressedSubgraph[i];
      if (Array.isArray(item)) {
        if (item.includes(edgeId)) {
          return getCompressedEdge(resultSet, item);
        }
      } else if (item === edgeId) {
        return getEdgeById(resultSet, edgeId) ?? null;
      }
    }
  }

  return getEdgeById(resultSet, edgeId) ?? null;
};

/**
 * Legacy migration: extract `r=` from base64-encoded query segments.
 * Old shared links encoded params with btoa(), so `r=` may be buried
 * inside an opaque segment rather than visible as a plain query param.
 * Can be removed once all pre-navigation-overhaul shared links have expired.
 */
const extractResultIdFromEncodedParams = (url: URL): Response | null => {
  const raw = url.search.startsWith('?') ? url.search.slice(1) : url.search;
  if (!raw) return null;

  const segments = raw.split('&').filter(Boolean);
  let resultId: string | null = null;
  const kept: string[] = [];

  for (const segment of segments) {
    try {
      const decoded = decodeBase64Param(segment);
      const decodedParams = new URLSearchParams(decoded);
      if (decodedParams.has('r')) {
        resultId = decodedParams.get('r');
        decodedParams.delete('r');
        const remaining = decodedParams.toString();
        if (remaining) kept.push(encodeParams(remaining));
        continue;
      }
    } catch { /* not base64 */ }
    kept.push(segment);
  }

  if (resultId) return redirect(`/results/${resultId}?${kept.join('&')}`);
  return null;
};

/**
 * Route loader for /results — redirects legacy URLs that carry the result ID
 * as a query param (`r=`) to the new path-segment format (`/results/:resultId`).
 */
export const resultsLoader = ({ request }: { request: Request }) => {
  const url = new URL(request.url);

  // Current format: r= is a plain query param
  if (url.searchParams.has('r')) {
    const resultId = url.searchParams.get('r')!;
    url.searchParams.delete('r');
    return redirect(`/results/${resultId}?${url.searchParams.toString()}`);
  }

  // Legacy format: r= may be inside a base64-encoded segment
  return extractResultIdFromEncodedParams(url);
};
