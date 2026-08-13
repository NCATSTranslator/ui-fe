import { useState, useCallback } from 'react';
import type { GraphNodeType, GraphEdgeType } from 'translator-graph-view';

const useCanvasHoverState = () => {
  const [hoveredNodeId, setHoveredNodeIdState] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeIdState] = useState<string | null>(null);
  const [hoveredAnnotationId, setHoveredAnnotationIdState] = useState<string | null>(null);

  const clearHover = useCallback(() => {
    setHoveredNodeIdState(null);
    setHoveredEdgeIdState(null);
    setHoveredAnnotationIdState(null);
  }, []);

  const setHoveredNodeId = useCallback((nodeId: string | null) => {
    setHoveredNodeIdState(nodeId);
    if (nodeId) {
      setHoveredEdgeIdState(null);
      setHoveredAnnotationIdState(null);
    }
  }, []);

  const setHoveredEdgeId = useCallback((edgeId: string | null) => {
    setHoveredEdgeIdState(edgeId);
    if (edgeId) {
      setHoveredNodeIdState(null);
      setHoveredAnnotationIdState(null);
    }
  }, []);

  const setHoveredAnnotationId = useCallback((annotationId: string | null) => {
    setHoveredAnnotationIdState(annotationId);
    if (annotationId) {
      setHoveredNodeIdState(null);
      setHoveredEdgeIdState(null);
    }
  }, []);

  const handleNodeHover = useCallback((node: GraphNodeType | null) => {
    setHoveredNodeId(node?.id ?? null);
  }, [setHoveredNodeId]);

  const handleEdgeHover = useCallback((edge: GraphEdgeType | null) => {
    setHoveredEdgeId(edge?.id ?? null);
  }, [setHoveredEdgeId]);

  const handleAnnotationHover = useCallback((annotationId: string | null) => {
    setHoveredAnnotationId(annotationId);
  }, [setHoveredAnnotationId]);

  return {
    hoveredNodeId,
    hoveredEdgeId,
    hoveredAnnotationId,
    setHoveredNodeId,
    setHoveredEdgeId,
    setHoveredAnnotationId,
    clearHover,
    handleNodeHover,
    handleEdgeHover,
    handleAnnotationHover,
  };
};

export default useCanvasHoverState;
