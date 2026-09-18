import { useCallback } from 'react';
import type { GraphNodeType, GraphEdgeType, HoverGeometry } from 'translator-graph-view';
import type { Canvas } from '@/features/Canvas/types/canvas';

interface CanvasNodeActions {
  navigateToCanvasNode: (nodeId: string) => void;
}

interface UseCanvasPaneHandlersOptions {
  activeCanvas: Canvas | null;
  navigateToEdge: (canvas: Canvas, edge: Canvas['edges'][string]) => void;
  handleNodeHover: (node: GraphNodeType | null) => void;
  handleEdgeHover: (edge: GraphEdgeType | null) => void;
  handleAnnotationHover: (annotationId: string | null) => void;
  handleGraphNodeHover: (node: GraphNodeType | null, geometry: HoverGeometry | null) => void;
  handleGraphEdgeHover: (edge: GraphEdgeType | null, geometry: HoverGeometry | null) => void;
  nodeActions: CanvasNodeActions;
}

const useCanvasPaneHandlers = ({
  activeCanvas,
  navigateToEdge,
  handleNodeHover,
  handleEdgeHover,
  handleAnnotationHover,
  handleGraphNodeHover,
  handleGraphEdgeHover,
  nodeActions,
}: UseCanvasPaneHandlersOptions) => {
  const { navigateToCanvasNode } = nodeActions;

  const handleCombinedNodeHover = useCallback((node: GraphNodeType | null, geometry: HoverGeometry | null) => {
    handleNodeHover(node);
    handleGraphNodeHover(node, geometry);
  }, [handleNodeHover, handleGraphNodeHover]);

  const handleCombinedEdgeHover = useCallback((edge: GraphEdgeType | null, geometry: HoverGeometry | null) => {
    handleEdgeHover(edge);
    handleGraphEdgeHover(edge, geometry);
  }, [handleEdgeHover, handleGraphEdgeHover]);

  const handleCombinedAnnotationHover = useCallback((annotationId: string | null) => {
    handleAnnotationHover(annotationId);
  }, [handleAnnotationHover]);

  const handleNodeClick = useCallback((node: GraphNodeType) => {
    navigateToCanvasNode(node.id);
  }, [navigateToCanvasNode]);

  const handleEdgeClick = useCallback((edge: GraphEdgeType) => {
    if (!activeCanvas) return;
    const canvasEdge = activeCanvas.edges[edge.id];
    if (!canvasEdge) return;
    navigateToEdge(activeCanvas, canvasEdge);
  }, [activeCanvas, navigateToEdge]);

  return {
    handleCombinedNodeHover,
    handleCombinedEdgeHover,
    handleCombinedAnnotationHover,
    handleNodeClick,
    handleEdgeClick,
  };
};

export default useCanvasPaneHandlers;
