import { FC, ReactNode, useCallback, useMemo } from 'react';
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
import { canvasNodeChrome } from '@/features/Canvas/components/CanvasNodeChrome/CanvasNodeChrome';
import { getNodeIcon as getCategoryIcon } from '@/features/Core/utils/entityLinks';

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
  onAnnotationHover?: (annotationId: string | null) => void;
  onNodeContextMenu?: (nodeId: string, position: { x: number; y: number }) => void;
  onAddObject?: () => void;
  onAddAnnotation?: () => void;
  annotations?: GraphAnnotation[];
  onAnnotationsChange?: (annotations: GraphAnnotation[]) => void;
  saveStatus?: SaveStatus;
  hoveredNodeId?: string | null;
  hoveredEdgeId?: string | null;
  hoveredAnnotationId?: string | null;
  selectedIds?: string[];
  focusRequest?: GraphFocusRequest | null;
  viewportSyncKey?: string;
  toolbarRight?: ReactNode;
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
  onAnnotationHover,
  onNodeContextMenu,
  onAddObject,
  onAddAnnotation,
  annotations = [],
  onAnnotationsChange,
  saveStatus,
  hoveredNodeId,
  hoveredEdgeId,
  hoveredAnnotationId,
  selectedIds,
  focusRequest,
  viewportSyncKey,
  toolbarRight,
  children,
}) => {
  const graphData = useMemo(
    () => visibleNodes && visibleEdges
      ? filteredCanvasToGraphData(visibleNodes, visibleEdges)
      : filteredCanvasToGraphData(canvas.nodes, canvas.edges),
    [canvas.nodes, canvas.edges, visibleNodes, visibleEdges],
  );
  const getNodeIcon = useCallback((type: string) => getCategoryIcon(type, null), []);
  const hasNodes = Object.keys(canvas.nodes).length > 0;
  const hasGraphContent = hasNodes || annotations.length > 0;
  const isLayoutLoading = hasGraphContent && !isCustomLayoutReady;

  let graphAreaContent: ReactNode = <CanvasEmptyState />;
  if (isLayoutLoading) {
    graphAreaContent = (
      <div className={styles.graphLoading} aria-live="polite" aria-busy="true">
        <LoadingIcon size="medium" />
        <span>Loading layout…</span>
      </div>
    );
  } else if (hasGraphContent) {
    graphAreaContent = (
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
          showHandles={false}
          nodeChrome={canvasNodeChrome}
          getNodeIcon={getNodeIcon}
          onNodeMenu={onNodeContextMenu}
          nodeHoverAnchor="topCenter"
          edgeHoverAnchor="midpoint"
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onNodeHover={onNodeHover}
          onEdgeHover={onEdgeHover}
          onAnnotationHover={onAnnotationHover}
          onGraphNodeDragStop={onGraphNodeDragStop}
          onLayoutComplete={onLayoutComplete}
          hoveredNodeId={hoveredNodeId}
          hoveredEdgeId={hoveredEdgeId}
          hoveredAnnotationId={hoveredAnnotationId}
          selectedIds={selectedIds}
          focusRequest={focusRequest}
          annotations={annotations}
          onAnnotationsChange={onAnnotationsChange}
        />
        {children}
      </>
    );
  }

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
        rightSlot={toolbarRight}
      />
      <div className={styles.graphArea}>
        {graphAreaContent}
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
