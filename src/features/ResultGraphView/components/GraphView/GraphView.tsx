import { useMemo, useState } from 'react';
import styles from './GraphView.module.scss';
import { GraphView as TranslatorGraphView, LayoutType, GraphData } from 'translator-graph-view';
import 'translator-graph-view/styles.css';
import { useSelector } from 'react-redux';
import { currentPrefs } from '@/features/UserAuth/slices/userSlice';
import GraphLayoutButtons from '@/features/ResultGraphView/components/GraphLayoutButtons/GraphLayoutButtons';
import { Preferences } from '@/features/UserAuth/types/user';

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

  const hasData = useMemo(
    () => Object.keys(graph.nodes).length > 0,
    [graph]
  );

  if (!active || !hasData) return null;

  return (
    <div>
      <GraphLayoutButtons currentLayout={layout} setCurrentLayout={setLayout} />
      <div className={styles.graphContainer}>
        <TranslatorGraphView
          data={graph}
          layout={layout}
          elkWorkerUrl="/elk-worker.min.js"
        />
      </div>
    </div>
  );
};

export default GraphView;
