import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import useCanvasNodeMenu from '@/features/Canvas/hooks/useCanvasNodeMenu';
import type useCanvasNodeActions from '@/features/Canvas/hooks/useCanvasNodeActions';
import { getQueryActionsForNodeCategory, homeQueryTabOptionsFromConfig } from '@/features/Query/utils/homeQueryParams';
import { getCanvasNodePrimaryCategory } from '@/features/Canvas/utils/canvasFunctions';
import type { Canvas } from '@/features/Canvas/types/canvas';
import { currentConfig } from '@/features/UserAuth/slices/userSlice';

type NodeActions = ReturnType<typeof useCanvasNodeActions>;

interface UseCanvasPaneMenusModelOptions {
  activeCanvas: Canvas;
  nodeActions: NodeActions;
  setSelectedNodeIds: (ids: string[]) => void;
  findNodeOnCanvas: (nodeId: string) => void;
}

/** Node context/query menus and chrome query-menu availability. */
export const useCanvasPaneMenusModel = ({
  activeCanvas,
  nodeActions,
  setSelectedNodeIds,
  findNodeOnCanvas,
}: UseCanvasPaneMenusModelOptions) => {
  const config = useSelector(currentConfig);
  const nodeMenu = useCanvasNodeMenu({
    activeCanvas,
    nodeActions,
    setSelectedNodeIds,
    findNodeOnCanvas,
  });
  const { handleQueryMenu: openNodeQueryMenu } = nodeMenu;
  const homeQueryOptions = useMemo(
    () => homeQueryTabOptionsFromConfig(config),
    [config],
  );
  const getQueryActionsForNodeId = useCallback(
    (nodeId: string | undefined) => {
      const nodeCategory = nodeId
        ? getCanvasNodePrimaryCategory(activeCanvas.nodes[nodeId])
        : undefined;
      return getQueryActionsForNodeCategory(homeQueryOptions, nodeCategory);
    },
    [activeCanvas.nodes, homeQueryOptions],
  );
  const queryActions = useMemo(
    () => getQueryActionsForNodeId(nodeMenu.nodeQueryMenu?.nodeId),
    [getQueryActionsForNodeId, nodeMenu.nodeQueryMenu?.nodeId],
  );
  const isQueryMenuAvailable = useCallback(
    (nodeId: string) => getQueryActionsForNodeId(nodeId).length > 0,
    [getQueryActionsForNodeId],
  );
  const handleQueryMenu = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      if (!isQueryMenuAvailable(nodeId)) return;
      openNodeQueryMenu(nodeId, position);
    },
    [isQueryMenuAvailable, openNodeQueryMenu],
  );
  const chromeActions = useMemo(
    () => ({ onQueryMenu: handleQueryMenu, isQueryMenuAvailable }),
    [handleQueryMenu, isQueryMenuAvailable],
  );

  return {
    queryActions,
    chromeActions,
    nodeMenu,
  };
};
