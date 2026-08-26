import { FC, useEffect, useRef } from 'react';
import styles from './CanvasPane.module.scss';
import useCanvasPane from '@/features/Canvas/hooks/useCanvasPane';
import { useCanvasPaneGraphModel } from '@/features/Canvas/hooks/useCanvasPaneGraphModel';
import { useCanvasPaneMenusModel } from '@/features/Canvas/hooks/useCanvasPaneMenusModel';
import { useCanvasEntityDrop } from '@/features/Canvas/hooks/useCanvasEntityDrop';
import { useUser } from '@/features/UserAuth/utils/userApi';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import CanvasGraph from '@/features/Canvas/components/CanvasGraph/CanvasGraph';
import CanvasObjectList from '@/features/Canvas/components/CanvasObjectList/CanvasObjectList';
import CanvasNodeContextMenu from '@/features/Canvas/components/CanvasNodeContextMenu/CanvasNodeContextMenu';
import { CanvasNodeChromeActionsContext } from '@/features/Canvas/components/CanvasNodeChrome/CanvasNodeChrome';
import GraphHoverTooltips from '@/features/ResultGraphView/components/GraphHoverTooltips/GraphHoverTooltips';
import useCreateCanvas from '@/features/Canvas/hooks/useCreateCanvas';
import { DroppableArea } from '@/features/DragAndDrop/components/DroppableArea/DroppableArea';
import { isResultEntityDragType } from '@/features/DragAndDrop/types/types';
import type { Canvas } from '@/features/Canvas/types/canvas';

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

type GraphModel = ReturnType<typeof useCanvasPaneGraphModel>;
type MenusModel = ReturnType<typeof useCanvasPaneMenusModel>;

interface CanvasPaneOpenContentProps {
  activeCanvas: Canvas;
  paneOpen: boolean;
  paneMaximized: boolean;
  graph: GraphModel['graph'];
  hover: GraphModel['hover'];
  menus: MenusModel;
  history: GraphModel['history'];
  onAnnotationAction: GraphModel['handleAnnotationListAction'];
}

const CanvasPaneOpenContent: FC<CanvasPaneOpenContentProps> = ({
  activeCanvas,
  paneOpen,
  paneMaximized,
  graph,
  hover,
  menus,
  history,
  onAnnotationAction,
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
              onAnnotationAction={onAnnotationAction}
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
  const graphModel = useCanvasPaneGraphModel(activeCanvas);
  const menus = useCanvasPaneMenusModel({
    activeCanvas,
    nodeActions: graphModel.nodeActions,
    setSelectedNodeIds: graphModel.setSelectedNodeIds,
    findNodeOnCanvas: graphModel.findNodeOnCanvas,
  });
  const handleEntityDrop = useCanvasEntityDrop(activeCanvas);

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
          graph={graphModel.graph}
          hover={graphModel.hover}
          menus={menus}
          history={graphModel.history}
          onAnnotationAction={graphModel.handleAnnotationListAction}
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
      user ? (
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
      ) : null
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
