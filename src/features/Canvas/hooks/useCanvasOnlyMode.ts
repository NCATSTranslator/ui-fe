import { useSelector } from 'react-redux';
import { getDataFromQueryVar } from '@/features/Core/utils/urlHelpers';
import { getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import useCanvasRouteParams from '@/features/Canvas/hooks/useCanvasRouteParams';

const useCanvasOnlyMode = () => {
  const { canvasId, entityId, isCanvasMode, decodedParams } = useCanvasRouteParams();
  const queryId = getDataFromQueryVar('q', decodedParams);
  const resultSet = useSelector(getResultSetById(queryId));
  const isCanvasOnlyMode = isCanvasMode && !resultSet;
  const seenStatusPk = isCanvasOnlyMode && canvasId !== undefined
    ? `canvas:${canvasId}`
    : (queryId || '');

  return {
    canvasId,
    entityId,
    isCanvasMode,
    isCanvasOnlyMode,
    decodedParams,
    queryId,
    resultSet,
    seenStatusPk,
  };
};

export default useCanvasOnlyMode;
