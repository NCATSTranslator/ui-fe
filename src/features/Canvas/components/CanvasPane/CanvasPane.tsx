import { FC, useEffect, useRef, useCallback } from 'react';
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
import { useUser } from '@/features/UserAuth/utils/userApi';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import CanvasGraph from '@/features/Canvas/components/CanvasGraph/CanvasGraph';
import CanvasObjectList from '@/features/Canvas/components/CanvasObjectList/CanvasObjectList';
import CanvasNodeContextMenu from '@/features/Canvas/components/CanvasNodeContextMenu/CanvasNodeContextMenu';
import GraphHoverTooltips from '@/features/ResultGraphView/components/GraphHoverTooltips/GraphHoverTooltips';
import useCanvasNodePositions from '@/features/Canvas/hooks/useCanvasNodePositions';
import useCreateCanvas from '@/features/Canvas/hooks/useCreateCanvas';
import { useNavigate } from 'react-router-dom';
import type { CanvasAnnotationAction } from '@/features/Canvas/constants/canvasAnnotationActions';
import type { Canvas, CanvasAnnotation } from '@/features/Canvas/types/canvas';

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

const CanvasPaneContent: FC<CanvasPaneContentProps> = ({
  activeCanvas,
  paneOpen,
  paneMaximized,
  togglePane,
  paneClass,
}) => {
  const navigate = useNavigate();
  const persistence = useCanvasPersistence();
  const {
    rename, undo, redo, canUndo, canRedo, removeNode, pushUndo,
  } = useCanvas(persistence);
  const { visibleNodes, visibleEdges } = useCanvasFilters(activeCanvas);
  const { hoveredNodeId, setHoveredNodeId, clearHover, handleNodeHover } = useCanvasHoverState();
  const { navigateToNode, navigateToEdge } = useCanvasEntityNavigation();
  const {
    selectedNodeIds,
    setSelectedNodeIds,
    focusRequest,
    findNodeOnCanvas,
    findAnnotationOnCanvas,
  } = useCanvasFocus(setHoveredNodeId);

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
    setHoveredNodeId,
    handleNodeHover,
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
  const positions = useCanvasNodePositions({
    canvas: activeCanvas,
    pushUndo,
    saveGeometry: persistence.saveGeometry,
    saveLayout: persistence.saveLayout,
  });

  return (
    <div className={paneClass}>
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
        <div className={styles.contentArea}>
          <div
            className={styles.graphHoverContainer}
            onMouseMove={graphHover.onContainerMouseMove}
          >
            <CanvasGraph
              canvas={activeCanvas}
              visibleNodes={visibleNodes}
              visibleEdges={visibleEdges}
              graphLayout={positions.graphLayout}
              nodePositions={positions.nodePositions}
              isCustomLayoutReady={positions.isCustomLayoutReady}
              viewportSyncKey={`${activeCanvas.id}:${paneOpen}:${paneMaximized}:${positions.isCustomLayoutReady}`}
              layoutWarningOpen={positions.layoutWarningOpen}
              onLayoutChange={positions.requestLayoutChange}
              onGraphNodeDragStop={positions.handleGraphNodeDragStop}
              onLayoutComplete={positions.handleLayoutComplete}
              onConfirmLayoutChange={positions.confirmLayoutChange}
              onCancelLayoutChange={positions.cancelLayoutChange}
              onRename={rename}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              onNodeClick={paneHandlers.handleNodeClick}
              onEdgeClick={paneHandlers.handleEdgeClick}
              onNodeHover={paneHandlers.handleCombinedNodeHover}
              onEdgeHover={paneHandlers.handleCombinedEdgeHover}
              onNodeContextMenu={nodeMenu.handleNodeContextMenu}
              saveStatus={persistence.saveStatus}
              hoveredNodeId={hoveredNodeId}
              selectedIds={selectedNodeIds}
              focusRequest={focusRequest}
              annotations={graphAnnotations}
              onAnnotationsChange={handleAnnotationsChange}
              onAddAnnotation={handleAddAnnotation}
              toolbarRight={(
                <CanvasObjectList
                  canvas={activeCanvas}
                  visibleNodes={visibleNodes}
                  onHoverNode={setHoveredNodeId}
                  onFindNode={findNodeOnCanvas}
                  onAction={nodeMenu.handleObjectListAction}
                  onAnnotationAction={handleAnnotationListAction}
                  nodeMenuId={nodeMenu.nodeMenuId}
                  onNodeMenuIdChange={nodeMenu.handleNodeMenuIdChange}
                  onAddAnnotation={handleAddAnnotation}
                />
              )}
            >
              <GraphHoverTooltips
                onPredicateClick={graphHover.onPredicateClick}
                target={graphHover.visible}
                cursor={graphHover.cursor}
                resultSet={graphHover.resultSet ?? undefined}
                onTooltipEnter={graphHover.onTooltipEnter}
                onTooltipLeave={graphHover.onTooltipLeave}
              />
            </CanvasGraph>
          </div>
          {nodeMenu.nodeContextMenu && (
            <CanvasNodeContextMenu
              target={nodeMenu.nodeContextMenu}
              onClose={nodeMenu.closeNodeContextMenu}
              onAction={nodeMenu.handleNodeAction}
            />
          )}
        </div>
      )}
    </div>
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
      activeCanvas={activeCanvas}
      paneOpen={paneOpen}
      paneMaximized={paneMaximized}
      togglePane={togglePane}
      paneClass={paneClass}
    />
  );
};

export default CanvasPane;
