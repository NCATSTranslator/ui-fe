import { useCallback, useRef, useState } from 'react';
import type { GraphFocusRequest } from 'translator-graph-view';

const useCanvasFocus = (setHoveredNodeId: (nodeId: string | null) => void) => {
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [focusRequest, setFocusRequest] = useState<GraphFocusRequest | null>(null);
  const focusTokenRef = useRef(0);

  const focusOnCanvas = useCallback((elementId: string) => {
    focusTokenRef.current += 1;
    setFocusRequest({ nodeId: elementId, token: focusTokenRef.current });
  }, []);

  const findNodeOnCanvas = useCallback((nodeId: string) => {
    setSelectedNodeIds([nodeId]);
    setHoveredNodeId(nodeId);
    focusOnCanvas(nodeId);
  }, [setHoveredNodeId, focusOnCanvas]);

  const findAnnotationOnCanvas = useCallback((annotationId: string) => {
    setSelectedNodeIds([]);
    focusOnCanvas(annotationId);
  }, [focusOnCanvas]);

  return {
    selectedNodeIds,
    setSelectedNodeIds,
    focusRequest,
    findNodeOnCanvas,
    findAnnotationOnCanvas,
  };
};

export default useCanvasFocus;
