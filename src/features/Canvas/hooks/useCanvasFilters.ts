import { useMemo } from 'react';
import type { Canvas, CanvasNode, CanvasEdge } from '@/features/Canvas/types/canvas';
import useCanvasSourceFilters from '@/features/Canvas/hooks/useCanvasSourceFilters';
import type { CanvasTagFiltersState } from '@/features/Canvas/hooks/useCanvasSourceFilters';

interface CanvasFiltersResult {
  visibleNodes: Record<string, CanvasNode> | undefined;
  visibleEdges: Record<string, CanvasEdge> | undefined;
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

  const visibleEdges = useMemo(() => {
    if (!canvas || !visibleNodes) return undefined;
    return tagFilters.getVisibleEdges(visibleNodeIds);
  }, [canvas, visibleNodes, tagFilters, visibleNodeIds]);

  return { visibleNodes, visibleEdges, tagFilters };
};

export default useCanvasFilters;
