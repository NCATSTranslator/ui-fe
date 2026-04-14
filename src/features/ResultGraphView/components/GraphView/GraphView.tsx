import { useMemo, useState, MouseEvent } from 'react';
import styles from './GraphView.module.scss';
import { GraphView as TranslatorGraphView, LayoutType, GraphData, GraphNodeType, GraphEdgeType } from 'translator-graph-view';
import 'translator-graph-view/styles.css';
import { useSelector } from 'react-redux';
import { currentPrefs } from '@/features/UserAuth/slices/userSlice';
import GraphLayoutButtons from '@/features/ResultGraphView/components/GraphLayoutButtons/GraphLayoutButtons';
import { Preferences } from '@/features/UserAuth/types/user';
import { useResultsNavigate } from '@/features/Navigation/hooks/useResultsNavigate';
import { useParams } from 'react-router-dom';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import NodeTooltipContent from '@/features/Core/components/Tooltips/NodeTooltipContent';
import EdgeTooltipContent, { EdgeTooltipEntry } from '@/features/Core/components/Tooltips/EdgeTooltipContent';
import { nodeToTooltipProps, edgeToTooltipEntry } from '@/features/Core/components/Tooltips/tooltipMappers';
import { ResultEdge, ResultNode, ResultSet } from '@/features/ResultList/types/results.d';

const legacyLayoutMap: Record<string, LayoutType> = {
  klay: 'hierarchicalLR',
  breadthfirst: 'hierarchical',
  concentric: 'force',
  vertical: 'hierarchicalLR',
  horizontal: 'hierarchical',
};

function resolveLayout(pref: string): LayoutType {
  return legacyLayoutMap[pref] ?? (pref as LayoutType);
}

const getInitialLayout = (prefs: Preferences): LayoutType => {
  const layoutPref = String(prefs?.graph_layout?.pref_value || 'hierarchicalLR');
  return resolveLayout(layoutPref);
};

interface GraphViewProps {
  graph: GraphData;
  active: boolean;
  resultSet?: ResultSet;
}

const GRAPH_NODE_TOOLTIP_ID = 'graph-node-tooltip';
const GRAPH_EDGE_TOOLTIP_ID = 'graph-edge-tooltip';

const GraphView = ({ graph, active, resultSet }: GraphViewProps) => {
  const prefs = useSelector(currentPrefs);
  const [layout, setLayout] = useState<LayoutType>(() => getInitialLayout(prefs));
  const resultsNavigate = useResultsNavigate();
  const { resultId } = useParams();

  const [hoveredNode, setHoveredNode] = useState<ResultNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<ResultEdge | null>(null);
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
    console.log('edge clicked', edge);
  };

  const onNodeHover = (node: GraphNodeType | null) => {
    if (!node || !resultSet) {
      setHoveredNode(null);
      return;
    }
    const resultNode = resultSet.data.nodes[node.id];
    setHoveredNode(resultNode ?? null);
    setHoveredEdge(null);
  };

  const onEdgeHover = (edge: GraphEdgeType | null) => {
    if (!edge || !resultSet) {
      setHoveredEdge(null);
      return;
    }
    const resultEdge = resultSet.data.edges[edge.id];
    setHoveredEdge(resultEdge ?? null);
    setHoveredNode(null);
  };

  const onContainerMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!hoveredNode && !hoveredEdge) return;
    setCursor({ x: e.clientX, y: e.clientY });
  };

  const nodeTooltipProps = hoveredNode ? nodeToTooltipProps(hoveredNode) : null;
  const edgeTooltipEntries: EdgeTooltipEntry[] = (hoveredEdge && resultSet)
    ? [edgeToTooltipEntry(resultSet, hoveredEdge)]
    : [];

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
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onNodeHover={onNodeHover}
          onEdgeHover={onEdgeHover}
        />
        <Tooltip
          id={GRAPH_NODE_TOOLTIP_ID}
          isOpen={!!nodeTooltipProps && !!cursor}
          position={cursor ?? undefined}
          delayShow={0}
          delayHide={0}
        >
          {nodeTooltipProps && <NodeTooltipContent {...nodeTooltipProps} />}
        </Tooltip>
        <Tooltip
          id={GRAPH_EDGE_TOOLTIP_ID}
          isOpen={edgeTooltipEntries.length > 0 && !!cursor}
          position={cursor ?? undefined}
          delayShow={0}
          delayHide={0}
        >
          {edgeTooltipEntries.length > 0 && <EdgeTooltipContent edges={edgeTooltipEntries} />}
        </Tooltip>
      </div>
    </div>
  );
};

export default GraphView;
