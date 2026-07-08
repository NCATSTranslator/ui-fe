import { useState, useRef, useEffect, useCallback, useMemo, FormEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectCanvases,
  selectActiveCanvasId,
  createCanvas,
  setActiveCanvas,
  deleteCanvas,
  renameCanvas,
} from '@/features/Canvas/slices/canvasSlice';
import type { AppDispatch } from '@/redux/store';
import type { Canvas } from '@/features/Canvas/types/canvas';
import { useSimpleSearch } from '@/features/Core/hooks/simpleSearchHook';
import { filterCanvasesBySearch, sortCanvases, CanvasSortMode } from '@/features/Canvas/utils/canvasFunctions';

/**
 * Shared state and handlers for listing, creating, selecting, deleting and
 * renaming canvases. Consumed by both the sidebar panel and the full-page list
 * so the CRUD + inline-rename behavior stays consistent between them.
 */
const useCanvasList = (sortMode: CanvasSortMode = 'date') => {
  const dispatch = useDispatch<AppDispatch>();
  const canvases = useSelector(selectCanvases);
  const activeCanvasId = useSelector(selectActiveCanvasId);
  const { searchTerm, handleSearch } = useSimpleSearch();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renamingId]);

  const handleCreateCanvas = useCallback(() => {
    dispatch(createCanvas());
  }, [dispatch]);

  const handleSelectCanvas = useCallback((canvas: Canvas) => {
    if (renamingId) return;
    dispatch(setActiveCanvas(canvas.id));
  }, [dispatch, renamingId]);

  const handleStartRename = useCallback((canvas: Canvas) => {
    setRenamingId(canvas.id);
    setRenameValue(canvas.title);
  }, []);

  const handleSubmitRename = useCallback((e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    const currentTitle = canvases.find(c => c.id === renamingId)?.title;
    if (trimmed && trimmed !== currentTitle) {
      dispatch(renameCanvas({ id: renamingId, title: trimmed }));
    }
    setRenamingId(null);
  }, [dispatch, renamingId, renameValue, canvases]);

  const handleDeleteCanvas = useCallback((canvasId: string) => {
    dispatch(deleteCanvas(canvasId));
  }, [dispatch]);

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
    handleCreateCanvas,
    handleSelectCanvas,
    handleStartRename,
    handleSubmitRename,
    handleDeleteCanvas,
  };
};

export default useCanvasList;
