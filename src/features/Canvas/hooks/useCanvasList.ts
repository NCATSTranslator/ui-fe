import { useState, useRef, useEffect, useCallback, useMemo, FormEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import {
  selectCanvases,
  selectActiveCanvasId,
  setActiveCanvas,
  deleteCanvas,
  restoreCanvas,
  renameCanvas,
} from '@/features/Canvas/slices/canvasSlice';
import type { AppDispatch } from '@/redux/store';
import type { Canvas } from '@/features/Canvas/types/canvas';
import { useSimpleSearch } from '@/features/Core/hooks/simpleSearchHook';
import { filterCanvasesBySearch, sortCanvases, CanvasSortMode } from '@/features/Canvas/utils/canvasFunctions';
import { canvasDeleteErrorToast } from '@/features/Core/utils/toastMessages';
import { trashCanvases, updateCanvasMetadata } from '@/features/Canvas/utils/canvasApi';

interface UseCanvasListOptions {
  sortMode?: CanvasSortMode;
}

const useCanvasList = ({ sortMode = 'date' }: UseCanvasListOptions = {}) => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const canvases = useSelector(selectCanvases);
  const activeCanvasId = useSelector(selectActiveCanvasId);
  const { searchTerm, handleSearch } = useSimpleSearch();
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const canvasesRef = useRef(canvases);
  canvasesRef.current = canvases;

  useEffect(() => {
    if (renamingId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renamingId]);

  const handleSelectCanvas = useCallback((canvas: Canvas) => {
    if (renamingId) return;
    dispatch(setActiveCanvas(canvas.id));
  }, [dispatch, renamingId]);

  const handleStartRename = useCallback((canvas: Canvas) => {
    setRenamingId(canvas.id);
    setRenameValue(canvas.label);
  }, []);

  const handleSubmitRename = useCallback((e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    const currentLabel = canvases.find(c => c.id === renamingId)?.label;
    if (trimmed && trimmed !== currentLabel) {
      dispatch(renameCanvas({ id: renamingId, label: trimmed }));
      updateCanvasMetadata(renamingId, { label: trimmed }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['userCanvases'] });
      });
    }
    setRenamingId(null);
  }, [dispatch, queryClient, renamingId, renameValue, canvases]);

  const handleDeleteCanvas = useCallback((canvasId: number) => {
    const deletedCanvas = canvasesRef.current.find(c => c.id === canvasId);
    dispatch(deleteCanvas(canvasId));
    trashCanvases([canvasId])
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['userCanvases'] });
      })
      .catch(() => {
        canvasDeleteErrorToast();
        if (deletedCanvas) {
          dispatch(restoreCanvas(deletedCanvas));
        }
      });
  }, [dispatch, queryClient]);

  const sortedFilteredCanvases = useMemo(
    () => sortCanvases(filterCanvasesBySearch(canvases, searchTerm), sortMode),
    [canvases, searchTerm, sortMode]
  );

  return {
    canvases,
    sortedFilteredCanvases,
    activeCanvasId,
    searchTerm,
    handleSearch,
    renamingId,
    renameValue,
    renameInputRef,
    setRenameValue,
    handleSelectCanvas,
    handleStartRename,
    handleSubmitRename,
    handleDeleteCanvas,
  };
};

export default useCanvasList;
