import { FC, ReactNode, useMemo, useState, MouseEvent, useCallback } from 'react';
import styles from './CanvasGraph.module.scss';
import { GraphView as TranslatorGraphView, LayoutType, GraphNodeType, GraphEdgeType, HoverGeometry, type GraphFocusRequest, type GraphAnnotation } from 'translator-graph-view';
import 'translator-graph-view/styles.css';
import type { Canvas, CanvasNode, CanvasEdge, SaveStatus } from '@/features/Canvas/types/canvas';
import { filteredCanvasToGraphData } from '@/features/Canvas/utils/canvasGraphFunctions';
import CanvasToolbar from '@/features/Canvas/components/CanvasToolbar/CanvasToolbar';
import CanvasEmptyState from '@/features/Canvas/components/CanvasEmptyState/CanvasEmptyState';

const REACT_FLOW_NODE_SELECTOR = '.react-flow__node';

interface CanvasGraphProps {
  canvas: Canvas;
  visibleNodes?: Record<string, CanvasNode>;
  visibleEdges?: Record<string, CanvasEdge>;
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
  isProcessing?: boolean;
  saveStatus?: SaveStatus;
  hoveredNodeId?: string | null;
  selectedIds?: string[];
  focusRequest?: GraphFocusRequest | null;
  children?: ReactNode;
}

const CanvasGraph: FC<CanvasGraphProps> = ({
  canvas,
  visibleNodes,
  visibleEdges,
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
  isProcessing,
  saveStatus,
  hoveredNodeId,
  selectedIds,
  focusRequest,
  children,
}) => {
  const [layout, setLayout] = useState<LayoutType>('hierarchicalLR');

  const graphData = useMemo(
    () => visibleNodes && visibleEdges
      ? filteredCanvasToGraphData(visibleNodes, visibleEdges)
      : filteredCanvasToGraphData(canvas.nodes, canvas.edges),
    [canvas.nodes, canvas.edges, visibleNodes, visibleEdges],
  );
  const hasNodes = Object.keys(canvas.nodes).length > 0;
  const hasGraphContent = hasNodes || annotations.length > 0;

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
        layout={layout}
        onLayoutChange={setLayout}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onAddObject={onAddObject}
        onAddAnnotation={onAddAnnotation}
        isProcessing={isProcessing}
        saveStatus={saveStatus}
      />
      <div className={styles.graphArea} onContextMenu={handleGraphContextMenu}>
        {hasGraphContent ? (
          <>
            <TranslatorGraphView
              data={graphData}
              layout={layout}
              elkWorkerUrl="/elk-worker.min.js"
              showEdgeLabels={false}
              showMiniMap={false}
              nodeHoverAnchor="topCenter"
              edgeHoverAnchor="midpoint"
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onNodeHover={onNodeHover}
              onEdgeHover={onEdgeHover}
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
    </div>
  );
};

export default CanvasGraph;
