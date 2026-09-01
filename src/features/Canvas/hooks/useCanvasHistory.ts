import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/redux/store';
import { replaceCanvas } from '@/features/Canvas/slices/canvasSlice';
import type { Canvas } from '@/features/Canvas/types/canvas';
import {
  persistCanvasHistoryTransition,
  type CanvasHistoryPersistence,
} from '@/features/Canvas/utils/canvasHistoryUtils';

const MAX_UNDO_DEPTH = 20;

const useCanvasHistory = (
  activeCanvas: Canvas | null,
  persistence: CanvasHistoryPersistence = {},
) => {
  const dispatch = useDispatch<AppDispatch>();
  const undoStacksRef = useRef<Record<string, Canvas[]>>({});
  const redoStacksRef = useRef<Record<string, Canvas[]>>({});
  /* The canvas's syncGeneration when its stacks were last written, so a sync that replaced the
   * canvas underneath them can be detected. */
  const stackGenerationsRef = useRef<Record<string, number>>({});
  const persistenceRef = useRef(persistence);
  persistenceRef.current = persistence;
  const [, forceUpdate] = useState(0);

  /*
   * Snapshots taken before a sync describe a graph the server has since replaced. Replaying one
   * would resurrect elements another tab deleted, so the stacks are dropped when the canvas's
   * syncGeneration moves. Checked lazily as well as in the effect below, because the effect only
   * watches the active canvas while the stacks are kept for every canvas the user has touched.
   */
  const dropStacksIfSynced = useCallback((canvas: Canvas) => {
    const key = String(canvas.id);
    const generation = canvas.syncGeneration ?? 0;
    const recorded = stackGenerationsRef.current[key];
    stackGenerationsRef.current[key] = generation;
    if (recorded === undefined || recorded === generation) return false;
    const hadHistory = !!undoStacksRef.current[key]?.length || !!redoStacksRef.current[key]?.length;
    delete undoStacksRef.current[key];
    delete redoStacksRef.current[key];
    return hadHistory;
  }, []);

  useEffect(() => {
    if (!activeCanvas) return;
    if (dropStacksIfSynced(activeCanvas)) forceUpdate(r => r + 1);
  }, [activeCanvas, dropStacksIfSynced]);

  const pushUndo = useCallback(() => {
    if (!activeCanvas) return;
    dropStacksIfSynced(activeCanvas);
    const key = String(activeCanvas.id);
    const snapshot = structuredClone(activeCanvas);
    const stack = undoStacksRef.current[key] ?? [];
    undoStacksRef.current[key] = [...stack.slice(-(MAX_UNDO_DEPTH - 1)), snapshot];
    if (redoStacksRef.current[key]?.length) {
      redoStacksRef.current[key] = [];
    }
    forceUpdate(r => r + 1);
  }, [activeCanvas, dropStacksIfSynced]);

  const undo = useCallback(() => {
    if (!activeCanvas) return;
    dropStacksIfSynced(activeCanvas);
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
    const persistence = persistenceRef.current;
    persistence.invalidatePendingGraphApplies?.();
    persistence.clearPendingGeometry?.();
    persistence.clearPendingAnnotationText?.();
    void persistCanvasHistoryTransition(current, snapshot, persistence);
  }, [activeCanvas, dispatch, dropStacksIfSynced]);

  const redo = useCallback(() => {
    if (!activeCanvas) return;
    dropStacksIfSynced(activeCanvas);
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
    const persistence = persistenceRef.current;
    persistence.invalidatePendingGraphApplies?.();
    persistence.clearPendingGeometry?.();
    persistence.clearPendingAnnotationText?.();
    void persistCanvasHistoryTransition(current, snapshot, persistence);
  }, [activeCanvas, dispatch, dropStacksIfSynced]);

  /*
   * Read stack refs during render rather than mirroring their lengths in state. That is safe here
   * because every path that mutates a stack also calls forceUpdate; if a future change adds a stack
   * mutation without that call, canUndo/canRedo could drift until the next render trigger.
   */
  const canUndo = !!activeCanvas && (undoStacksRef.current[String(activeCanvas.id)]?.length ?? 0) > 0;
  const canRedo = !!activeCanvas && (redoStacksRef.current[String(activeCanvas.id)]?.length ?? 0) > 0;

  return { pushUndo, undo, redo, canUndo, canRedo };
};

export default useCanvasHistory;
