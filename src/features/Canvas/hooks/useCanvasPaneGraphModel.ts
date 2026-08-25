import { useNavigate } from 'react-router-dom';
import useCanvas from '@/features/Canvas/hooks/useCanvas';
import useCanvasPersistence from '@/features/Canvas/hooks/useCanvasPersistence';
import useCanvasFilters from '@/features/Canvas/hooks/useCanvasFilters';
import useCanvasHoverState from '@/features/Canvas/hooks/useCanvasHoverState';
import useCanvasGraphHover from '@/features/Canvas/hooks/useCanvasGraphHover';
import useCanvasEntityNavigation from '@/features/Canvas/hooks/useCanvasEntityNavigation';
import useCanvasNodeActions from '@/features/Canvas/hooks/useCanvasNodeActions';
import useCanvasPaneHandlers from '@/features/Canvas/hooks/useCanvasPaneHandlers';
import useCanvasFocus from '@/features/Canvas/hooks/useCanvasFocus';
import useCanvasNodePositions from '@/features/Canvas/hooks/useCanvasNodePositions';
import { useCanvasPaneAnnotationHandlers } from '@/features/Canvas/hooks/useCanvasPaneAnnotationHandlers';
import type { Canvas } from '@/features/Canvas/types/canvas';

/** Graph data, persistence, annotations, and pane interaction handlers. */
export const useCanvasPaneGraphModel = (activeCanvas: Canvas) => {
  const navigate = useNavigate();
  const persistence = useCanvasPersistence();
  const canvas = useCanvas(persistence);
  const { visibleNodes, visibleEdges } = useCanvasFilters(activeCanvas);
  const hoverState = useCanvasHoverState();
  const { navigateToNode, navigateToEdge } = useCanvasEntityNavigation();
  const focus = useCanvasFocus(hoverState.setHoveredNodeId, hoverState.setHoveredAnnotationId);
  const annotations = useCanvasPaneAnnotationHandlers({
    activeCanvas,
    pushUndo: canvas.pushUndo,
    persistence,
    findAnnotationOnCanvas: focus.findAnnotationOnCanvas,
  });
  const nodeActions = useCanvasNodeActions({
    activeCanvas,
    navigateToNode,
    navigate,
    setSelectedNodeIds: focus.setSelectedNodeIds,
    clearHover: hoverState.clearHover,
    removeNode: canvas.removeNode,
  });
  const graphHover = useCanvasGraphHover({ canvas: activeCanvas, navigateToEdge });
  const paneHandlers = useCanvasPaneHandlers({
    activeCanvas,
    navigateToEdge,
    handleNodeHover: hoverState.handleNodeHover,
    handleEdgeHover: hoverState.handleEdgeHover,
    handleAnnotationHover: hoverState.handleAnnotationHover,
    handleGraphNodeHover: graphHover.handleGraphNodeHover,
    handleGraphEdgeHover: graphHover.handleGraphEdgeHover,
    nodeActions,
  });
  const positions = useCanvasNodePositions({
    canvas: activeCanvas,
    pushUndo: canvas.pushUndo,
    saveGeometry: persistence.saveGeometry,
    saveLayout: persistence.saveLayout,
  });

  return {
    graph: {
      visibleNodes,
      visibleEdges,
      positions,
      paneHandlers,
      graphHover,
      saveStatus: persistence.saveStatus,
      graphAnnotations: annotations.graphAnnotations,
      handleAnnotationsChange: annotations.handleAnnotationsChange,
      handleAddAnnotation: annotations.handleAddAnnotation,
    },
    hover: {
      hoveredNodeId: hoverState.hoveredNodeId,
      hoveredEdgeId: hoverState.hoveredEdgeId,
      hoveredAnnotationId: hoverState.hoveredAnnotationId,
      selectedNodeIds: focus.selectedNodeIds,
      focusRequest: focus.focusRequest,
      setHoveredNodeId: hoverState.setHoveredNodeId,
      setHoveredAnnotationId: hoverState.setHoveredAnnotationId,
      findNodeOnCanvas: focus.findNodeOnCanvas,
      findAnnotationOnCanvas: focus.findAnnotationOnCanvas,
    },
    history: {
      rename: canvas.rename,
      undo: canvas.undo,
      redo: canvas.redo,
      canUndo: canvas.canUndo,
      canRedo: canvas.canRedo,
    },
    nodeActions,
    setSelectedNodeIds: focus.setSelectedNodeIds,
    findNodeOnCanvas: focus.findNodeOnCanvas,
    handleAnnotationListAction: annotations.handleAnnotationListAction,
  };
};
