import { FC, ReactNode, useMemo, MouseEvent, useCallback } from 'react';
import styles from './CanvasGraph.module.scss';
import {
  GraphView as TranslatorGraphView,
  LayoutType,
  GraphNodeType,
  GraphEdgeType,
  HoverGeometry,
  type GraphFocusRequest,
  type GraphAnnotation,
  type NodePositionMap,
  type FitViewPadding,
} from 'translator-graph-view';
import 'translator-graph-view/styles.css';
import type { Canvas, CanvasNode, CanvasEdge, SaveStatus } from '@/features/Canvas/types/canvas';
import { filteredCanvasToGraphData } from '@/features/Canvas/utils/canvasGraphFunctions';
import CanvasToolbar from '@/features/Canvas/components/CanvasToolbar/CanvasToolbar';
import CanvasEmptyState from '@/features/Canvas/components/CanvasEmptyState/CanvasEmptyState';
import CanvasLayoutWarningModal from '@/features/Canvas/components/CanvasLayoutWarningModal/CanvasLayoutWarningModal';
import LoadingIcon from '@/features/Core/components/LoadingIcon/LoadingIcon';

const REACT_FLOW_NODE_SELECTOR = '.react-flow__node';

/** Extra top inset keeps nodes below the overlay toolbar when fitView runs. */
const CANVAS_FIT_VIEW_PADDING: FitViewPadding = {
  top: '56px',
  right: 0.2,
  bottom: 0.2,
  left: 0.2,
};

interface CanvasGraphProps {
  canvas: Canvas;
  visibleNodes?: Record<string, CanvasNode>;
  visibleEdges?: Record<string, CanvasEdge>;
  graphLayout: LayoutType;
  nodePositions?: NodePositionMap;
  isCustomLayoutReady?: boolean;
  layoutWarningOpen?: boolean;
  onLayoutChange: (layout: LayoutType) => void;
  onGraphNodeDragStop?: (nodeId: string, position: { x: number; y: number }, allPositions: NodePositionMap) => void;
  onLayoutComplete?: (positions: NodePositionMap) => void;
  onConfirmLayoutChange?: () => void;
  onCancelLayoutChange?: () => void;
  onRename: (title: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onNodeClick?: (node: GraphNodeType) => void;
  onEdgeClick?: (edge: GraphEdgeType) => void;
  onNodeHover?: (node: GraphNodeType | null, geometry: HoverGeometry | null) => void;
  onEdgeHover?: (edge: GraphEdgeType | null, geometry: HoverGeometry | null) => void;
  onNodeContextMenu?: (nodeId: string, position: { x: number; y: number }) => void;
  onAddObject?: () => void;
  onAddAnnotation?: () => void;
  annotations?: GraphAnnotation[];
  onAnnotationsChange?: (annotations: GraphAnnotation[]) => void;
  saveStatus?: SaveStatus;
  hoveredNodeId?: string | null;
  selectedIds?: string[];
  focusRequest?: GraphFocusRequest | null;
  viewportSyncKey?: string;
  children?: ReactNode;
}

const CanvasGraph: FC<CanvasGraphProps> = ({
  canvas,
  visibleNodes,
  visibleEdges,
  graphLayout,
  nodePositions,
  isCustomLayoutReady = true,
  layoutWarningOpen = false,
  onLayoutChange,
  onGraphNodeDragStop,
  onLayoutComplete,
  onConfirmLayoutChange,
  onCancelLayoutChange,
  onRename,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onNodeClick,
  onEdgeClick,
  onNodeHover,
  onEdgeHover,
  onNodeContextMenu,
  onAddObject,
  onAddAnnotation,
  annotations = [],
  onAnnotationsChange,
  saveStatus,
  hoveredNodeId,
  selectedIds,
  focusRequest,
  viewportSyncKey,
  children,
}) => {
  const graphData = useMemo(
    () => visibleNodes && visibleEdges
      ? filteredCanvasToGraphData(visibleNodes, visibleEdges)
      : filteredCanvasToGraphData(canvas.nodes, canvas.edges),
    [canvas.nodes, canvas.edges, visibleNodes, visibleEdges],
  );
  const hasNodes = Object.keys(canvas.nodes).length > 0;
  const hasGraphContent = hasNodes || annotations.length > 0;
  const isLayoutLoading = hasGraphContent && !isCustomLayoutReady;

  const handleGraphContextMenu = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (!onNodeContextMenu) return;
    const nodeElement = (event.target as HTMLElement).closest(REACT_FLOW_NODE_SELECTOR);
    if (!nodeElement) return;
    event.preventDefault();
    const nodeId = nodeElement.getAttribute('data-id');
    if (!nodeId) return;
    onNodeContextMenu(nodeId, { x: event.clientX, y: event.clientY });
  }, [onNodeContextMenu]);

  return (
    <div className={styles.canvasGraph}>
      <CanvasToolbar
        title={canvas.label}
        onRename={onRename}
        layout={graphLayout}
        onLayoutChange={onLayoutChange}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onAddObject={onAddObject}
        onAddAnnotation={onAddAnnotation}
        saveStatus={saveStatus}
      />
      <div className={styles.graphArea} onContextMenu={handleGraphContextMenu}>
        {isLayoutLoading ? (
          <div className={styles.graphLoading} aria-live="polite" aria-busy="true">
            <LoadingIcon size="medium" />
            <span>Loading layout…</span>
          </div>
        ) : hasGraphContent ? (
          <>
            <TranslatorGraphView
              data={graphData}
              layout={graphLayout}
              nodePositions={nodePositions}
              fitViewPadding={CANVAS_FIT_VIEW_PADDING}
              viewportSyncKey={viewportSyncKey ?? String(canvas.id)}
              elkWorkerUrl="/elk-worker.min.js"
              showEdgeLabels={false}
              showMiniMap={false}
              nodeHoverAnchor="topCenter"
              edgeHoverAnchor="midpoint"
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onNodeHover={onNodeHover}
              onEdgeHover={onEdgeHover}
              onGraphNodeDragStop={onGraphNodeDragStop}
              onLayoutComplete={onLayoutComplete}
              hoveredNodeId={hoveredNodeId}
              selectedIds={selectedIds}
              focusRequest={focusRequest}
              annotations={annotations}
              onAnnotationsChange={onAnnotationsChange}
            />
            {children}
          </>
        ) : (
          <CanvasEmptyState />
        )}
      </div>
      <CanvasLayoutWarningModal
        isOpen={layoutWarningOpen}
        onConfirm={onConfirmLayoutChange ?? (() => undefined)}
        onCancel={onCancelLayoutChange ?? (() => undefined)}
      />
    </div>
  );
};

export default CanvasGraph;
