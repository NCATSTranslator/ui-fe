import { getCanvasEntityLoadState } from '@/features/Canvas/utils/canvasEntityViewStatus';
import { getDataFromQueryVar } from '@/features/Core/utils/urlHelpers';
import { getCompressedSubgraph, getCompressedEdge } from '@/features/Core/utils/resultHelpers';
import {
  derivePathKey as derivePathKeyFromResult,
  resolveEdgeFromPath,
} from '@/features/Navigation/utils/navigationUtils';
import { isNodeIndex } from '@/features/ResultList/utils/resultsInteractionFunctions';
import { isValidEvidenceTabName } from '@/features/Evidence/types/checkers';
import { EvidenceTabName } from '@/features/Evidence/types/navigation';
import { useDecodedParams } from '@/features/Core/hooks/useDecodedParams';
import { ResultSet, ResultEdge, Path, Result } from '@/features/ResultList/types/results.d';
import type { CompressedSubgraph, EvidenceViewModel, EvidenceViewStatusParams } from '@/features/Evidence/hooks/evidenceViewTypes';

export type DecodedParams = ReturnType<typeof useDecodedParams>;

export const parseCompressedEdgeSets = (decodedParams: DecodedParams): string[][] => {
  const ceidsParam = getDataFromQueryVar('ceids', decodedParams);
  if (!ceidsParam) return [];
  return ceidsParam.split('|').map(group => group.split(','));
};

export const resolveSelectedEdgeGroup = (
  decodedEdgeId: string | undefined,
  compressedEdgeSets: string[][],
): string[] => {
  if (!decodedEdgeId) return [];
  const match = compressedEdgeSets.find(g => g.includes(decodedEdgeId));
  return match ?? [decodedEdgeId];
};

export const resolveEvidenceEdge = (
  resultSet: ResultSet | null | undefined,
  path: Path | null,
  decodedEdgeId: string | undefined,
  selectedEdgeGroup: string[],
): ResultEdge | null => {
  if (!resultSet || !decodedEdgeId) return null;
  if (selectedEdgeGroup.length > 1) {
    const ordered = [decodedEdgeId, ...selectedEdgeGroup.filter(id => id !== decodedEdgeId)];
    return getCompressedEdge(resultSet, ordered);
  }
  return resolveEdgeFromPath(resultSet, path, decodedEdgeId);
};

export const buildCompressedSubgraph = (
  path: Path | null,
  resultSet: ResultSet | null | undefined,
  compressedEdgeSets: string[][],
): CompressedSubgraph => {
  if (path?.compressedSubgraph && resultSet) {
    return getCompressedSubgraph(resultSet, path.compressedSubgraph);
  }
  if (path && resultSet && compressedEdgeSets.length > 0) {
    const compressedRaw: (string | string[])[] = path.subgraph.map((id, index) => {
      if (!isNodeIndex(index)) {
        const match = compressedEdgeSets.find(g => g.includes(id));
        if (match) return match;
      }
      return id;
    });
    return getCompressedSubgraph(resultSet, compressedRaw);
  }
  return false;
};

export const parseInitialTab = (decodedParams: DecodedParams): EvidenceTabName | undefined => {
  const rawTabParam = getDataFromQueryVar('tab', decodedParams);
  return isValidEvidenceTabName(rawTabParam ?? '') ? rawTabParam as EvidenceTabName : undefined;
};

export const resolveEvidenceSubtitle = (
  canvasId: number | undefined,
  pathKey: string,
): string | null => {
  if (canvasId !== undefined) return 'Canvas Evidence';
  if (pathKey) return `Path ${pathKey} Evidence`;
  return null;
};

export const computeNonReadyStatus = ({
  queryId,
  resultSet,
  queryStatus,
  result,
  selectedEdge,
  resolvedEdge,
  resultId,
  edgeId,
  isCanvasOnlyMode = false,
  canvasEdgeLoading = false,
  canvasEdgeError = false,
}: EvidenceViewStatusParams): Exclude<EvidenceViewModel, { status: 'ready' }> | null => {
  if (isCanvasOnlyMode) {
    const canvasLoadState = getCanvasEntityLoadState(
      true,
      canvasEdgeLoading,
      canvasEdgeError,
      !!resolvedEdge,
    );
    if (canvasLoadState === 'loading') return { status: 'loading' };
    if (canvasLoadState === 'error') return { status: 'no-edge', edgeId };
    if (!selectedEdge) return { status: 'loading' };
    return null;
  }
  if (!queryId) return { status: 'no-query' };
  if (!resultSet && (!queryStatus || queryStatus.isLoading)) return { status: 'loading' };
  if (!result) return { status: 'no-result', resultId };
  if (!selectedEdge) {
    if (!resolvedEdge) return { status: 'no-edge', edgeId };
    return { status: 'loading' };
  }
  return null;
};

export const resolvePathKey = (
  decodedParams: DecodedParams,
  resultSet: ResultSet | null | undefined,
  result: Result | undefined,
  pathId: string | undefined,
): string =>
  getDataFromQueryVar('pkey', decodedParams)
  ?? derivePathKeyFromResult(resultSet, result, pathId)
  ?? '';
