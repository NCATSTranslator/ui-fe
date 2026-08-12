import type {
  Canvas,
  CanvasAnnotation,
  CanvasLayout,
  GraphGeometry,
  GraphSelection,
  SaveGeometryOptions,
} from '@/features/Canvas/types/canvas';

export type CanvasHistoryAnnotationText = {
  id: number;
  content: string;
};

export type CanvasHistoryDiff = {
  restore: GraphSelection;
  trash: GraphSelection;
  geometry: GraphGeometry | null;
  layout: CanvasLayout | null;
  annotationTexts: CanvasHistoryAnnotationText[];
};

export type CanvasHistoryPersistence = {
  saveRestoreElements?: (canvasId: number, selection: GraphSelection) => Promise<void>;
  saveTrashElements?: (canvasId: number, selection: GraphSelection) => Promise<void>;
  saveGeometry?: (
    canvasId: number,
    geometry: GraphGeometry,
    options?: SaveGeometryOptions,
  ) => Promise<void>;
  saveLayout?: (canvasId: number, layout: CanvasLayout) => Promise<void>;
  saveAnnotationText?: (canvasId: number, annotationId: number, text: string) => Promise<void>;
  /** Invalidate in-flight trash/merge apply responses so they cannot clobber undo/redo. */
  invalidatePendingGraphApplies?: () => void;
  /** Drop queued geometry writes and invalidate in-flight geometry HTTP calls. */
  clearPendingGeometry?: () => void;
  /** Drop queued annotation text writes and invalidate in-flight text HTTP calls. */
  clearPendingAnnotationText?: () => void;
};

const isEmptySelection = (selection: GraphSelection): boolean =>
  !selection.nodes?.length && !selection.edges?.length && !selection.annotations?.length;

const collectIds = (
  fromIds: Set<number>,
  toIds: Set<number>,
): number[] => [...toIds].filter(id => !fromIds.has(id));

const dataIdsFromRecords = (
  records: Record<string, { dataId: number }>,
): Set<number> =>
  new Set(Object.values(records).map(item => item.dataId).filter(id => id > 0));

const dataIdsFromAnnotations = (annotations: CanvasAnnotation[]): Set<number> =>
  new Set(annotations.map(annotation => annotation.dataId).filter(id => id > 0));

const buildSelection = (
  nodes: number[],
  edges: number[],
  annotations: number[],
): GraphSelection => ({
  ...(nodes.length > 0 && { nodes }),
  ...(edges.length > 0 && { edges }),
  ...(annotations.length > 0 && { annotations }),
});

const diffNodeGeometry = (from: Canvas, to: Canvas): NonNullable<GraphGeometry['nodes']> => {
  const fromNodesByDataId = new Map(
    Object.values(from.nodes)
      .filter(node => node.dataId > 0)
      .map(node => [node.dataId, node]),
  );
  return Object.values(to.nodes).flatMap(node => {
    if (node.dataId <= 0) return [];
    const previous = fromNodesByDataId.get(node.dataId);
    if (!previous || (previous.x === node.x && previous.y === node.y)) return [];
    return [{ data_id: node.dataId, x: node.x, y: node.y }];
  });
};

const annotationGeometryUnchanged = (
  previous: CanvasAnnotation,
  annotation: CanvasAnnotation,
): boolean => (
  previous.position.x === annotation.position.x
  && previous.position.y === annotation.position.y
  && previous.width === annotation.width
  && previous.height === annotation.height
);

const diffAnnotationGeometry = (
  fromByDataId: Map<number, CanvasAnnotation>,
  to: Canvas,
): NonNullable<GraphGeometry['annotations']> => to.annotations.flatMap(annotation => {
  if (annotation.dataId <= 0) return [];
  const previous = fromByDataId.get(annotation.dataId);
  if (!previous || annotationGeometryUnchanged(previous, annotation)) return [];
  return [{
    id: annotation.dataId,
    x: annotation.position.x,
    y: annotation.position.y,
    width: annotation.width,
    height: annotation.height,
  }];
});

