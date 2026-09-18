import { useCallback, useRef, useState } from 'react';
import type { GraphFocusRequest } from 'translator-graph-view';

const ANNOTATION_TEXTAREA_FOCUS_ATTEMPTS = 30;

const focusAnnotationTextarea = (annotationId: string): (() => void) => {
  let cancelled = false;
  let attempts = 0;
  let frameId = 0;

  const tryFocus = () => {
    if (cancelled) return;
    const textarea = document.querySelector<HTMLTextAreaElement>(
      `.react-flow__node[data-id="${CSS.escape(annotationId)}"] textarea`,
    );
    if (textarea) {
      const end = textarea.value.length;
      textarea.focus();
      textarea.setSelectionRange(end, end);
      return;
    }
    attempts += 1;
    if (attempts < ANNOTATION_TEXTAREA_FOCUS_ATTEMPTS) {
      frameId = requestAnimationFrame(tryFocus);
    }
  };

  frameId = requestAnimationFrame(tryFocus);
  return () => {
    cancelled = true;
    cancelAnimationFrame(frameId);
  };
};

const useCanvasFocus = (
  setHoveredNodeId: (nodeId: string | null) => void,
  setHoveredAnnotationId: (annotationId: string | null) => void,
) => {
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [focusRequest, setFocusRequest] = useState<GraphFocusRequest | null>(null);
  const focusTokenRef = useRef(0);
  const cancelAnnotationTextFocusRef = useRef<(() => void) | null>(null);

  const focusOnCanvas = useCallback((elementId: string) => {
    focusTokenRef.current += 1;
    setFocusRequest({ nodeId: elementId, token: focusTokenRef.current });
  }, []);

  const findNodeOnCanvas = useCallback((nodeId: string) => {
    cancelAnnotationTextFocusRef.current?.();
    cancelAnnotationTextFocusRef.current = null;
    setSelectedNodeIds([nodeId]);
    setHoveredNodeId(nodeId);
    focusOnCanvas(nodeId);
  }, [setHoveredNodeId, focusOnCanvas]);

  const findAnnotationOnCanvas = useCallback((annotationId: string) => {
    cancelAnnotationTextFocusRef.current?.();
    setSelectedNodeIds([]);
    setHoveredAnnotationId(annotationId);
    focusOnCanvas(annotationId);
    cancelAnnotationTextFocusRef.current = focusAnnotationTextarea(annotationId);
  }, [setHoveredAnnotationId, focusOnCanvas]);

  return {
    selectedNodeIds,
    setSelectedNodeIds,
    focusRequest,
    findNodeOnCanvas,
    findAnnotationOnCanvas,
  };
};

export default useCanvasFocus;
