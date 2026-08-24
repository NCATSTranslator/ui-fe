import { FC, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './CanvasPane.module.scss';
import useCanvasPane from '@/features/Canvas/hooks/useCanvasPane';
import useCanvas from '@/features/Canvas/hooks/useCanvas';
import useCanvasPersistence from '@/features/Canvas/hooks/useCanvasPersistence';
import useCanvasFilters from '@/features/Canvas/hooks/useCanvasFilters';
import useCanvasHoverState from '@/features/Canvas/hooks/useCanvasHoverState';
import useCanvasGraphHover from '@/features/Canvas/hooks/useCanvasGraphHover';
import useCanvasEntityNavigation from '@/features/Canvas/hooks/useCanvasEntityNavigation';
import useCanvasNodeActions from '@/features/Canvas/hooks/useCanvasNodeActions';
import useCanvasPaneHandlers from '@/features/Canvas/hooks/useCanvasPaneHandlers';
import useCanvasNodeMenu from '@/features/Canvas/hooks/useCanvasNodeMenu';
import useCanvasAnnotations from '@/features/Canvas/hooks/useCanvasAnnotations';
import useCanvasFocus from '@/features/Canvas/hooks/useCanvasFocus';
import { useCanvasEntityDrop } from '@/features/Canvas/hooks/useCanvasEntityDrop';
import { useUser } from '@/features/UserAuth/utils/userApi';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import CanvasGraph from '@/features/Canvas/components/CanvasGraph/CanvasGraph';
import CanvasObjectList from '@/features/Canvas/components/CanvasObjectList/CanvasObjectList';
import CanvasNodeContextMenu from '@/features/Canvas/components/CanvasNodeContextMenu/CanvasNodeContextMenu';
import { CanvasNodeChromeActionsContext } from '@/features/Canvas/components/CanvasNodeChrome/CanvasNodeChrome';
import GraphHoverTooltips from '@/features/ResultGraphView/components/GraphHoverTooltips/GraphHoverTooltips';
import useCanvasNodePositions from '@/features/Canvas/hooks/useCanvasNodePositions';
import useCreateCanvas from '@/features/Canvas/hooks/useCreateCanvas';
import { DroppableArea } from '@/features/DragAndDrop/components/DroppableArea/DroppableArea';
import { isResultEntityDragType } from '@/features/DragAndDrop/types/types';
import { useNavigate } from 'react-router-dom';
import type { CanvasAnnotationAction } from '@/features/Canvas/constants/canvasAnnotationActions';
import { getQueryActionsForNodeCategory, homeQueryTabOptionsFromConfig } from '@/features/Query/utils/homeQueryParams';
import { getCanvasNodePrimaryCategory } from '@/features/Canvas/utils/canvasFunctions';
import type { Canvas, CanvasAnnotation } from '@/features/Canvas/types/canvas';
import { currentConfig } from '@/features/UserAuth/slices/userSlice';
import { useSelector } from 'react-redux';

type User = ReturnType<typeof useUser>[0];

const useCloseCanvasOnLogout = (user: User, paneOpen: boolean, closePane: () => void) => {
  const prevUserRef = useRef(user);
  useEffect(() => {
    if (prevUserRef.current && !user && paneOpen) {
      closePane();
    }
    prevUserRef.current = user;
  }, [user, paneOpen, closePane]);
};

interface CanvasPaneContentProps {
  activeCanvas: Canvas;
  paneOpen: boolean;
  paneMaximized: boolean;
  togglePane: () => void;
  paneClass: string;
}

type CanvasPaneGraphModel = {
  visibleNodes: ReturnType<typeof useCanvasFilters>['visibleNodes'];
  visibleEdges: ReturnType<typeof useCanvasFilters>['visibleEdges'];
  positions: ReturnType<typeof useCanvasNodePositions>;
  paneHandlers: ReturnType<typeof useCanvasPaneHandlers>;
  graphHover: ReturnType<typeof useCanvasGraphHover>;
  saveStatus: ReturnType<typeof useCanvasPersistence>['saveStatus'];
  graphAnnotations: ReturnType<typeof useCanvasAnnotations>['graphAnnotations'];
  handleAnnotationsChange: ReturnType<typeof useCanvasAnnotations>['handleAnnotationsChange'];
  handleAddAnnotation: () => void;
};

type CanvasPaneHoverModel = {
  hoveredNodeId: ReturnType<typeof useCanvasHoverState>['hoveredNodeId'];
  hoveredEdgeId: ReturnType<typeof useCanvasHoverState>['hoveredEdgeId'];
  hoveredAnnotationId: ReturnType<typeof useCanvasHoverState>['hoveredAnnotationId'];
  selectedNodeIds: ReturnType<typeof useCanvasFocus>['selectedNodeIds'];
  focusRequest: ReturnType<typeof useCanvasFocus>['focusRequest'];
  setHoveredNodeId: ReturnType<typeof useCanvasHoverState>['setHoveredNodeId'];
  setHoveredAnnotationId: ReturnType<typeof useCanvasHoverState>['setHoveredAnnotationId'];
  findNodeOnCanvas: ReturnType<typeof useCanvasFocus>['findNodeOnCanvas'];
  findAnnotationOnCanvas: ReturnType<typeof useCanvasFocus>['findAnnotationOnCanvas'];
};

type CanvasPaneMenuModel = {
  queryActions: ReturnType<typeof getQueryActionsForNodeCategory>;
  chromeActions: {
    onQueryMenu: ReturnType<typeof useCanvasNodeMenu>['handleQueryMenu'];
    isQueryMenuAvailable: (nodeId: string) => boolean;
  };
  nodeMenu: ReturnType<typeof useCanvasNodeMenu>;
  handleAnnotationListAction: (action: CanvasAnnotationAction, annotation: CanvasAnnotation) => void;
};

type CanvasPaneHistoryModel = {
  rename: ReturnType<typeof useCanvas>['rename'];
  undo: ReturnType<typeof useCanvas>['undo'];
  redo: ReturnType<typeof useCanvas>['redo'];
  canUndo: boolean;
  canRedo: boolean;
};

interface CanvasPaneOpenContentProps {
  activeCanvas: Canvas;
  paneOpen: boolean;
  paneMaximized: boolean;
  graph: CanvasPaneGraphModel;
  hover: CanvasPaneHoverModel;
  menus: CanvasPaneMenuModel;
  history: CanvasPaneHistoryModel;
}

const CanvasPaneOpenContent: FC<CanvasPaneOpenContentProps> = ({
  activeCanvas,
  paneOpen,
  paneMaximized,
  graph,
  hover,
  menus,
  history,
}) => (
  <CanvasNodeChromeActionsContext.Provider value={menus.chromeActions}>
    <div className={styles.contentArea}>
      <div
        className={styles.graphHoverContainer}
        onMouseMove={graph.graphHover.onContainerMouseMove}
      >
        <CanvasGraph
          canvas={activeCanvas}
          visibleNodes={graph.visibleNodes}
          visibleEdges={graph.visibleEdges}
          graphLayout={graph.positions.graphLayout}
          nodePositions={graph.positions.nodePositions}
          isCustomLayoutReady={graph.positions.isCustomLayoutReady}
          viewportSyncKey={`${activeCanvas.id}:${paneOpen}:${paneMaximized}:${graph.positions.isCustomLayoutReady}`}
          layoutWarningOpen={graph.positions.layoutWarningOpen}
          onLayoutChange={graph.positions.requestLayoutChange}
          onGraphNodeDragStop={graph.positions.handleGraphNodeDragStop}
          onLayoutComplete={graph.positions.handleLayoutComplete}
          onConfirmLayoutChange={graph.positions.confirmLayoutChange}
          onCancelLayoutChange={graph.positions.cancelLayoutChange}
          onRename={history.rename}
          onUndo={history.undo}
          onRedo={history.redo}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onNodeClick={graph.paneHandlers.handleNodeClick}
          onEdgeClick={graph.paneHandlers.handleEdgeClick}
          onNodeHover={graph.paneHandlers.handleCombinedNodeHover}
          onEdgeHover={graph.paneHandlers.handleCombinedEdgeHover}
          onAnnotationHover={graph.paneHandlers.handleCombinedAnnotationHover}
          onNodeContextMenu={menus.nodeMenu.handleNodeContextMenu}
          saveStatus={graph.saveStatus}
          hoveredNodeId={hover.hoveredNodeId}
          hoveredEdgeId={hover.hoveredEdgeId}
          hoveredAnnotationId={hover.hoveredAnnotationId}
          selectedIds={hover.selectedNodeIds}
          focusRequest={hover.focusRequest}
          annotations={graph.graphAnnotations}
          onAnnotationsChange={graph.handleAnnotationsChange}
          onAddAnnotation={graph.handleAddAnnotation}
          toolbarRight={(
            <CanvasObjectList
              canvas={activeCanvas}
              visibleNodes={graph.visibleNodes}
              onHoverNode={hover.setHoveredNodeId}
              onHoverAnnotation={hover.setHoveredAnnotationId}
              onFindNode={hover.findNodeOnCanvas}
              onFindAnnotation={hover.findAnnotationOnCanvas}
              onAnnotationAction={menus.handleAnnotationListAction}
              onNodeMenu={menus.nodeMenu.handleObjectListNodeMenu}
              onCloseNodeMenus={menus.nodeMenu.closeAllMenus}
              onAddAnnotation={graph.handleAddAnnotation}
            />
          )}
        >
          <GraphHoverTooltips
            onPredicateClick={graph.graphHover.onPredicateClick}
            target={graph.graphHover.visible}
            cursor={graph.graphHover.cursor}
            resultSet={graph.graphHover.resultSet ?? undefined}
            onTooltipEnter={graph.graphHover.onTooltipEnter}
            onTooltipLeave={graph.graphHover.onTooltipLeave}
          />
        </CanvasGraph>
      </div>
      {menus.nodeMenu.nodeContextMenu && (
        <CanvasNodeContextMenu
          target={menus.nodeMenu.nodeContextMenu}
          actions={menus.nodeMenu.nodeContextMenuActions}
          onClose={menus.nodeMenu.closeNodeContextMenu}
          onAction={menus.nodeMenu.handleNodeAction}
        />
      )}
      {menus.nodeMenu.nodeQueryMenu && menus.queryActions.length > 0 && (
        <CanvasNodeContextMenu
          target={menus.nodeMenu.nodeQueryMenu}
          actions={menus.queryActions}
          onClose={menus.nodeMenu.closeQueryMenu}
          onAction={menus.nodeMenu.handleQueryAction}
        />
      )}
    </div>
  </CanvasNodeChromeActionsContext.Provider>
);

const CanvasPaneContent: FC<CanvasPaneContentProps> = ({
  activeCanvas,
  paneOpen,
  paneMaximized,
  togglePane,
  paneClass,
}) => {
  const navigate = useNavigate();
  const config = useSelector(currentConfig);
  const persistence = useCanvasPersistence();
  const {
    rename, undo, redo, canUndo, canRedo, removeNode, pushUndo,
  } = useCanvas(persistence);
  const { visibleNodes, visibleEdges } = useCanvasFilters(activeCanvas);
  const {
    hoveredNodeId,
    hoveredEdgeId,
    hoveredAnnotationId,
    setHoveredNodeId,
    setHoveredAnnotationId,
    clearHover,
    handleNodeHover,
    handleEdgeHover,
    handleAnnotationHover,
  } = useCanvasHoverState();
  const { navigateToNode, navigateToEdge } = useCanvasEntityNavigation();
  const {
    selectedNodeIds,
    setSelectedNodeIds,
    focusRequest,
    findNodeOnCanvas,
    findAnnotationOnCanvas,
  } = useCanvasFocus(setHoveredNodeId, setHoveredAnnotationId);

  const {
    graphAnnotations,
    handleAnnotationsChange,
    addAnnotation,
    removeAnnotation,
  } = useCanvasAnnotations({
    activeCanvas,
    pushUndo,
    saveCreateAnnotation: persistence.saveCreateAnnotation,
    saveUpdateAnnotationText: persistence.saveUpdateAnnotationText,
    saveGeometry: persistence.saveGeometry,
    saveTrashElements: persistence.saveTrashElements,
  });

  const handleAddAnnotation = useCallback(async () => {
    const annotationId = await addAnnotation();
    if (annotationId) findAnnotationOnCanvas(annotationId);
  }, [addAnnotation, findAnnotationOnCanvas]);

  const handleAnnotationListAction = useCallback((
    action: CanvasAnnotationAction,
    annotation: CanvasAnnotation,
  ) => {
    if (action === 'find') findAnnotationOnCanvas(annotation.id);
    if (action === 'remove') removeAnnotation(annotation.id);
  }, [findAnnotationOnCanvas, removeAnnotation]);

  const nodeActions = useCanvasNodeActions({
    activeCanvas,
    navigateToNode,
    navigate,
    setSelectedNodeIds,
    clearHover,
    removeNode,
  });
  const graphHover = useCanvasGraphHover({ canvas: activeCanvas, navigateToEdge });
  const paneHandlers = useCanvasPaneHandlers({
    activeCanvas,
    navigateToEdge,
    handleNodeHover,
    handleEdgeHover,
    handleAnnotationHover,
    handleGraphNodeHover: graphHover.handleGraphNodeHover,
    handleGraphEdgeHover: graphHover.handleGraphEdgeHover,
    nodeActions,
  });
  const nodeMenu = useCanvasNodeMenu({
    activeCanvas,
    nodeActions,
    setSelectedNodeIds,
    findNodeOnCanvas,
  });
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
      nodeMenu.handleQueryMenu(nodeId, position);
    },
    [isQueryMenuAvailable, nodeMenu.handleQueryMenu],
  );
  const positions = useCanvasNodePositions({
    canvas: activeCanvas,
    pushUndo,
    saveGeometry: persistence.saveGeometry,
    saveLayout: persistence.saveLayout,
  });
  const handleEntityDrop = useCanvasEntityDrop(activeCanvas);
  const chromeActions = useMemo(
    () => ({ onQueryMenu: handleQueryMenu, isQueryMenuAvailable }),
    [handleQueryMenu, isQueryMenuAvailable],
  );

  return (
    <DroppableArea
      id={`canvas-zone-${activeCanvas.id}`}
      className={paneClass}
      canAccept={(draggedData) => isResultEntityDragType(draggedData.type)}
      data={{
        type: 'canvas',
        id: String(activeCanvas.id),
        onDrop: handleEntityDrop,
      }}
      indicatorClass={styles.indicatorClass}
      indicatorText={`Add to ${activeCanvas.label}`}
    >
      <div className={styles.collapsedTitle}>
        <button
          type="button"
          className={styles.titleLeft}
          onClick={togglePane}
          aria-label="Expand canvas"
          aria-expanded={paneOpen}
        >
          <span className={styles.canvasTitle}>{activeCanvas.label}</span>
        </button>
      </div>
      {paneOpen && (
        <CanvasPaneOpenContent
          activeCanvas={activeCanvas}
          paneOpen={paneOpen}
          paneMaximized={paneMaximized}
          graph={{
            visibleNodes,
            visibleEdges,
            positions,
            paneHandlers,
            graphHover,
            saveStatus: persistence.saveStatus,
            graphAnnotations,
            handleAnnotationsChange,
            handleAddAnnotation,
          }}
          hover={{
            hoveredNodeId,
            hoveredEdgeId,
            hoveredAnnotationId,
            selectedNodeIds,
            focusRequest,
            setHoveredNodeId,
            setHoveredAnnotationId,
            findNodeOnCanvas,
            findAnnotationOnCanvas,
          }}
          menus={{
            queryActions,
            chromeActions,
            nodeMenu,
            handleAnnotationListAction,
          }}
          history={{ rename, undo, redo, canUndo, canRedo }}
        />
      )}
    </DroppableArea>
  );
};

const CanvasPane: FC = () => {
  const [user] = useUser();
  const { paneOpen, paneMaximized, activeCanvas, togglePane, closePane } = useCanvasPane();
  const { createCanvas } = useCreateCanvas();

  useCloseCanvasOnLogout(user, paneOpen, closePane);

  const paneClass = joinClasses(
    styles.canvasPane,
    !paneOpen && styles.collapsed,
    paneOpen && !paneMaximized && styles.expanded,
    paneOpen && paneMaximized && styles.maximized,
  );

  if (!activeCanvas) {
    return (
      <div className={paneClass}>
        <div className={styles.collapsedTitle}>
          <button
            type="button"
            className={styles.titleLeft}
            onClick={createCanvas}
            aria-label="Create new canvas"
          >
            <span className={styles.canvasTitle}>Create New Canvas</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <CanvasPaneContent
      key={activeCanvas.id}
      activeCanvas={activeCanvas}
      paneOpen={paneOpen}
      paneMaximized={paneMaximized}
      togglePane={togglePane}
      paneClass={paneClass}
    />
  );
};

export default CanvasPane;
