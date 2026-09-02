import { useMemo, useRef, useState, MouseEvent } from 'react';
import styles from './GraphView.module.scss';
import { GraphView as TranslatorGraphView, LayoutType, GraphData, GraphNodeType, GraphEdgeType, HoverGeometry } from 'translator-graph-view';
import 'translator-graph-view/styles.css';
import { useSelector } from 'react-redux';
import { currentPrefs } from '@/features/UserAuth/slices/userSlice';
import GraphLayoutButtons from '@/features/ResultGraphView/components/GraphLayoutButtons/GraphLayoutButtons';
import { useResultsNavigate } from '@/features/Navigation/hooks/useResultsNavigate';
import useEvidenceViewNavigation from '@/features/ResultList/hooks/useEvidenceViewNavigation';
import { useParams } from 'react-router-dom';
import { ResultSet } from '@/features/ResultList/types/results.d';
import { GraphHoverTarget } from '@/features/ResultGraphView/types/graphTypes';
import GraphHoverTooltips from '@/features/ResultGraphView/components/GraphHoverTooltips/GraphHoverTooltips';
import { resolveNodeTarget, resolveEdgeTarget, getInitialLayout } from '@/features/ResultGraphView/utils/graphFunctions';
import { useDelayedHoverTarget } from '@/features/ResultGraphView/hooks/useDelayedHoverTarget';
import { PredicateClickOptions } from '@/features/Core/components/Tooltips/EdgeTooltipContent';
import { useGraphNodeColor } from '@/features/Core/hooks/useNodeColors';

interface GraphViewProps {
  graph: GraphData;
  active: boolean;
  resultSet?: ResultSet;
}

const GraphView = ({ graph, active, resultSet }: GraphViewProps) => {
  const prefs = useSelector(currentPrefs);
  const getNodeColor = useGraphNodeColor();
  const [layout, setLayout] = useState<LayoutType>(() => getInitialLayout(prefs));
  const resultsNavigate = useResultsNavigate();
  const { resultId } = useParams();
  const { navigateToEvidenceView } = useEvidenceViewNavigation(resultId);

  const [pending, setPending] = useState<GraphHoverTarget>(null);
  const [tooltipHovered, setTooltipHovered] = useState(false);
  const visible = useDelayedHoverTarget(pending, { hold: tooltipHovered });
  /**
   * The graph re-measures hover geometry and re-fires the hover callbacks on
   * every animation frame that the viewport moves. Repeat events for the entity
   * already hovered carry nothing the tooltip uses, so dropping them keeps a pan
   * that starts over a node from re-rendering the graph once per frame.
   */
  const hoverKeyRef = useRef<string | null>(null);
  const isRepeatHover = (hoverKey: string | null) => {
    if (hoverKey !== null && hoverKeyRef.current === hoverKey) return true;
    hoverKeyRef.current = hoverKey;
    return false;
  };

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
    navigateToEvidenceView({ edgeId: edge.id });
  };

  const onPredicateClick = (e: MouseEvent<HTMLSpanElement>, edgeId: string, options?: PredicateClickOptions) => {
    e.stopPropagation();
    navigateToEvidenceView({ edgeId, tab: options?.tab });
  };

  const onNodeHover = (node: GraphNodeType | null, geometry: HoverGeometry | null) => {
    if (isRepeatHover(node ? `node:${node.id}` : null)) return;
    setPending(resolveNodeTarget(node, geometry, resultSet));
  };

  const onEdgeHover = (edge: GraphEdgeType | null, geometry: HoverGeometry | null) => {
    if (isRepeatHover(edge ? `edge:${edge.id}` : null)) return;
    setPending(resolveEdgeTarget(edge, geometry, resultSet));
  };

  if (!active || !hasData) return null;

  return (
    <div>
      <GraphLayoutButtons currentLayout={layout} setCurrentLayout={setLayout} />
      <div className={styles.graphContainer}>
        <TranslatorGraphView
          data={graph}
          layout={layout}
          elkWorkerUrl="/elk-worker.min.js"
          showEdgeLabels={false}
          getNodeColor={getNodeColor}
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
          resultSet={resultSet}
          onTooltipEnter={() => setTooltipHovered(true)}
          onTooltipLeave={() => setTooltipHovered(false)}
        />
      </div>
    </div>
  );
};

export default GraphView;
