import type { Canvas, CanvasNode, CanvasAnnotation } from '@/features/Canvas/types/canvas';
import type { ResultSet } from '@/features/ResultList/types/results.d';

export type CanvasSortMode = 'date' | 'name';
export type ObjectSortMode = 'relationships' | 'alphabetical' | 'type';
export type AnnotationSortMode = 'alphabetical' | 'date';

export const getAnnotationDisplayName = (annotation: CanvasAnnotation): string => {
  const trimmed = annotation.text.trim();
  return trimmed || 'Empty annotation';
};

export const getCanvasNodeDisplayName = (node: CanvasNode): string =>
  node.names[0] || node.id;

export type CanvasSearchMatch = {
  label: string;
  value: string;
};

export const formatCanvasSearchMatchTooltip = (matches: CanvasSearchMatch[]): string =>
  `Matched on: ${matches.map(({ label, value }) => `${label} (${value})`).join(', ')}`;

const collectCanvasNodeSearchMatches = (
  node: CanvasNode,
  search: string,
): CanvasSearchMatch[] => {
  if (!search) return [];

  const lower = search.toLowerCase();
  const matches: CanvasSearchMatch[] = [];
  const seen = new Set<string>();

  const addMatch = (label: string, value: string) => {
    const key = `${label}:${value}`;
    if (seen.has(key)) return;
    seen.add(key);
    matches.push({ label, value });
  };

  node.names.forEach(name => {
    if (name.toLowerCase().includes(lower)) addMatch('name', name);
  });
  node.curies.forEach(curie => {
    if (curie.toLowerCase().includes(lower)) addMatch('curie', curie);
  });

  return matches;
};

export const canvasNodeMatchesSearch = (node: CanvasNode, search: string): boolean =>
  collectCanvasNodeSearchMatches(node, search).length > 0;

export const getCanvasNodeSearchMatchesOutsideDisplayName = (
  node: CanvasNode,
  search: string,
): CanvasSearchMatch[] => {
  if (!search) return [];

  const displayName = getCanvasNodeDisplayName(node);
  if (displayName.toLowerCase().includes(search.toLowerCase())) return [];

  return collectCanvasNodeSearchMatches(node, search);
};

const collectCanvasAnnotationSearchMatches = (
  annotation: CanvasAnnotation,
  search: string,
): CanvasSearchMatch[] => {
  if (!search) return [];

  const lower = search.toLowerCase();
  if (!annotation.text.toLowerCase().includes(lower)) return [];

  return [{ label: 'text', value: annotation.text.trim() || annotation.text }];
};

export const canvasAnnotationMatchesSearch = (
  annotation: CanvasAnnotation,
  search: string,
): boolean => collectCanvasAnnotationSearchMatches(annotation, search).length > 0;

export const getCanvasAnnotationSearchMatchesOutsideDisplayName = (
  annotation: CanvasAnnotation,
  search: string,
): CanvasSearchMatch[] => {
  if (!search) return [];

  const displayName = getAnnotationDisplayName(annotation);
  if (displayName.toLowerCase().includes(search.toLowerCase())) return [];

  return collectCanvasAnnotationSearchMatches(annotation, search);
};

export const filterCanvasAnnotations = (
  annotations: CanvasAnnotation[],
  search: string,
): CanvasAnnotation[] => {
  if (!search) return annotations;
  return annotations.filter(annotation => canvasAnnotationMatchesSearch(annotation, search));
};

export const sortCanvasAnnotations = (
  annotations: CanvasAnnotation[],
  mode: AnnotationSortMode,
): CanvasAnnotation[] =>
  [...annotations].sort((a, b) => {
    switch (mode) {
      case 'alphabetical':
        return getAnnotationDisplayName(a).localeCompare(getAnnotationDisplayName(b));
      case 'date':
        return new Date(b.timeCreated).getTime() - new Date(a.timeCreated).getTime();
      default:
        return 0;
    }
  });

export const getCanvasNodeCount = (canvas: Canvas): number => Object.keys(canvas.nodes).length;

export const getCanvasObjectCountDisplay = (
  canvas: Canvas,
  labels?: { singular: string; plural: string },
): string => {
  if (!canvas.graphLoaded) return '-';
  const count = getCanvasNodeCount(canvas);
  if (!labels) return String(count);
  return `${count} ${count === 1 ? labels.singular : labels.plural}`;
};

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
        return getCanvasNodeDisplayName(a).localeCompare(getCanvasNodeDisplayName(b));
      case 'type':
        return (a.types[0] ?? '').localeCompare(b.types[0] ?? '');
      default:
        return 0;
    }
  });

export const filterCanvasNodes = (nodes: CanvasNode[], search: string): CanvasNode[] => {
  if (!search) return nodes;
  return nodes.filter(node => canvasNodeMatchesSearch(node, search));
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
