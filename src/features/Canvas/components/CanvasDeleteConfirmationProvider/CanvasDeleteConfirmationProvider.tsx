import {
  FC,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { AppDispatch } from '@/redux/store';
import {
  selectCanvases,
  selectActiveCanvasId,
  selectPaneOpen,
  selectPaneMaximized,
  deleteCanvas,
  restoreCanvas,
  setActiveCanvas,
  toggleMaximizePane,
  togglePane,
} from '@/features/Canvas/slices/canvasSlice';
import type { BackendUserCanvas, Canvas } from '@/features/Canvas/types/canvas';
import { trashCanvases } from '@/features/Canvas/utils/canvasApi';
import { canvasDeleteErrorToast, canvasDeletedToast } from '@/features/Core/utils/toastMessages';
import CanvasDeleteWarningModal from '@/features/Canvas/components/CanvasDeleteWarningModal/CanvasDeleteWarningModal';

const USER_CANVASES_QUERY_KEY = ['userCanvases'] as const;

export interface CanvasDeleteConfirmationContextValue {
  canvasPendingDelete: ReturnType<typeof selectCanvases>[number] | null;
  isDeleteConfirmOpen: boolean;
  requestDeleteCanvas: (canvasId: number) => void;
  cancelDeleteCanvas: () => void;
  confirmDeleteCanvas: () => void;
}

export const CanvasDeleteConfirmationContext = createContext<
  CanvasDeleteConfirmationContextValue | undefined
>(undefined);

interface CanvasDeleteConfirmationProviderProps {
  children: ReactNode;
}

type DeleteRollbackState = {
  canvasId: number;
  deletedCanvas: Canvas | undefined;
  deletedMeta: BackendUserCanvas | undefined;
  wasActive: boolean;
  wasPaneOpen: boolean;
  wasPaneMaximized: boolean;
};

const useSyncedRef = <T,>(value: T) => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};

const restoreMetaInQueryCache = (
  queryClient: QueryClient,
  deletedMeta: BackendUserCanvas,
) => {
  queryClient.setQueryData<BackendUserCanvas[]>(
    USER_CANVASES_QUERY_KEY,
    old => {
      const current = old ?? [];
      if (current.some(canvas => canvas.id === deletedMeta.id)) return current;
      return [...current, deletedMeta];
    },
  );
};

const rollbackFailedDelete = (
  dispatch: AppDispatch,
  queryClient: QueryClient,
  state: DeleteRollbackState,
) => {
  canvasDeleteErrorToast();

  if (state.deletedMeta) {
    restoreMetaInQueryCache(queryClient, state.deletedMeta);
  }

  if (!state.deletedCanvas) return;

  dispatch(restoreCanvas(state.deletedCanvas));
  if (!state.wasActive) return;

  dispatch(setActiveCanvas(state.canvasId));
  if (!state.wasPaneOpen) {
    dispatch(togglePane());
  } else if (state.wasPaneMaximized) {
    dispatch(toggleMaximizePane());
  }
};

export const CanvasDeleteConfirmationProvider: FC<CanvasDeleteConfirmationProviderProps> = ({
  children,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const canvases = useSelector(selectCanvases);
  const activeCanvasId = useSelector(selectActiveCanvasId);
  const paneOpen = useSelector(selectPaneOpen);
  const paneMaximized = useSelector(selectPaneMaximized);
  const canvasesRef = useSyncedRef(canvases);
  const activeCanvasIdRef = useSyncedRef(activeCanvasId);
  const paneOpenRef = useSyncedRef(paneOpen);
  const paneMaximizedRef = useSyncedRef(paneMaximized);

  const [pendingDeleteCanvasId, setPendingDeleteCanvasId] = useState<number | null>(null);

  const canvasPendingDelete = pendingDeleteCanvasId === null
    ? null
    : canvases.find(canvas => canvas.id === pendingDeleteCanvasId) ?? null;

  const requestDeleteCanvas = useCallback((canvasId: number) => {
    setPendingDeleteCanvasId(canvasId);
  }, []);

  const cancelDeleteCanvas = useCallback(() => {
    setPendingDeleteCanvasId(null);
  }, []);

  const confirmDeleteCanvas = useCallback(() => {
    if (pendingDeleteCanvasId === null) return;

    const canvasId = pendingDeleteCanvasId;
    setPendingDeleteCanvasId(null);

    const previousCanvases = queryClient.getQueryData<BackendUserCanvas[]>(USER_CANVASES_QUERY_KEY);
    const rollbackState: DeleteRollbackState = {
      canvasId,
      deletedCanvas: canvasesRef.current.find(canvas => canvas.id === canvasId),
      deletedMeta: previousCanvases?.find(canvas => canvas.id === canvasId),
      wasActive: activeCanvasIdRef.current === canvasId,
      wasPaneOpen: paneOpenRef.current,
      wasPaneMaximized: paneMaximizedRef.current,
    };

    queryClient.setQueryData<BackendUserCanvas[]>(
      USER_CANVASES_QUERY_KEY,
      old => (old ?? []).filter(canvas => canvas.id !== canvasId),
    );

    dispatch(deleteCanvas(canvasId));
    trashCanvases([canvasId])
      .then(() => {
        queryClient.invalidateQueries({ queryKey: USER_CANVASES_QUERY_KEY });
        canvasDeletedToast();
      })
      .catch(() => rollbackFailedDelete(dispatch, queryClient, rollbackState));
  }, [activeCanvasIdRef, canvasesRef, dispatch, paneMaximizedRef, paneOpenRef, pendingDeleteCanvasId, queryClient]);

  const value = useMemo(
    () => ({
      canvasPendingDelete,
      isDeleteConfirmOpen: pendingDeleteCanvasId !== null,
      requestDeleteCanvas,
      cancelDeleteCanvas,
      confirmDeleteCanvas,
    }),
    [
      canvasPendingDelete,
      pendingDeleteCanvasId,
      requestDeleteCanvas,
      cancelDeleteCanvas,
      confirmDeleteCanvas,
    ],
  );

  return (
    <CanvasDeleteConfirmationContext.Provider value={value}>
      {children}
      <CanvasDeleteWarningModal
        isOpen={value.isDeleteConfirmOpen}
        canvasLabel={canvasPendingDelete?.label}
        onClose={cancelDeleteCanvas}
        onConfirm={confirmDeleteCanvas}
        onCancel={cancelDeleteCanvas}
      />
    </CanvasDeleteConfirmationContext.Provider>
  );
};

export const useCanvasDeleteConfirmation = (): CanvasDeleteConfirmationContextValue => {
  const context = useContext(CanvasDeleteConfirmationContext);
  if (!context) {
    throw new Error('useCanvasDeleteConfirmation must be used within CanvasDeleteConfirmationProvider');
  }
  return context;
};

export default CanvasDeleteConfirmationProvider;
