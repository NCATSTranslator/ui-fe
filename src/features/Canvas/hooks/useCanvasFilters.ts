import { useMemo } from 'react';
import type { Canvas, CanvasNode, CanvasEdge } from '@/features/Canvas/types/canvas';
import useCanvasSourceFilters from '@/features/Canvas/hooks/useCanvasSourceFilters';
import useCanvasInspectorFilters from '@/features/Canvas/hooks/useCanvasInspectorFilters';
import type { CanvasTagFiltersState } from '@/features/Canvas/hooks/useCanvasSourceFilters';
import type { CanvasInspectorFiltersState } from '@/features/Canvas/hooks/useCanvasInspectorFilters';

interface CanvasFiltersResult {
  visibleNodes: Record<string, CanvasNode> | undefined;
  visibleEdges: Record<string, CanvasEdge> | undefined;
  inspectorFilters: CanvasInspectorFiltersState;
  tagFilters: CanvasTagFiltersState;
}

const useCanvasFilters = (
  canvas: Canvas | null,
): CanvasFiltersResult => {
  const tagFilters = useCanvasSourceFilters(canvas);

  const visibleNodes = useMemo(() => {
    if (!canvas) return undefined;
    if (Object.keys(tagFilters.tags).length === 0 && tagFilters.hiddenTagIds.size === 0) {
      return undefined;
    }
    return tagFilters.getVisibleNodes();
  }, [canvas, tagFilters]);

  const visibleNodeIds = useMemo(() => {
    if (visibleNodes) return new Set(Object.keys(visibleNodes));
    if (canvas) return new Set(Object.keys(canvas.nodes));
    return new Set<string>();
  }, [visibleNodes, canvas]);

  const allNodeIds = useMemo(
    () => new Set(canvas ? Object.keys(canvas.nodes) : []),
    [canvas],
  );

  const visibleEdges = useMemo(() => {
    if (!canvas || !visibleNodes) return undefined;
    return tagFilters.getVisibleEdges(visibleNodeIds);
  }, [canvas, visibleNodes, tagFilters, visibleNodeIds]);

  const inspectorFilters = useCanvasInspectorFilters(visibleNodeIds, allNodeIds, tagFilters.showAll);

  return { visibleNodes, visibleEdges, inspectorFilters, tagFilters };
};

export default useCanvasFilters;
