import { FC, useEffect, useRef, useState, useCallback } from 'react';
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
import { useUser } from '@/features/UserAuth/utils/userApi';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import CanvasGraph from '@/features/Canvas/components/CanvasGraph/CanvasGraph';
import CanvasObjectList from '@/features/Canvas/components/CanvasObjectList/CanvasObjectList';
import CanvasNodeContextMenu from '@/features/Canvas/components/CanvasNodeContextMenu/CanvasNodeContextMenu';
import GraphHoverTooltips from '@/features/ResultGraphView/components/GraphHoverTooltips/GraphHoverTooltips';
import useCanvasNodePositions from '@/features/Canvas/hooks/useCanvasNodePositions';
import useCreateCanvas from '@/features/Canvas/hooks/useCreateCanvas';
import { useNavigate } from 'react-router-dom';
import type { GraphFocusRequest } from 'translator-graph-view';
import type { CanvasAnnotationAction } from '@/features/Canvas/constants/canvasAnnotationActions';
import type { CanvasAnnotation } from '@/features/Canvas/types/canvas';

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

const CanvasPane: FC = () => {
  const navigate = useNavigate();
  const [user] = useUser();
  const { paneOpen, paneMaximized, activeCanvas, togglePane, closePane } = useCanvasPane();
  const {
    saveStatus,
    saveMerge,
    saveTrashElements,
    saveRename,
    saveGeometry,
    saveLayout,
    saveCreateAnnotation,
    saveUpdateAnnotationText,
  } = useCanvasPersistence();
  const { rename, undo, redo, canUndo, canRedo, removeNode, pushUndo } = useCanvas({ saveMerge, saveTrashElements, saveRename });
  const { visibleNodes, visibleEdges } = useCanvasFilters(activeCanvas);
  const { hoveredNodeId, setHoveredNodeId, clearHover, handleNodeHover } = useCanvasHoverState();
  const { navigateToNode, navigateToEdge } = useCanvasEntityNavigation();
  const { createCanvas } = useCreateCanvas();
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [focusRequest, setFocusRequest] = useState<GraphFocusRequest | null>(null);
  const focusTokenRef = useRef(0);

  const focusOnCanvas = useCallback((elementId: string) => {
    focusTokenRef.current += 1;
    setFocusRequest({ nodeId: elementId, token: focusTokenRef.current });
  }, []);

  const findNodeOnCanvas = useCallback((nodeId: string) => {
    setSelectedNodeIds([nodeId]);
    setHoveredNodeId(nodeId);
    focusOnCanvas(nodeId);
  }, [setHoveredNodeId, focusOnCanvas]);

  const findAnnotationOnCanvas = useCallback((annotationId: string) => {
    setSelectedNodeIds([]);
    focusOnCanvas(annotationId);
  }, [focusOnCanvas]);

  const {
    graphAnnotations,
    handleAnnotationsChange,
    addAnnotation,
    removeAnnotation,
  } = useCanvasAnnotations({
    activeCanvas,
    pushUndo,
    saveCreateAnnotation,
    saveUpdateAnnotationText,
    saveGeometry,
    saveTrashElements,
  });

  const handleAddAnnotation = useCallback(async () => {
    const annotationId = await addAnnotation();
    if (annotationId) {
      findAnnotationOnCanvas(annotationId);
    }
  }, [addAnnotation, findAnnotationOnCanvas]);

  const handleAnnotationListAction = useCallback((
    action: CanvasAnnotationAction,
    annotation: CanvasAnnotation,
  ) => {
    switch (action) {
      case 'find':
        findAnnotationOnCanvas(annotation.id);
        break;
      case 'remove':
        removeAnnotation(annotation.id);
        break;
    }
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

  const {
    handleCombinedNodeHover,
    handleCombinedEdgeHover,
    handleNodeClick,
    handleEdgeClick,
  } = useCanvasPaneHandlers({
    activeCanvas,
    navigateToEdge,
    setHoveredNodeId,
    handleNodeHover,
    handleGraphNodeHover: graphHover.handleGraphNodeHover,
    handleGraphEdgeHover: graphHover.handleGraphEdgeHover,
    nodeActions,
  });

  const {
    nodeContextMenu,
    nodeMenuId,
    closeNodeContextMenu,
    handleNodeAction,
    handleObjectListAction,
    handleNodeMenuIdChange,
    handleNodeContextMenu,
  } = useCanvasNodeMenu({
    activeCanvas,
    nodeActions,
    setSelectedNodeIds,
    findNodeOnCanvas,
  });

  const {
    graphLayout,
    nodePositions,
    isCustomLayoutReady,
    layoutWarningOpen,
    handleGraphNodeDragStop,
    handleLayoutComplete,
    requestLayoutChange,
    confirmLayoutChange,
    cancelLayoutChange,
  } = useCanvasNodePositions({
    canvas: activeCanvas,
    saveGeometry,
    saveLayout,
  });

  useCloseCanvasOnLogout(user, paneOpen, closePane);

  const paneClass = joinClasses(
    styles.canvasPane,
    !paneOpen && styles.collapsed,
    paneOpen && !paneMaximized && styles.expanded,
    paneOpen && paneMaximized && styles.maximized,
  );

  if (!activeCanvas) return (
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
              graphLayout={graphLayout}
              nodePositions={nodePositions}
              isCustomLayoutReady={isCustomLayoutReady}
              viewportSyncKey={`${activeCanvas.id}:${paneOpen}:${paneMaximized}:${isCustomLayoutReady}`}
              layoutWarningOpen={layoutWarningOpen}
              onLayoutChange={requestLayoutChange}
              onGraphNodeDragStop={handleGraphNodeDragStop}
              onLayoutComplete={handleLayoutComplete}
              onConfirmLayoutChange={confirmLayoutChange}
              onCancelLayoutChange={cancelLayoutChange}
              onRename={rename}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onNodeHover={handleCombinedNodeHover}
              onEdgeHover={handleCombinedEdgeHover}
              onNodeContextMenu={handleNodeContextMenu}
              saveStatus={saveStatus}
              hoveredNodeId={hoveredNodeId}
              selectedIds={selectedNodeIds}
              focusRequest={focusRequest}
              annotations={graphAnnotations}
              onAnnotationsChange={handleAnnotationsChange}
              onAddAnnotation={handleAddAnnotation}
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
          <CanvasObjectList
            canvas={activeCanvas}
            visibleNodes={visibleNodes}
            onHoverNode={setHoveredNodeId}
            onFindNode={findNodeOnCanvas}
            onAction={handleObjectListAction}
            onAnnotationAction={handleAnnotationListAction}
            nodeMenuId={nodeMenuId}
            onNodeMenuIdChange={handleNodeMenuIdChange}
            onAddAnnotation={handleAddAnnotation}
          />
          {nodeContextMenu && (
            <CanvasNodeContextMenu
              target={nodeContextMenu}
              onClose={closeNodeContextMenu}
              onAction={handleNodeAction}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default CanvasPane;
