import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Canvas, CanvasNode } from '@/features/Canvas/types/canvas';
import { getHomeQueryPath, type HomeQueryTab } from '@/features/Query/utils/homeQueryParams';
import { getCanvasNodeDisplayName, getCanvasNodePrimaryCategory } from '@/features/Canvas/utils/canvasFunctions';
import { formatBiolinkNode } from '@/features/Core/utils/stringFormatters';
import { finalizeCanvasElementRemoval } from '@/features/Canvas/utils/canvasRemovalUi';

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

  const navigateToHomeQuery = useCallback((kind: HomeQueryTab, nodeId: string) => {
    clearHover();
    const canvasNode = activeCanvas?.nodes[nodeId];
    const id = canvasNode?.id || nodeId;
    const label = canvasNode
      ? formatBiolinkNode(getCanvasNodeDisplayName(canvasNode), getCanvasNodePrimaryCategory(canvasNode) ?? null, null)
      : undefined;
    const category = getCanvasNodePrimaryCategory(canvasNode);
    navigate(getHomeQueryPath(kind, id, label, category));
  }, [activeCanvas, navigate, clearHover]);

  const handleRemove = useCallback((nodeId: string) => {
    const nodeName = activeCanvas?.nodes[nodeId]?.names[0] || nodeId;
    removeNode(nodeId);
    finalizeCanvasElementRemoval({
      clearHover,
      setSelectedNodeIds,
      pickedCount: 1,
      singleEntityName: nodeName,
    });
  }, [activeCanvas, removeNode, clearHover, setSelectedNodeIds]);

  const handleInformation = useCallback((nodeId: string) => {
    clearHover();
    navigateToCanvasNode(nodeId);
  }, [clearHover, navigateToCanvasNode]);

  return useMemo(() => ({
    navigateToCanvasNode,
    navigateToHomeQuery,
    handleRemove,
    handleInformation,
  }), [navigateToCanvasNode, navigateToHomeQuery, handleRemove, handleInformation]);
};

export default useCanvasNodeActions;
