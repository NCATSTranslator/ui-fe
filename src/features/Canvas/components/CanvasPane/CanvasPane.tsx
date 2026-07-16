import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CanvasPane.module.scss';
import useCanvasPane from '@/features/Canvas/hooks/useCanvasPane';
import useCanvas from '@/features/Canvas/hooks/useCanvas';
import useCanvasPersistence from '@/features/Canvas/hooks/useCanvasPersistence';
import useCanvasInspector from '@/features/Canvas/hooks/useCanvasInspector';
import useCanvasInspectorHandlers from '@/features/Canvas/hooks/useCanvasInspectorHandlers';
import useCanvasFilters from '@/features/Canvas/hooks/useCanvasFilters';
import useCanvasHoverState from '@/features/Canvas/hooks/useCanvasHoverState';
import useCanvasHoverActions from '@/features/Canvas/hooks/useCanvasHoverActions';
import { useUser } from '@/features/UserAuth/utils/userApi';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import CanvasGraph from '@/features/Canvas/components/CanvasGraph/CanvasGraph';
import CanvasObjectList from '@/features/Canvas/components/CanvasObjectList/CanvasObjectList';
import CanvasInspector from '@/features/Canvas/components/CanvasInspector/CanvasInspector';
import CanvasNodeHoverMenu from '@/features/Canvas/components/CanvasNodeHoverMenu/CanvasNodeHoverMenu';
import WarningModal from '@/features/Core/components/WarningModal/WarningModal';
import { formatBiolinkEntity } from '@/features/Core/utils/stringFormatters';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import type { GraphNodeType, GraphEdgeType } from 'translator-graph-view';
import useCreateCanvas from '@/features/Canvas/hooks/useCreateCanvas';

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
  const { saveStatus, saveMerge, saveTrashElements, saveRename } = useCanvasPersistence();
  const { rename, undo, redo, canUndo, canRedo, removeNode, isProcessing, ...canvasResultActions } = useCanvas({ saveMerge, saveTrashElements, saveRename });
  const inspector = useCanvasInspector();
  const { addToGraphHandlers, warningModalOpen, handleConfirmLargeAdd, cancelWarning, closeWarning, skipWarningKey } = useCanvasInspectorHandlers(canvasResultActions);
  const { visibleNodes, visibleEdges, inspectorFilters } = useCanvasFilters(activeCanvas);
  const {
    hoveredNodeId, setHoveredNodeId, nodeHover, edgeHover, clearHover,
    handleNodeHover, handleEdgeHover, handleMenuMouseEnter, handleMenuMouseLeave,
  } = useCanvasHoverState();
  const { createCanvas } = useCreateCanvas();
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const { handleHoverRemove, handleHoverNewQuery, handleHoverInformation } = useCanvasHoverActions({ activeCanvas, clearHover, removeNode, inspector, navigate, setSelectedNodeIds });
  useCloseCanvasOnLogout(user, paneOpen, closePane);

  const handleNodeClick = useCallback((node: GraphNodeType) => {
    const canvasNode = activeCanvas?.nodes[node.id];
    setSelectedNodeIds([node.id]);
    inspector.openView('node', canvasNode?.names[0] || node.id, node.id, {
      nodeId: node.id,
      queryPk: activeCanvas?.queryRef ?? undefined,
    });
  }, [activeCanvas, inspector]);

  const handleEdgeClick = useCallback((edge: GraphEdgeType) => {
    inspector.openView('evidence', edge.predicate || edge.id, edge.id, {
      queryPk: activeCanvas?.queryRef ?? '',
      edgeId: edge.id,
    });
  }, [activeCanvas, inspector]);

  const handleSelectNode = useCallback((nodeId: string) => {
    setSelectedNodeIds([nodeId]);
  }, []);

  const handleObjectListNewQuery = useCallback((node: { id: string; names: string[] }) => {
    const term = node.names[0] || node.id;
    navigate(term ? `/new-query?prefill=${encodeURIComponent(term)}` : '/new-query');
  }, [navigate]);

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
          <CanvasGraph
            canvas={activeCanvas}
            visibleNodes={visibleNodes}
            visibleEdges={visibleEdges}
            onRename={rename}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onNodeHover={handleNodeHover}
            onEdgeHover={handleEdgeHover}
            isProcessing={isProcessing}
            saveStatus={saveStatus}
            hoveredNodeId={hoveredNodeId}
            selectedIds={selectedNodeIds}
          >
            {nodeHover && (
              <CanvasNodeHoverMenu
                nodeId={nodeHover.nodeId}
                geometry={nodeHover.geometry}
                onRemove={handleHoverRemove}
                onNewQuery={handleHoverNewQuery}
                onInformation={handleHoverInformation}
                onMouseEnter={handleMenuMouseEnter}
                onMouseLeave={handleMenuMouseLeave}
              />
            )}
            <Tooltip
              id="canvas-edge-tooltip"
              isOpen={!!edgeHover}
              position={edgeHover?.geometry.anchor}
              place="top"
              delayShow={250}
              delayHide={100}
            >
              {edgeHover && activeCanvas.edges[edgeHover.edgeId] && (
                <span>{formatBiolinkEntity(activeCanvas.edges[edgeHover.edgeId].predicate)}</span>
              )}
            </Tooltip>
          </CanvasGraph>
          <CanvasObjectList
            canvas={activeCanvas}
            visibleNodes={visibleNodes}
            inspector={inspector}
            onHoverNode={setHoveredNodeId}
            onSelectNode={handleSelectNode}
            onNewQuery={handleObjectListNewQuery}
          />
          <CanvasInspector inspector={inspector} addToGraphHandlers={addToGraphHandlers} inspectorFilters={inspectorFilters} />
        </div>
      )}
      <WarningModal
        isOpen={warningModalOpen}
        heading="Large Result Set"
        content="This query has a large number of results. Adding all of them may make the canvas difficult to navigate. Consider filtering your results first."
        confirmButtonText="Add All"
        cancelButtonText="Cancel"
        onConfirm={handleConfirmLargeAdd}
        onCancel={cancelWarning}
        onClose={closeWarning}
        setStorageKeyFn={(hide) => { if (hide) localStorage.setItem(skipWarningKey, 'true'); }}
      />
    </div>
  );
};

export default CanvasPane;
