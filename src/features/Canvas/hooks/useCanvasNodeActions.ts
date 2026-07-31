import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Canvas, CanvasNode } from '@/features/Canvas/types/canvas';
import { canvasEntityRemovedToast } from '@/features/Core/utils/toastMessages';

interface UseCanvasNodeActionsOptions {
  activeCanvas: Canvas | null;
  navigateToNode: (canvas: Canvas, node: CanvasNode) => void;
  navigate: ReturnType<typeof useNavigate>;
  setSelectedNodeIds: (ids: string[]) => void;
  clearHover: () => void;
  removeNode: (nodeId: string) => void;
}

const useCanvasNodeActions = ({
  activeCanvas,
  navigateToNode,
  navigate,
  setSelectedNodeIds,
  clearHover,
  removeNode,
}: UseCanvasNodeActionsOptions) => {
  const navigateToCanvasNode = useCallback((nodeId: string) => {
    if (!activeCanvas) return;
    const canvasNode = activeCanvas.nodes[nodeId];
    if (!canvasNode) return;
    setSelectedNodeIds([nodeId]);
    navigateToNode(activeCanvas, canvasNode);
  }, [activeCanvas, navigateToNode, setSelectedNodeIds]);

  const navigateToNewQuery = useCallback((nodeId: string) => {
    clearHover();
    const canvasNode = activeCanvas?.nodes[nodeId];
    const term = canvasNode?.names[0] || canvasNode?.id;
    navigate(term ? `/new-query?prefill=${encodeURIComponent(term)}` : '/new-query');
  }, [activeCanvas, navigate, clearHover]);

  const handleRemove = useCallback((nodeId: string) => {
    const nodeName = activeCanvas?.nodes[nodeId]?.names[0] || nodeId;
    removeNode(nodeId);
    clearHover();
    canvasEntityRemovedToast(nodeName);
  }, [activeCanvas, removeNode, clearHover]);

  const handleInformation = useCallback((nodeId: string) => {
    clearHover();
    navigateToCanvasNode(nodeId);
  }, [clearHover, navigateToCanvasNode]);

  return {
    navigateToCanvasNode,
    navigateToNewQuery,
    handleRemove,
    handleInformation,
  };
};

export default useCanvasNodeActions;
