import { useState, useCallback, useMemo } from 'react';
import type { Canvas, CanvasNode, CanvasEdge } from '@/features/Canvas/types/canvas';

export interface CanvasTagFiltersState {
  tags: Record<string, { name: string; description: string }>;
  hiddenTagIds: Set<string>;
  toggleTag: (tagId: string) => void;
  showAll: () => void;
  hideAll: () => void;
  getVisibleNodes: () => Record<string, CanvasNode>;
  getVisibleEdges: (visibleNodeIds: Set<string>) => Record<string, CanvasEdge>;
}

const useCanvasSourceFilters = (canvas: Canvas | null): CanvasTagFiltersState => {
  const [hiddenTagIds, setHiddenTagIds] = useState<Set<string>>(new Set());

  const tags = useMemo(() => {
    if (!canvas?.tags) return {};
    const result: Record<string, { name: string; description: string }> = {};
    for (const [id, tag] of Object.entries(canvas.tags)) {
      result[id] = { name: tag.description.name, description: tag.description.description };
    }
    return result;
  }, [canvas?.tags]);

  const toggleTag = useCallback((tagId: string) => {
    setHiddenTagIds(prev => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }, []);

  const showAll = useCallback(() => setHiddenTagIds(new Set()), []);

  const hideAll = useCallback(() => {
    setHiddenTagIds(new Set(Object.keys(tags)));
  }, [tags]);

  const getVisibleNodes = useCallback((): Record<string, CanvasNode> => {
    if (!canvas) return {};
    if (hiddenTagIds.size === 0) {
      return Object.fromEntries(
        Object.entries(canvas.nodes).filter(([, node]) => !node.hidden)
      );
    }
    const visible: Record<string, CanvasNode> = {};
    for (const [id, node] of Object.entries(canvas.nodes)) {
      if (node.hidden) continue;
      const nodeTags = Object.keys(node.tags);
      const allHidden = nodeTags.length > 0 && nodeTags.every(t => hiddenTagIds.has(t));
      if (!allHidden) visible[id] = node;
    }
    return visible;
  }, [canvas, hiddenTagIds]);

  const getVisibleEdges = useCallback((visibleNodeIds: Set<string>): Record<string, CanvasEdge> => {
    if (!canvas) return {};
    const visible: Record<string, CanvasEdge> = {};
    for (const [id, edge] of Object.entries(canvas.edges)) {
      if (edge.hidden) continue;
      if (!visibleNodeIds.has(edge.subject) || !visibleNodeIds.has(edge.object)) continue;
      if (hiddenTagIds.size > 0) {
        const edgeTags = Object.keys(edge.tags);
        if (edgeTags.length > 0 && edgeTags.every(t => hiddenTagIds.has(t))) continue;
      }
      visible[id] = edge;
    }
    return visible;
  }, [canvas, hiddenTagIds]);

  return { tags, hiddenTagIds, toggleTag, showAll, hideAll, getVisibleNodes, getVisibleEdges };
};

export default useCanvasSourceFilters;
