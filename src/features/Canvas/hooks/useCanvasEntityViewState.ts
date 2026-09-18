import { useMemo } from 'react';
import { getCanvasEntityLoadState, type CanvasEntityLoadState } from '@/features/Canvas/utils/canvasEntityViewStatus';

interface UseCanvasEntityViewStateOptions {
  isCanvasOnlyMode: boolean;
  isLoading: boolean;
  isError: boolean;
  hasEntity: boolean;
}

const useCanvasEntityViewState = ({
  isCanvasOnlyMode,
  isLoading,
  isError,
  hasEntity,
}: UseCanvasEntityViewStateOptions) => {
  const loadState = useMemo(
    (): CanvasEntityLoadState => getCanvasEntityLoadState(isCanvasOnlyMode, isLoading, isError, hasEntity),
    [isCanvasOnlyMode, isLoading, isError, hasEntity],
  );

  return {
    loadState,
    showCanvasSkeleton: loadState === 'loading',
    showCanvasNotFound: loadState === 'error',
    isCanvasEntityReady: loadState === 'ready',
  };
};

export default useCanvasEntityViewState;
