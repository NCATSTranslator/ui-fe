import { FC, useMemo, useState } from 'react';
import styles from './CanvasGraph.module.scss';
import { GraphView as TranslatorGraphView, LayoutType, GraphNodeType, GraphEdgeType } from 'translator-graph-view';
import 'translator-graph-view/styles.css';
import { Canvas } from '@/features/Canvas/types/canvas';
import { canvasToGraphData } from '@/features/Canvas/utils/canvasGraphFunctions';
import CanvasToolbar from '@/features/Canvas/components/CanvasToolbar/CanvasToolbar';
import CanvasEmptyState from '@/features/Canvas/components/CanvasEmptyState/CanvasEmptyState';

interface CanvasGraphProps {
  canvas: Canvas;
  onRename: (title: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onNodeClick?: (node: GraphNodeType) => void;
  onEdgeClick?: (edge: GraphEdgeType) => void;
  onAddObject?: () => void;
  onAddAnnotation?: () => void;
  isProcessing?: boolean;
  hoveredNodeId?: string | null;
  selectedIds?: string[];
}

const CanvasGraph: FC<CanvasGraphProps> = ({
  canvas,
  onRename,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onNodeClick,
  onEdgeClick,
  onAddObject,
  onAddAnnotation,
  isProcessing,
  hoveredNodeId,
  selectedIds,
}) => {
  const [layout, setLayout] = useState<LayoutType>('hierarchicalLR');

  const graphData = useMemo(() => canvasToGraphData(canvas), [canvas]);
  const hasNodes = Object.keys(canvas.nodes).length > 0;

  return (
    <div className={styles.canvasGraph}>
      <CanvasToolbar
        title={canvas.title}
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
      />
      <div className={styles.graphArea}>
        {hasNodes ? (
          <TranslatorGraphView
            data={graphData}
            layout={layout}
            elkWorkerUrl="/elk-worker.min.js"
            showEdgeLabels
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            hoveredNodeId={hoveredNodeId}
            selectedIds={selectedIds}
          />
        ) : (
          <CanvasEmptyState />
        )}
      </div>
    </div>
  );
};

export default CanvasGraph;
