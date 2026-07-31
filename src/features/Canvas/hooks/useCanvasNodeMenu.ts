import { useState, useCallback } from 'react';
import type { CanvasNodeAction } from '@/features/Canvas/constants/canvasNodeActions';
import type { Canvas, CanvasNode } from '@/features/Canvas/types/canvas';
import type { CanvasNodeContextMenuTarget } from '@/features/Canvas/components/CanvasNodeContextMenu/CanvasNodeContextMenu';

interface UseCanvasNodeMenuOptions {
  activeCanvas: Canvas | null;
  nodeActions: {
    handleInformation: (nodeId: string) => void;
    navigateToNewQuery: (nodeId: string) => void;
    handleRemove: (nodeId: string) => void;
  };
  setSelectedNodeIds: (ids: string[]) => void;
  findNodeOnCanvas: (nodeId: string) => void;
}

const useCanvasNodeMenu = ({
  activeCanvas,
  nodeActions,
  setSelectedNodeIds,
  findNodeOnCanvas,
}: UseCanvasNodeMenuOptions) => {
  const [nodeContextMenu, setNodeContextMenu] = useState<CanvasNodeContextMenuTarget | null>(null);
  const [nodeMenuId, setNodeMenuId] = useState<string | null>(null);

  const closeNodeContextMenu = useCallback(() => setNodeContextMenu(null), []);
  const closeObjectListMenu = useCallback(() => setNodeMenuId(null), []);

  const handleNodeAction = useCallback((action: CanvasNodeAction, nodeId: string) => {
    closeNodeContextMenu();
    closeObjectListMenu();

    switch (action) {
      case 'information':
        nodeActions.handleInformation(nodeId);
        break;
      case 'newQuery':
        nodeActions.navigateToNewQuery(nodeId);
        break;
      case 'find':
        findNodeOnCanvas(nodeId);
        break;
      case 'remove':
        nodeActions.handleRemove(nodeId);
        break;
    }
  }, [nodeActions, findNodeOnCanvas, closeNodeContextMenu, closeObjectListMenu]);

  const handleObjectListAction = useCallback((action: CanvasNodeAction, node: CanvasNode) => {
    handleNodeAction(action, node.id);
  }, [handleNodeAction]);

  const handleNodeMenuIdChange = useCallback((menuNodeId: string | null) => {
    setNodeMenuId(menuNodeId);
    if (menuNodeId !== null) {
      setNodeContextMenu(null);
    }
  }, []);

  const handleNodeContextMenu = useCallback((nodeId: string, position: { x: number; y: number }) => {
    if (!activeCanvas?.nodes[nodeId]) return;
    setNodeMenuId(null);
    setSelectedNodeIds([nodeId]);
    setNodeContextMenu({ nodeId, position });
  }, [activeCanvas, setSelectedNodeIds]);

  return {
    nodeContextMenu,
    nodeMenuId,
    closeNodeContextMenu,
    handleNodeAction,
    handleObjectListAction,
    handleNodeMenuIdChange,
    handleNodeContextMenu,
  };
};

export default useCanvasNodeMenu;
