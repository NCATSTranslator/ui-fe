import { useCallback } from 'react';
import type { GraphNodeType, GraphEdgeType, HoverGeometry } from 'translator-graph-view';
import type { Canvas } from '@/features/Canvas/types/canvas';

interface CanvasNodeActions {
  navigateToCanvasNode: (nodeId: string) => void;
}

interface UseCanvasPaneHandlersOptions {
  activeCanvas: Canvas | null;
  navigateToEdge: (canvas: Canvas, edge: Canvas['edges'][string]) => void;
  setHoveredNodeId: (nodeId: string | null) => void;
  handleNodeHover: (node: GraphNodeType | null) => void;
  handleGraphNodeHover: (node: GraphNodeType | null, geometry: HoverGeometry | null) => void;
  handleGraphEdgeHover: (edge: GraphEdgeType | null, geometry: HoverGeometry | null) => void;
  nodeActions: CanvasNodeActions;
}

const useCanvasPaneHandlers = ({
  activeCanvas,
  navigateToEdge,
  setHoveredNodeId,
  handleNodeHover,
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
    if (edge && geometry) {
      setHoveredNodeId(null);
    }
    handleGraphEdgeHover(edge, geometry);
  }, [handleGraphEdgeHover, setHoveredNodeId]);

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
    handleNodeClick,
    handleEdgeClick,
  };
};

export default useCanvasPaneHandlers;
