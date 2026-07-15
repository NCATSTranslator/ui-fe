import { FC, ReactNode, useMemo, useState } from 'react';
import styles from './CanvasGraph.module.scss';
import { GraphView as TranslatorGraphView, LayoutType, GraphNodeType, GraphEdgeType, HoverGeometry } from 'translator-graph-view';
import 'translator-graph-view/styles.css';
import type { Canvas, CanvasNode, CanvasEdge, SaveStatus } from '@/features/Canvas/types/canvas';
import { canvasToGraphData, filteredCanvasToGraphData } from '@/features/Canvas/utils/canvasGraphFunctions';
import CanvasToolbar from '@/features/Canvas/components/CanvasToolbar/CanvasToolbar';
import CanvasEmptyState from '@/features/Canvas/components/CanvasEmptyState/CanvasEmptyState';

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
  onAddObject?: () => void;
  onAddAnnotation?: () => void;
  isProcessing?: boolean;
  saveStatus?: SaveStatus;
  hoveredNodeId?: string | null;
  selectedIds?: string[];
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
  onAddObject,
  onAddAnnotation,
  isProcessing,
  saveStatus,
  hoveredNodeId,
  selectedIds,
  children,
}) => {
  const [layout, setLayout] = useState<LayoutType>('hierarchicalLR');

  const graphData = useMemo(
    () => visibleNodes && visibleEdges
      ? filteredCanvasToGraphData(visibleNodes, visibleEdges)
      : canvasToGraphData(canvas),
    [canvas, visibleNodes, visibleEdges]
  );
  const hasNodes = Object.keys(canvas.nodes).length > 0;

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
      <div className={styles.graphArea}>
        {hasNodes ? (
          <>
            <TranslatorGraphView
              data={graphData}
              layout={layout}
              elkWorkerUrl="/elk-worker.min.js"
              showEdgeLabels
              nodeHoverAnchor="topCenter"
              edgeHoverAnchor="midpoint"
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onNodeHover={onNodeHover}
              onEdgeHover={onEdgeHover}
              hoveredNodeId={hoveredNodeId}
              selectedIds={selectedIds}
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
