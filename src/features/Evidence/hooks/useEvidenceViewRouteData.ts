import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getResultById, getPathById } from '@/features/ResultList/slices/resultsSlice';
import { getQueryStatusById } from '@/features/ResultList/slices/queryStatusSlice';
import { currentPrefs } from '@/features/UserAuth/slices/userSlice';
import useCanvasNodeNameLookup from '@/features/Canvas/hooks/useCanvasNodeNameLookup';
import { useCanvasEdgeEntity } from '@/features/Canvas/hooks/useCanvasEntityRoute';
import {
  parseCompressedEdgeSets,
  parseInitialTab,
  resolveEvidenceEdge,
  resolvePathKey,
  resolveSelectedEdgeGroup,
} from '@/features/Evidence/hooks/evidenceViewHelpers';

const useEvidenceViewRouteData = () => {
  const { resultId, edgeId, pathId } = useParams();
  const {
    canvasId,
    dataId,
    isCanvasOnlyMode,
    decodedParams,
    queryId,
    resultSet,
    seenStatusPk,
    query: canvasEdgeQuery,
    resultEdge: canvasEdge,
  } = useCanvasEdgeEntity();

  const prefs = useSelector(currentPrefs);
  const queryStatus = useSelector(getQueryStatusById(queryId));
  const nodeNameLookup = useCanvasNodeNameLookup(canvasId, isCanvasOnlyMode);

  const result = useMemo(
    () => (resultId ? getResultById(resultSet, resultId) : undefined),
    [resultSet, resultId],
  );
  const path = useMemo(() => {
    if (!resultSet || !pathId) return null;
    return getPathById(resultSet, pathId);
  }, [resultSet, pathId]);

  const decodedEdgeId = useMemo(
    () => (edgeId ? decodeURIComponent(edgeId) : undefined),
    [edgeId],
  );
  const compressedEdgeSets = useMemo(
    () => parseCompressedEdgeSets(decodedParams),
    [decodedParams],
  );
  const selectedEdgeGroup = useMemo(
    () => resolveSelectedEdgeGroup(decodedEdgeId, compressedEdgeSets),
    [decodedEdgeId, compressedEdgeSets],
  );
  const resolvedEdge = useMemo(() => {
    if (resultSet && decodedEdgeId) {
      return resolveEvidenceEdge(resultSet, path, decodedEdgeId, selectedEdgeGroup);
    }
    if (isCanvasOnlyMode) return canvasEdge;
    return null;
  }, [isCanvasOnlyMode, canvasEdge, resultSet, path, decodedEdgeId, selectedEdgeGroup]);
  const pathKey = useMemo(
    () => resolvePathKey(decodedParams, resultSet, result, pathId),
    [decodedParams, resultSet, result, pathId],
  );
  const initialTab = parseInitialTab(decodedParams);

  return {
    resultId,
    edgeId,
    pathId,
    decodedParams,
    queryId,
    prefs,
    resultSet,
    queryStatus,
    result,
    path,
    decodedEdgeId,
    compressedEdgeSets,
    selectedEdgeGroup,
    resolvedEdge,
    pathKey,
    initialTab,
    pk: seenStatusPk,
    canvasId,
    isCanvasOnlyMode,
    canvasEdgeLoading: canvasEdgeQuery.isLoading,
    canvasEdgeError: canvasEdgeQuery.isError,
    nodeNameLookup,
  };
};

export default useEvidenceViewRouteData;
