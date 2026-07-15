import type { Canvas, CanvasNode } from '@/features/Canvas/types/canvas';
import type { ResultSet } from '@/features/ResultList/types/results.d';

export type CanvasSortMode = 'date' | 'name';
export type ObjectSortMode = 'relationships' | 'alphabetical' | 'type';

export const getCanvasNodeCount = (canvas: Canvas): number => Object.keys(canvas.nodes).length;

export const getNodeEdgeCount = (canvas: Canvas, nodeId: string): number => {
  let count = 0;
  for (const edge of Object.values(canvas.edges)) {
    if (edge.subject === nodeId || edge.object === nodeId) count++;
  }
  return count;
};

export const sortCanvasNodes = (
  nodes: CanvasNode[],
  mode: ObjectSortMode,
  canvas: Canvas,
): CanvasNode[] =>
  [...nodes].sort((a, b) => {
    switch (mode) {
      case 'relationships':
        return getNodeEdgeCount(canvas, b.id) - getNodeEdgeCount(canvas, a.id);
      case 'alphabetical':
        return (a.names[0] ?? a.id).localeCompare(b.names[0] ?? b.id);
      case 'type':
        return (a.types[0] ?? '').localeCompare(b.types[0] ?? '');
      default:
        return 0;
    }
  });

export const filterCanvasNodes = (nodes: CanvasNode[], search: string): CanvasNode[] => {
  if (!search) return nodes;
  const lower = search.toLowerCase();
  return nodes.filter(n =>
    n.names.some(name => name.toLowerCase().includes(lower)) ||
    n.curies.some(curie => curie.toLowerCase().includes(lower))
  );
};

export const mergeCanvasNode = (existing: CanvasNode, incoming: CanvasNode): CanvasNode => ({
  ...existing,
  names: Array.from(new Set([...existing.names, ...incoming.names])),
  types: Array.from(new Set([...existing.types, ...incoming.types])),
  curies: Array.from(new Set([...existing.curies, ...incoming.curies])),
});

export const filterCanvasesBySearch = (canvases: Canvas[], searchTerm: string): Canvas[] => {
  if (!searchTerm) return canvases;
  const lower = searchTerm.toLowerCase();
  return canvases.filter(c => c.label.toLowerCase().includes(lower));
};

export const sortCanvases = (canvases: Canvas[], mode: CanvasSortMode = 'date'): Canvas[] =>
  [...canvases].sort((a, b) =>
    mode === 'name'
      ? a.label.localeCompare(b.label)
      : new Date(b.timeUpdated).getTime() - new Date(a.timeUpdated).getTime()
  );

const LARGE_RESULT_THRESHOLD = 50;

export const resultCountExceedsThreshold = (resultSet: ResultSet): boolean =>
  resultSet.data.results.length > LARGE_RESULT_THRESHOLD;
