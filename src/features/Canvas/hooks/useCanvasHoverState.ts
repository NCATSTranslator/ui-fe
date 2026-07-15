import { useState, useCallback, useRef, useEffect } from 'react';
import type { GraphNodeType, GraphEdgeType, HoverGeometry } from 'translator-graph-view';

interface NodeHoverState {
  nodeId: string;
  geometry: HoverGeometry;
}

interface EdgeHoverState {
  edgeId: string;
  geometry: HoverGeometry;
}

const HOVER_CLEAR_DELAY_MS = 100;

const useCanvasHoverState = () => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [nodeHover, setNodeHover] = useState<NodeHoverState | null>(null);
  const [edgeHover, setEdgeHover] = useState<EdgeHoverState | null>(null);
  const menuHoveredRef = useRef(false);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingClear = useCallback(() => {
    if (clearTimeoutRef.current !== null) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => cancelPendingClear(), [cancelPendingClear]);

  const clearHover = useCallback(() => {
    cancelPendingClear();
    setNodeHover(null);
    setEdgeHover(null);
    setHoveredNodeId(null);
    menuHoveredRef.current = false;
  }, [cancelPendingClear]);

  const handleNodeHover = useCallback((node: GraphNodeType | null, geometry: HoverGeometry | null) => {
    if (!node || !geometry) {
      cancelPendingClear();
      clearTimeoutRef.current = setTimeout(() => {
        clearTimeoutRef.current = null;
        if (!menuHoveredRef.current) {
          setNodeHover(null);
          setHoveredNodeId(null);
        }
      }, HOVER_CLEAR_DELAY_MS);
      return;
    }
    cancelPendingClear();
    setEdgeHover(null);
    setNodeHover({ nodeId: node.id, geometry });
    setHoveredNodeId(node.id);
  }, [cancelPendingClear]);

  const handleEdgeHover = useCallback((edge: GraphEdgeType | null, geometry: HoverGeometry | null) => {
    if (!edge || !geometry) {
      setEdgeHover(null);
      return;
    }
    cancelPendingClear();
    setNodeHover(null);
    setEdgeHover({ edgeId: edge.id, geometry });
  }, [cancelPendingClear]);

  const handleMenuMouseEnter = useCallback(() => {
    menuHoveredRef.current = true;
    cancelPendingClear();
  }, [cancelPendingClear]);

  const handleMenuMouseLeave = useCallback(() => {
    menuHoveredRef.current = false;
    setNodeHover(null);
    setHoveredNodeId(null);
  }, []);

  return {
    hoveredNodeId,
    setHoveredNodeId,
    nodeHover,
    edgeHover,
    clearHover,
    handleNodeHover,
    handleEdgeHover,
    handleMenuMouseEnter,
    handleMenuMouseLeave,
  };
};

export default useCanvasHoverState;
