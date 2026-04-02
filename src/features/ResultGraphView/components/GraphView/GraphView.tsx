import { useMemo, useState } from 'react';
import styles from './GraphView.module.scss';
import { GraphView as TranslatorGraphView, LayoutType, GraphData, GraphNodeType, GraphEdgeType } from 'translator-graph-view';
import 'translator-graph-view/styles.css';
import { useSelector } from 'react-redux';
import { currentPrefs } from '@/features/UserAuth/slices/userSlice';
import GraphLayoutButtons from '@/features/ResultGraphView/components/GraphLayoutButtons/GraphLayoutButtons';
import { Preferences } from '@/features/UserAuth/types/user';
import { useResultsNavigate } from '@/features/Navigation/hooks/useResultsNavigate';
import { useParams } from 'react-router-dom';

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
}

const GraphView = ({ graph, active }: GraphViewProps) => {
  const prefs = useSelector(currentPrefs);
  const [layout, setLayout] = useState<LayoutType>(() => getInitialLayout(prefs));
  const resultsNavigate = useResultsNavigate();
  const { resultId } = useParams();

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
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
        />
      </div>
    </div>
  );
};

export default GraphView;
