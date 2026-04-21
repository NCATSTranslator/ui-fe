import { useMemo, useState, MouseEvent } from 'react';
import styles from './GraphView.module.scss';
import { GraphView as TranslatorGraphView, LayoutType, GraphData, GraphNodeType, GraphEdgeType, HoverGeometry } from 'translator-graph-view';
import 'translator-graph-view/styles.css';
import { useSelector } from 'react-redux';
import { currentPrefs } from '@/features/UserAuth/slices/userSlice';
import GraphLayoutButtons from '@/features/ResultGraphView/components/GraphLayoutButtons/GraphLayoutButtons';
import { useResultsNavigate } from '@/features/Navigation/hooks/useResultsNavigate';
import { useParams } from 'react-router-dom';
import { ResultSet } from '@/features/ResultList/types/results.d';
import { GraphHoverTarget } from '@/features/ResultGraphView/types/graphTypes';
import GraphHoverTooltips from '@/features/ResultGraphView/components/GraphHoverTooltips/GraphHoverTooltips';
import { resolveNodeTarget, resolveEdgeTarget, getInitialLayout } from '@/features/ResultGraphView/utils/graphFunctions';
import { useDelayedHoverTarget } from '@/features/ResultGraphView/hooks/useDelayedHoverTarget';

interface GraphViewProps {
  graph: GraphData;
  active: boolean;
  resultSet?: ResultSet;
}

const GraphView = ({ graph, active, resultSet }: GraphViewProps) => {
  const prefs = useSelector(currentPrefs);
  const [layout, setLayout] = useState<LayoutType>(() => getInitialLayout(prefs));
  const resultsNavigate = useResultsNavigate();
  const { resultId } = useParams();

  const [pending, setPending] = useState<GraphHoverTarget>(null);
  const [tooltipHovered, setTooltipHovered] = useState(false);
  const visible = useDelayedHoverTarget(pending, { hold: tooltipHovered });
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const hasData = useMemo(
    () => Object.keys(graph.nodes).length > 0,
    [graph]
  );

  const onNodeClick = (node: GraphNodeType) => {
    if (resultId) {
      resultsNavigate(`/results/${resultId}/node/${node.id}`);
    } else {
      console.warn('Could not navigate to node, resultId is not set');
    }
  };

  const onEdgeClick = (edge: GraphEdgeType) => {
    if(resultId) {
      resultsNavigate(`/results/${resultId}/evidence/${edge.id}`);
    } else {
      console.warn('Could not navigate to edge, resultId is not set');
    }
  };

  const onPredicateClick = (e: MouseEvent<HTMLSpanElement>, edgeId: string) => {
    e.stopPropagation();
    // create a dummy edge, since we're really just passing the id to the onEdgeClick handler
    onEdgeClick({id: edgeId, subject: '', object: '', predicate: ''});
  };

  const onNodeHover = (node: GraphNodeType | null, geometry: HoverGeometry | null) => {
    setPending(resolveNodeTarget(node, geometry, resultSet));
  };

  const onEdgeHover = (edge: GraphEdgeType | null, geometry: HoverGeometry | null) => {
    setPending(resolveEdgeTarget(edge, geometry, resultSet));
  };

  const onContainerMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    setCursor({ x: e.clientX, y: e.clientY });
  };

  if (!active || !hasData) return null;

  return (
    <div>
      <GraphLayoutButtons currentLayout={layout} setCurrentLayout={setLayout} />
      <div
        className={styles.graphContainer}
        onMouseMove={onContainerMouseMove}
      >
        <TranslatorGraphView
          data={graph}
          layout={layout}
          elkWorkerUrl="/elk-worker.min.js"
          showEdgeLabels={false}
          nodeHoverAnchor="topCenter"
          edgeHoverAnchor="midpoint"
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onNodeHover={onNodeHover}
          onEdgeHover={onEdgeHover}
        />
        <GraphHoverTooltips
          onPredicateClick={onPredicateClick}
          target={visible}
          cursor={cursor}
          resultSet={resultSet}
          onTooltipEnter={() => setTooltipHovered(true)}
          onTooltipLeave={() => setTooltipHovered(false)}
        />
      </div>
    </div>
  );
};

export default GraphView;
