import { getDataFromQueryVar } from '@/features/Core/utils/urlHelpers';
import { useDecodedParams } from '@/features/Core/hooks/useDecodedParams';

const parseCanvasId = (value: string | null | undefined): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const useCanvasRouteParams = () => {
  const decodedParams = useDecodedParams();
  const canvasId = parseCanvasId(getDataFromQueryVar('canvas', decodedParams));
  const entityId = parseCanvasId(getDataFromQueryVar('entityId', decodedParams));
  const isCanvasMode = canvasId !== undefined && entityId !== undefined && entityId > 0;

  return { canvasId, entityId, isCanvasMode, decodedParams };
};

export default useCanvasRouteParams;
