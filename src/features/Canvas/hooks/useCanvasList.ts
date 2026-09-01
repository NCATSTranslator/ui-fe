import { useState, useRef, useEffect, useCallback, useMemo, FormEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import {
  selectCanvases,
  selectActiveCanvasId,
  setActiveCanvas,
  renameCanvas,
} from '@/features/Canvas/slices/canvasSlice';
import type { AppDispatch } from '@/redux/store';
import type { Canvas } from '@/features/Canvas/types/canvas';
import { useSimpleSearch } from '@/features/Core/hooks/simpleSearchHook';
import { filterCanvasesBySearch, sortCanvases, CanvasSortMode } from '@/features/Canvas/utils/canvasFunctions';
import { updateCanvasMetadata } from '@/features/Canvas/utils/canvasApi';
import { trackCanvasWrite } from '@/features/Canvas/utils/canvasSyncUtils';
import { useCanvasDeleteConfirmation } from '@/features/Canvas/hooks/useCanvasDeleteConfirmation';

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
  const { requestDeleteCanvas } = useCanvasDeleteConfirmation();

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
      trackCanvasWrite([renamingId], () =>
        updateCanvasMetadata(renamingId, { label: trimmed }),
      ).then(() => {
        queryClient.invalidateQueries({ queryKey: ['userCanvases'] });
      });
    }
    setRenamingId(null);
  }, [dispatch, queryClient, renamingId, renameValue, canvases]);

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
    handleDeleteCanvas: requestDeleteCanvas,
  };
};

export default useCanvasList;
