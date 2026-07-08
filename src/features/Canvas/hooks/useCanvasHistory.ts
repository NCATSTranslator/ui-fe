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
    const id = activeCanvas.id;
    const snapshot = structuredClone(activeCanvas);
    const stack = undoStacksRef.current[id] ?? [];
    undoStacksRef.current[id] = [...stack.slice(-(MAX_UNDO_DEPTH - 1)), snapshot];
    if (redoStacksRef.current[id]?.length) {
      redoStacksRef.current[id] = [];
    }
  }, [activeCanvas]);

  const undo = useCallback(() => {
    if (!activeCanvas) return;
    const id = activeCanvas.id;
    const stack = undoStacksRef.current[id];
    if (!stack || stack.length === 0) return;
    const snapshot = stack[stack.length - 1];
    const current = structuredClone(activeCanvas);
    undoStacksRef.current[id] = stack.slice(0, -1);
    const redoStack = redoStacksRef.current[id] ?? [];
    redoStacksRef.current[id] = [...redoStack.slice(-(MAX_UNDO_DEPTH - 1)), current];
    dispatch(replaceCanvas(snapshot));
    forceUpdate(r => r + 1);
  }, [activeCanvas, dispatch]);

  const redo = useCallback(() => {
    if (!activeCanvas) return;
    const id = activeCanvas.id;
    const stack = redoStacksRef.current[id];
    if (!stack || stack.length === 0) return;
    const snapshot = stack[stack.length - 1];
    const current = structuredClone(activeCanvas);
    redoStacksRef.current[id] = stack.slice(0, -1);
    const undoStack = undoStacksRef.current[id] ?? [];
    undoStacksRef.current[id] = [...undoStack.slice(-(MAX_UNDO_DEPTH - 1)), current];
    dispatch(replaceCanvas(snapshot));
    forceUpdate(r => r + 1);
  }, [activeCanvas, dispatch]);

  const canUndo = !!activeCanvas && (undoStacksRef.current[activeCanvas.id]?.length ?? 0) > 0;
  const canRedo = !!activeCanvas && (redoStacksRef.current[activeCanvas.id]?.length ?? 0) > 0;

  return { pushUndo, undo, redo, canUndo, canRedo };
};

export default useCanvasHistory;
