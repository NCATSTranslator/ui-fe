import { useState, useCallback } from 'react';
import type { GraphNodeType } from 'translator-graph-view';

const useCanvasHoverState = () => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const clearHover = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  const handleNodeHover = useCallback((node: GraphNodeType | null) => {
    setHoveredNodeId(node?.id ?? null);
  }, []);

  return {
    hoveredNodeId,
    setHoveredNodeId,
    clearHover,
    handleNodeHover,
  };
};

export default useCanvasHoverState;
