import { useState, useCallback } from 'react';
import {
  CONTEXT_MENU_NODE_ACTIONS,
  OBJECT_LIST_NODE_ACTIONS,
  type CanvasNodeAction,
} from '@/features/Canvas/constants/canvasNodeActions';
import type { Canvas } from '@/features/Canvas/types/canvas';
import type {
  CanvasNodeContextMenuTarget,
  CanvasNodeMenuSource,
} from '@/features/Canvas/components/CanvasNodeContextMenu/CanvasNodeContextMenu';
import type { HomeQueryTab } from '@/features/Query/utils/homeQueryParams';

type NodeMenuKind = 'actions' | 'query';

interface UseCanvasNodeMenuOptions {
  activeCanvas: Canvas | null;
  nodeActions: {
    handleInformation: (nodeId: string) => void;
    navigateToHomeQuery: (kind: HomeQueryTab, nodeId: string) => void;
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
  const { handleInformation, handleRemove, navigateToHomeQuery } = nodeActions;
  const [nodeContextMenu, setNodeContextMenu] = useState<CanvasNodeContextMenuTarget | null>(null);
  const [nodeQueryMenu, setNodeQueryMenu] = useState<CanvasNodeContextMenuTarget | null>(null);

  const closeNodeContextMenu = useCallback(() => setNodeContextMenu(null), []);
  const closeQueryMenu = useCallback(() => setNodeQueryMenu(null), []);
  const closeAllMenus = useCallback(() => {
    setNodeContextMenu(null);
    setNodeQueryMenu(null);
  }, []);

  const handleNodeAction = useCallback((action: CanvasNodeAction, nodeId: string) => {
    closeAllMenus();

    switch (action) {
      case 'information':
        handleInformation(nodeId);
        break;
      case 'find':
        findNodeOnCanvas(nodeId);
        break;
      case 'remove':
        handleRemove(nodeId);
        break;
    }
  }, [handleInformation, handleRemove, findNodeOnCanvas, closeAllMenus]);

  const openMenu = useCallback((
    nodeId: string,
    position: { x: number; y: number },
    kind: NodeMenuKind,
    source?: CanvasNodeMenuSource,
  ) => {
    if (!activeCanvas?.nodes[nodeId]) return;
    setSelectedNodeIds([nodeId]);
    if (kind === 'query') {
      setNodeContextMenu(null);
      setNodeQueryMenu({ nodeId, position });
      return;
    }
    setNodeQueryMenu(null);
    setNodeContextMenu({ nodeId, position, source });
  }, [activeCanvas, setSelectedNodeIds]);

  const handleNodeContextMenu = useCallback((nodeId: string, position: { x: number; y: number }) => {
    openMenu(nodeId, position, 'actions', 'contextMenu');
  }, [openMenu]);

  const handleObjectListNodeMenu = useCallback((nodeId: string, position: { x: number; y: number }) => {
    openMenu(nodeId, position, 'actions', 'objectList');
  }, [openMenu]);

  const handleQueryMenu = useCallback((nodeId: string, position: { x: number; y: number }) => {
    openMenu(nodeId, position, 'query');
  }, [openMenu]);

  const handleQueryAction = useCallback((action: HomeQueryTab, nodeId: string) => {
    closeAllMenus();
    navigateToHomeQuery(action, nodeId);
  }, [closeAllMenus, navigateToHomeQuery]);

  return {
    nodeContextMenu,
    nodeContextMenuActions: nodeContextMenu?.source === 'objectList'
      ? OBJECT_LIST_NODE_ACTIONS
      : CONTEXT_MENU_NODE_ACTIONS,
    nodeQueryMenu,
    closeNodeContextMenu,
    closeQueryMenu,
    closeAllMenus,
    handleNodeAction,
    handleQueryAction,
    handleNodeContextMenu,
    handleObjectListNodeMenu,
    handleQueryMenu,
  };
};

export default useCanvasNodeMenu;
