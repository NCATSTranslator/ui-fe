import { FC, useCallback, useState } from 'react';
import styles from './CanvasPane.module.scss';
import useCanvasPane from '@/features/Canvas/hooks/useCanvasPane';
import useCanvas from '@/features/Canvas/hooks/useCanvas';
import useCanvasInspector from '@/features/Canvas/hooks/useCanvasInspector';
import useCanvasInspectorHandlers from '@/features/Canvas/hooks/useCanvasInspectorHandlers';
import { useSelector } from 'react-redux';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import ChevUp from '@/assets/icons/directional/Chevron/Chevron Up.svg?react';
import ChevDown from '@/assets/icons/directional/Chevron/Chevron Down.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import CanvasGraph from '@/features/Canvas/components/CanvasGraph/CanvasGraph';
import CanvasObjectList from '@/features/Canvas/components/CanvasObjectList/CanvasObjectList';
import CanvasInspector from '@/features/Canvas/components/CanvasInspector/CanvasInspector';
import CanvasTestPanel from './CanvasTestPanel';
import WarningModal from '@/features/Core/components/WarningModal/WarningModal';
import { selectResultSetKeys } from '@/features/ResultList/slices/resultsSlice';
import { resolveQueryPkFromSources } from '@/features/Canvas/utils/canvasFunctions';
import type { GraphNodeType, GraphEdgeType } from 'translator-graph-view';

const CanvasPane: FC = () => {
  const { paneOpen, activeCanvas, togglePane, closePane } = useCanvasPane();
  const canvasActions = useCanvas();
  const { rename, undo, redo, canUndo, canRedo, mergeEntities, addNode, addEdge, removeNode, isProcessing } = canvasActions;
  const inspector = useCanvasInspector();
  const { addToGraphHandlers, warningModalOpen, handleConfirmLargeAdd, cancelWarning, closeWarning, skipWarningKey } = useCanvasInspectorHandlers(canvasActions);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const resultSetKeys = useSelector(selectResultSetKeys);

  const resolveQueryPk = useCallback((sourceIds: string[]): string | undefined => {
    if (!activeCanvas) return undefined;
    return resolveQueryPkFromSources(activeCanvas, sourceIds);
  }, [activeCanvas]);

  const handleNodeClick = useCallback((node: GraphNodeType) => {
    const canvasNode = activeCanvas?.nodes[node.id];
    setSelectedNodeIds([node.id]);
    inspector.openView('node', canvasNode?.names[0] || node.id, node.id, {
      nodeId: node.id,
      queryPk: canvasNode ? resolveQueryPk(canvasNode.sources) : undefined,
    });
  }, [activeCanvas, inspector, resolveQueryPk]);

  const handleObjectListSelectNode = useCallback((nodeId: string) => {
    setSelectedNodeIds([nodeId]);
  }, []);

  const handleEdgeClick = useCallback((edge: GraphEdgeType) => {
    const canvasEdge = activeCanvas?.edges[edge.id];
    inspector.openView('evidence', edge.predicate || edge.id, edge.id, {
      queryPk: (canvasEdge ? resolveQueryPk(canvasEdge.sources) : undefined) ?? '',
      edgeId: edge.id,
    });
  }, [activeCanvas, inspector, resolveQueryPk]);

  const handleAddObject = useCallback(() => {
    // TODO: Phase 5 follow-up — open object search interface in inspector
  }, []);

  const handleAddAnnotation = useCallback(() => {
    // TODO: Phase 5 follow-up — open annotation input in inspector
  }, []);

  if (!activeCanvas) return null;

  return (
    <div className={joinClasses(styles.canvasPane, paneOpen ? styles.expanded : styles.collapsed)}>
      <div className={styles.titleBar}>
        <button
          type="button"
          className={styles.titleLeft}
          onClick={togglePane}
          aria-label={paneOpen ? 'Collapse canvas' : 'Expand canvas'}
          aria-expanded={paneOpen}
        >
          <span className={styles.canvasTitle}>{activeCanvas.title}</span>
        </button>
        <div className={styles.titleRight}>
          <button
            className={styles.iconButton}
            onClick={togglePane}
            aria-label={paneOpen ? 'Collapse canvas' : 'Expand canvas'}
          >
            {paneOpen ? <ChevDown /> : <ChevUp />}
          </button>
          <button
            className={styles.iconButton}
            onClick={closePane}
            aria-label="Close canvas"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
      {paneOpen && (
        <div className={styles.contentArea}>
          <CanvasGraph
            canvas={activeCanvas}
            onRename={rename}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onAddObject={handleAddObject}
            onAddAnnotation={handleAddAnnotation}
            isProcessing={isProcessing}
            hoveredNodeId={hoveredNodeId}
            selectedIds={selectedNodeIds}
          />
          <CanvasObjectList
            canvas={activeCanvas}
            inspector={inspector}
            onHoverNode={setHoveredNodeId}
            onSelectNode={handleObjectListSelectNode}
            onAddObject={handleAddObject}
            onAddAnnotation={handleAddAnnotation}
          />
          <CanvasInspector inspector={inspector} addToGraphHandlers={addToGraphHandlers} />
          <CanvasTestPanel
            canvas={activeCanvas}
            inspector={inspector}
            mergeEntities={mergeEntities}
            addNode={addNode}
            addEdge={addEdge}
            removeNode={removeNode}
            undo={undo}
            canUndo={canUndo}
            resultSetKeys={resultSetKeys}
          />
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
