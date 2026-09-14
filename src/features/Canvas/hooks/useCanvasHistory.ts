import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/redux/store';
import { replaceCanvas } from '@/features/Canvas/slices/canvasSlice';
import type { Canvas } from '@/features/Canvas/types/canvas';
import {
  persistCanvasHistoryTransition,
  type CanvasHistoryPersistence,
} from '@/features/Canvas/utils/canvasHistoryUtils';
import type { HistoryAction } from '@/features/Analytics/types/analytics';
import { trackEvent } from '@/features/Analytics/utils/dataLayer';

const MAX_UNDO_DEPTH = 20;

type HistoryStacks = Record<string, Canvas[]>;

const useCanvasHistory = (
  activeCanvas: Canvas | null,
  persistence: CanvasHistoryPersistence = {},
) => {
  const dispatch = useDispatch<AppDispatch>();
  const undoStacksRef = useRef<HistoryStacks>({});
  const redoStacksRef = useRef<HistoryStacks>({});
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

  /*
   * Undo and redo are the same move in opposite directions: pop the latest snapshot off one stack,
   * push the current canvas onto the other, apply the snapshot, and persist the transition.
   */
  const applyHistoryStep = useCallback((
    fromStacksRef: RefObject<HistoryStacks>,
    toStacksRef: RefObject<HistoryStacks>,
    action: HistoryAction,
  ) => {
    if (!activeCanvas) return;
    dropStacksIfSynced(activeCanvas);
    const key = String(activeCanvas.id);
    const stack = fromStacksRef.current[key];
    if (!stack || stack.length === 0) return;
    trackEvent('canvas_history_action', { history_action: action });
    const snapshot = stack[stack.length - 1];
    const current = structuredClone(activeCanvas);
    fromStacksRef.current[key] = stack.slice(0, -1);
    const toStack = toStacksRef.current[key] ?? [];
    toStacksRef.current[key] = [...toStack.slice(-(MAX_UNDO_DEPTH - 1)), current];
    dispatch(replaceCanvas(snapshot));
    forceUpdate(r => r + 1);
    const persistence = persistenceRef.current;
    persistence.invalidatePendingGraphApplies?.();
    persistence.clearPendingGeometry?.();
    persistence.clearPendingAnnotationText?.();
    void persistCanvasHistoryTransition(current, snapshot, persistence);
  }, [activeCanvas, dispatch, dropStacksIfSynced]);

  const undo = useCallback(() => applyHistoryStep(undoStacksRef, redoStacksRef, 'undo'), [applyHistoryStep]);
  const redo = useCallback(() => applyHistoryStep(redoStacksRef, undoStacksRef, 'redo'), [applyHistoryStep]);

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
