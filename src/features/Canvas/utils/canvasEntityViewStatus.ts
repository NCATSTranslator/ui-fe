export type CanvasEntityLoadState = 'idle' | 'loading' | 'error' | 'ready';

export const getCanvasEntityLoadState = (
  isCanvasOnlyMode: boolean,
  isLoading: boolean,
  isError: boolean,
  hasEntity: boolean,
): CanvasEntityLoadState => {
  if (!isCanvasOnlyMode) return 'idle';
  if (isLoading) return 'loading';
  if (isError || !hasEntity) return 'error';
  return 'ready';
};