const diffAnnotationTexts = (
  fromByDataId: Map<number, CanvasAnnotation>,
  to: Canvas,
): CanvasHistoryAnnotationText[] => to.annotations.flatMap(annotation => {
  if (annotation.dataId <= 0) return [];
  const previous = fromByDataId.get(annotation.dataId);
  if (!previous || previous.text === annotation.text) return [];
  return [{ id: annotation.dataId, content: annotation.text }];
});

/**
 * Diff `from` → `to` for undo/redo persistence.
 * Elements present only in `to` should be restored; only in `from` should be trashed.
 */
export const diffCanvasForHistory = (from: Canvas, to: Canvas): CanvasHistoryDiff => {
  const fromNodeIds = dataIdsFromRecords(from.nodes);
  const toNodeIds = dataIdsFromRecords(to.nodes);
  const fromEdgeIds = dataIdsFromRecords(from.edges);
  const toEdgeIds = dataIdsFromRecords(to.edges);
  const fromAnnotationIds = dataIdsFromAnnotations(from.annotations);
  const toAnnotationIds = dataIdsFromAnnotations(to.annotations);

  const restore = buildSelection(
    collectIds(fromNodeIds, toNodeIds),
    collectIds(fromEdgeIds, toEdgeIds),
    collectIds(fromAnnotationIds, toAnnotationIds),
  );
  const trash = buildSelection(
    collectIds(toNodeIds, fromNodeIds),
    collectIds(toEdgeIds, fromEdgeIds),
    collectIds(toAnnotationIds, fromAnnotationIds),
  );

  const fromAnnotationsByDataId = new Map(
    from.annotations
      .filter(annotation => annotation.dataId > 0)
      .map(annotation => [annotation.dataId, annotation]),
  );
  const nodeMoves = diffNodeGeometry(from, to);
  const annotationMoves = diffAnnotationGeometry(fromAnnotationsByDataId, to);
  const geometry: GraphGeometry | null = (nodeMoves.length > 0 || annotationMoves.length > 0)
    ? {
      ...(nodeMoves.length > 0 && { nodes: nodeMoves }),
      ...(annotationMoves.length > 0 && { annotations: annotationMoves }),
    }
    : null;

  return {
    restore,
    trash,
    geometry,
    layout: from.layout !== to.layout ? to.layout : null,
    annotationTexts: diffAnnotationTexts(fromAnnotationsByDataId, to),
  };
};

export const historyDiffHasPersistence = (diff: CanvasHistoryDiff): boolean =>
  !isEmptySelection(diff.restore)
  || !isEmptySelection(diff.trash)
  || diff.geometry !== null
  || diff.layout !== null
  || diff.annotationTexts.length > 0;

const pushOptionalTask = (
  tasks: Promise<void>[],
  task: Promise<void> | undefined,
) => {
  if (task) tasks.push(task);
};

export const persistCanvasHistoryTransition = async (
  from: Canvas,
  to: Canvas,
  persistence: CanvasHistoryPersistence,
): Promise<void> => {
  const diff = diffCanvasForHistory(from, to);
  if (!historyDiffHasPersistence(diff)) return;

  const canvasId = to.id;
  const tasks: Promise<void>[] = [];

  if (!isEmptySelection(diff.restore)) {
    pushOptionalTask(tasks, persistence.saveRestoreElements?.(canvasId, diff.restore));
  }
  if (!isEmptySelection(diff.trash)) {
    pushOptionalTask(tasks, persistence.saveTrashElements?.(canvasId, diff.trash));
  }
  if (diff.geometry) {
    pushOptionalTask(tasks, persistence.saveGeometry?.(canvasId, diff.geometry, { immediate: true }));
  }
  if (diff.layout) {
    pushOptionalTask(tasks, persistence.saveLayout?.(canvasId, diff.layout));
  }
  for (const { id, content } of diff.annotationTexts) {
    pushOptionalTask(tasks, persistence.saveAnnotationText?.(canvasId, id, content));
  }

  await Promise.all(tasks);
};
