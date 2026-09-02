import { FC, ReactNode, useCallback, useMemo, useRef } from 'react';
import styles from './CanvasGraph.module.scss';
import {
  GraphView as TranslatorGraphView,
  LayoutType,
  GraphNodeType,
  GraphEdgeType,
  HoverGeometry,
  type GraphFocusRequest,
  type GraphAnnotation,
  type DeleteSelection,
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
import { useGraphNodeColor } from '@/features/Core/hooks/useNodeColors';
import { canvasHasExportableGraph } from '@/features/Canvas/utils/canvasFunctions';
import { CanvasGraphAreaContext } from './CanvasGraphAreaContext';

/** Extra top inset keeps nodes below the overlay toolbar when fitView runs. */
const CANVAS_FIT_VIEW_PADDING: FitViewPadding = {
  top: '56px',
  right: 0.1,
  bottom: 0.1,
  left: 0.1,
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
  /** Delete/Backspace pressed with a graph selection; the graph itself removes nothing. */
  onSelectionDelete?: (selection: DeleteSelection) => void;
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
  onSelectionDelete,
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
  const getNodeColor = useGraphNodeColor();
  const graphAreaRef = useRef<HTMLDivElement>(null);
  const hasGraphContent = canvasHasExportableGraph({ nodes: canvas.nodes, annotations });
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
          clearHoverOnViewportChange
          nodeChrome={canvasNodeChrome}
          getNodeIcon={getNodeIcon}
          getNodeColor={getNodeColor}
          onNodeMenu={onNodeContextMenu}
          onSelectionDelete={onSelectionDelete}
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
    <CanvasGraphAreaContext.Provider value={graphAreaRef}>
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
        <div className={styles.graphArea} ref={graphAreaRef}>
          {graphAreaContent}
        </div>
        <CanvasLayoutWarningModal
          isOpen={layoutWarningOpen}
          onConfirm={onConfirmLayoutChange ?? (() => undefined)}
          onCancel={onCancelLayoutChange ?? (() => undefined)}
        />
      </div>
    </CanvasGraphAreaContext.Provider>
  );
};

export default CanvasGraph;
