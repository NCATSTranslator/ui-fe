import { FC, RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import styles from './CanvasPane.module.scss';
import useCanvasPane from '@/features/Canvas/hooks/useCanvasPane';
import { useCanvasPaneAvailableHeight, useCanvasPaneResize } from '@/features/Canvas/hooks/useCanvasPaneResize';
import { useCanvasPaneGraphModel } from '@/features/Canvas/hooks/useCanvasPaneGraphModel';
import { useCanvasPaneMenusModel } from '@/features/Canvas/hooks/useCanvasPaneMenusModel';
import { useCanvasEntityDrop } from '@/features/Canvas/hooks/useCanvasEntityDrop';
import useCanvasKeyboardShortcuts from '@/features/Canvas/hooks/useCanvasKeyboardShortcuts';
import { useUser } from '@/features/UserAuth/utils/userApi';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import Button from '@/features/Core/components/Button/Button';
import CanvasGraph from '@/features/Canvas/components/CanvasGraph/CanvasGraph';
import CanvasObjectList from '@/features/Canvas/components/CanvasObjectList/CanvasObjectList';
import CanvasNodeContextMenu from '@/features/Canvas/components/CanvasNodeContextMenu/CanvasNodeContextMenu';
import CanvasSyncBanner from '@/features/Canvas/components/CanvasSync/CanvasSyncBanner';
import { CanvasNodeChromeActionsContext } from '@/features/Canvas/components/CanvasNodeChrome/CanvasNodeChrome';
import GraphHoverTooltips from '@/features/ResultGraphView/components/GraphHoverTooltips/GraphHoverTooltips';
import { CreateCanvasButton, CreateCanvasDropZone } from '@/features/Canvas/components/CreateCanvasDropZone/CreateCanvasDropZone';
import { DroppableArea } from '@/features/DragAndDrop/components/DroppableArea/DroppableArea';
import { isResultEntityDragData } from '@/features/DragAndDrop/types/types';
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

/** Whether the pane was open on the previous render; survives the keyed content remount. */
const usePaneWasOpen = (paneOpen: boolean): boolean => {
  const wasOpenRef = useRef(paneOpen);
  const wasOpen = wasOpenRef.current;
  useEffect(() => {
    wasOpenRef.current = paneOpen;
  }, [paneOpen]);
  return wasOpen;
};

/**
 * The content remounts per canvas, so a pane opened by creating a canvas or
 * picking one from the sidebar mounts already open and would skip the
 * pill-to-panel transition. Unless the pane was open before the mount, it
 * paints one collapsed frame first, resolves that style, then switches to
 * open so the CSS transition runs. Switching canvases while open stays instant.
 */
const usePaneOpenTransition = (
  paneOpen: boolean,
  wasOpen: boolean,
  paneRef: RefObject<HTMLDivElement | null>,
): boolean => {
  const [entered, setEntered] = useState(wasOpen);
  useLayoutEffect(() => {
    if (entered) return;
    // Reading layout forces the collapsed style to resolve, so the class
    // change that follows transitions instead of snapping.
    paneRef.current?.getBoundingClientRect();
    setEntered(true);
  }, [entered, paneRef]);
  return paneOpen && entered;
};

type PaneModel = ReturnType<typeof useCanvasPane>;

interface CanvasPaneContentProps {
  activeCanvas: Canvas;
  pane: PaneModel;
  /** True when the pane was already open before this content mounted. */
  wasOpen: boolean;
}

const getPaneClass = (isOpen: boolean, paneMaximized: boolean) => joinClasses(
  styles.canvasPane,
  !isOpen && styles.collapsed,
  isOpen && styles.open,
  isOpen && paneMaximized && styles.maximized,
);

type ResizeHandleProps = ReturnType<typeof useCanvasPaneResize>['handleProps'];

/** The pane's top edge: drag to resize, or focus it and use the arrow keys. */
const CanvasPaneResizeHandle: FC<ResizeHandleProps> = (handleProps) => (
  <div
    role="separator"
    aria-orientation="horizontal"
    aria-label="Resize canvas"
    tabIndex={0}
    className={styles.resizeHandle}
    {...handleProps}
  />
);

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
}) => {
  useCanvasKeyboardShortcuts({
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  });

  return (
    <CanvasNodeChromeActionsContext.Provider value={menus.chromeActions}>
      <div className={styles.contentArea}>
        <div className={styles.graphHoverContainer}>
          {graph.syncDeferred && <CanvasSyncBanner />}
          <CanvasGraph
            canvas={activeCanvas}
            visibleNodes={graph.visibleNodes}
            visibleEdges={graph.visibleEdges}
            graphLayout={graph.positions.graphLayout}
            nodePositions={graph.positions.nodePositions}
            isCustomLayoutReady={graph.positions.isCustomLayoutReady}
            viewportSyncKey={`${activeCanvas.id}:${paneOpen}:${paneMaximized}:${graph.positions.isCustomLayoutReady}`}
            onLayoutChange={graph.positions.requestLayoutChange}
            onGraphNodeDragStop={graph.positions.handleGraphNodeDragStop}
            onLayoutComplete={graph.positions.handleLayoutComplete}
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
            onSelectionDelete={graph.handleSelectionDelete}
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
};

const CanvasPaneContent: FC<CanvasPaneContentProps> = ({
  activeCanvas,
  pane,
  wasOpen,
}) => {
  const { paneOpen, paneMaximized, paneHeight, togglePane, setPaneHeight } = pane;
  const paneRef = useRef<HTMLDivElement>(null);
  const isOpen = usePaneOpenTransition(paneOpen, wasOpen, paneRef);
  const availableHeight = useCanvasPaneAvailableHeight();
  const { height, dragging, handleProps } = useCanvasPaneResize({
    active: paneOpen,
    paneMaximized,
    paneHeight,
    availableHeight,
    onCommit: setPaneHeight,
  });
  // Only set once open and measured: the class heights cover the collapsed
  // pill and the paint before measurement, and an inline height would
  // override the collapsed size the open transition starts from.
  const paneStyle = useMemo(() => (isOpen && height !== null ? { height } : undefined), [isOpen, height]);
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
      ref={paneRef}
      id={`canvas-zone-${activeCanvas.id}`}
      className={joinClasses(getPaneClass(isOpen, paneMaximized), dragging && styles.dragging)}
      style={paneStyle}
      canAccept={isResultEntityDragData}
      data={{
        type: 'canvas',
        id: String(activeCanvas.id),
        onDrop: handleEntityDrop,
      }}
      indicatorClass={styles.indicatorClass}
      indicatorText={`Add to ${activeCanvas.label}`}
    >
      <div className={styles.collapsedTitle}>
        <Button
          className={styles.collapsedButton}
          handleClick={togglePane}
          ariaLabel="Expand canvas"
          aria-expanded={paneOpen}
          title={activeCanvas.label}
        >
          {activeCanvas.label}
        </Button>
      </div>
      {paneOpen && <CanvasPaneResizeHandle {...handleProps} />}
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
  const pane = useCanvasPane();
  const { paneOpen, activeCanvas, closePane } = pane;

  useCloseCanvasOnLogout(user, paneOpen, closePane);
  const wasOpen = usePaneWasOpen(paneOpen);

  if (!activeCanvas) {
    // The whole pill is the drop target, matching the active-canvas pill, so a
    // release over its padding ring still creates the canvas.
    return (
      user ? (
        <CreateCanvasDropZone
          id="canvas-pane-create-zone"
          className={getPaneClass(false, false)}
          indicatorClass={styles.indicatorClass}
        >
          <div className={styles.collapsedTitle}>
            <CreateCanvasButton className={styles.collapsedButton} ariaLabel="Create new canvas" />
          </div>
        </CreateCanvasDropZone>
      ) : null
    );
  }

  return (
    <CanvasPaneContent
      key={activeCanvas.id}
      activeCanvas={activeCanvas}
      pane={pane}
      wasOpen={wasOpen}
    />
  );
};

export default CanvasPane;
