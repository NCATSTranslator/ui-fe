import { useCallback, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/redux/store';
import { replaceCanvas } from '@/features/Canvas/slices/canvasSlice';
import type { Canvas } from '@/features/Canvas/types/canvas';

const MAX_UNDO_DEPTH = 20;

const useCanvasHistory = (activeCanvas: Canvas | null) => {
  const dispatch = useDispatch<AppDispatch>();
  const undoStacksRef = useRef<Record<string, Canvas[]>>({});
  const redoStacksRef = useRef<Record<string, Canvas[]>>({});
  const [, forceUpdate] = useState(0);

  const pushUndo = useCallback(() => {
    if (!activeCanvas) return;
    const key = String(activeCanvas.id);
    const snapshot = structuredClone(activeCanvas);
    const stack = undoStacksRef.current[key] ?? [];
    undoStacksRef.current[key] = [...stack.slice(-(MAX_UNDO_DEPTH - 1)), snapshot];
    if (redoStacksRef.current[key]?.length) {
      redoStacksRef.current[key] = [];
    }
  }, [activeCanvas]);

  const undo = useCallback(() => {
    if (!activeCanvas) return;
    const key = String(activeCanvas.id);
    const stack = undoStacksRef.current[key];
    if (!stack || stack.length === 0) return;
    const snapshot = stack[stack.length - 1];
    const current = structuredClone(activeCanvas);
    undoStacksRef.current[key] = stack.slice(0, -1);
    const redoStack = redoStacksRef.current[key] ?? [];
    redoStacksRef.current[key] = [...redoStack.slice(-(MAX_UNDO_DEPTH - 1)), current];
    dispatch(replaceCanvas(snapshot));
    forceUpdate(r => r + 1);
  }, [activeCanvas, dispatch]);

  const redo = useCallback(() => {
    if (!activeCanvas) return;
    const key = String(activeCanvas.id);
    const stack = redoStacksRef.current[key];
    if (!stack || stack.length === 0) return;
    const snapshot = stack[stack.length - 1];
    const current = structuredClone(activeCanvas);
    redoStacksRef.current[key] = stack.slice(0, -1);
    const undoStack = undoStacksRef.current[key] ?? [];
    undoStacksRef.current[key] = [...undoStack.slice(-(MAX_UNDO_DEPTH - 1)), current];
    dispatch(replaceCanvas(snapshot));
    forceUpdate(r => r + 1);
  }, [activeCanvas, dispatch]);

  const canUndo = !!activeCanvas && (undoStacksRef.current[String(activeCanvas.id)]?.length ?? 0) > 0;
  const canRedo = !!activeCanvas && (redoStacksRef.current[String(activeCanvas.id)]?.length ?? 0) > 0;

  return { pushUndo, undo, redo, canUndo, canRedo };
};

export default useCanvasHistory;
