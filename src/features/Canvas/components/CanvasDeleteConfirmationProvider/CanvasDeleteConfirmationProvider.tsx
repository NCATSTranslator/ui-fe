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
import { useQueryClient } from '@tanstack/react-query';
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
import type { BackendUserCanvas } from '@/features/Canvas/types/canvas';
import { trashCanvases } from '@/features/Canvas/utils/canvasApi';
import { canvasDeleteErrorToast, canvasDeletedToast } from '@/features/Core/utils/toastMessages';

const USER_CANVASES_QUERY_KEY = ['userCanvases'] as const;
import CanvasDeleteWarningModal from '@/features/Canvas/components/CanvasDeleteWarningModal/CanvasDeleteWarningModal';

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

export const CanvasDeleteConfirmationProvider: FC<CanvasDeleteConfirmationProviderProps> = ({
  children,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const canvases = useSelector(selectCanvases);
  const activeCanvasId = useSelector(selectActiveCanvasId);
  const paneOpen = useSelector(selectPaneOpen);
  const paneMaximized = useSelector(selectPaneMaximized);

  const canvasesRef = useRef(canvases);
  canvasesRef.current = canvases;
  const activeCanvasIdRef = useRef(activeCanvasId);
  activeCanvasIdRef.current = activeCanvasId;
  const paneOpenRef = useRef(paneOpen);
  paneOpenRef.current = paneOpen;
  const paneMaximizedRef = useRef(paneMaximized);
  paneMaximizedRef.current = paneMaximized;

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

    const deletedCanvas = canvasesRef.current.find(canvas => canvas.id === canvasId);
    const wasActive = activeCanvasIdRef.current === canvasId;
    const wasPaneOpen = paneOpenRef.current;
    const wasPaneMaximized = paneMaximizedRef.current;

    const previousCanvases = queryClient.getQueryData<BackendUserCanvas[]>(USER_CANVASES_QUERY_KEY);
    const deletedMeta = previousCanvases?.find(canvas => canvas.id === canvasId);

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
      .catch(() => {
        canvasDeleteErrorToast();

        if (deletedMeta) {
          queryClient.setQueryData<BackendUserCanvas[]>(
            USER_CANVASES_QUERY_KEY,
            old => {
              const current = old ?? [];
              return current.some(canvas => canvas.id === deletedMeta.id)
                ? current
                : [...current, deletedMeta];
            },
          );
        }

        if (!deletedCanvas) return;

        dispatch(restoreCanvas(deletedCanvas));
        if (wasActive) {
          dispatch(setActiveCanvas(canvasId));
          if (!wasPaneOpen) {
            dispatch(togglePane());
          } else if (wasPaneMaximized) {
            dispatch(toggleMaximizePane());
          }
        }
      });
  }, [dispatch, pendingDeleteCanvasId, queryClient]);

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
