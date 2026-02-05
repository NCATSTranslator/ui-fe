import { useState, useEffect, useCallback, CSSProperties } from 'react';
import { GraphView as TranslatorGraphView, type GraphData, type LayoutType, 
  type Selection, type GraphNodeType, type GraphEdgeType } from 'translator-graph-view';
import exampleData from '@/features/GraphView/components/GraphView/example.json';

// Transform JSON data to match GraphData type expectations
const transformData = (data: typeof exampleData): GraphData => {
  const edges = Object.fromEntries(
    Object.entries(data.edges).map(([key, edge]) => [
      key,
      {
        ...edge,
        provenance: edge.provenance.map((p) => ({
          ...p,
          url: p.url ?? undefined,
        })),
      },
    ])
  );
  const paths = Object.fromEntries(
    Object.entries(data.paths).map(([key, path]) => [
      key,
      {
        ...path,
        edges: path.subgraph, // Map subgraph to edges as expected by Path type
      },
    ])
  );
  const trials = Object.fromEntries(
    Object.entries(data.trials).map(([key, trial]) => [
      key,
      {
        ...trial,
        phase: String(trial.phase), // Convert number to string
      },
    ])
  );
  return { ...data, edges, paths, trials } as GraphData;
};

const LAYOUTS: Array<{ label: string; type: LayoutType }> = [
  { label: 'Top ↓ Bottom', type: 'hierarchical' },
  { label: 'Left → Right', type: 'hierarchicalLR' },
  { label: 'Force', type: 'force' },
  { label: 'Grid', type: 'grid' },
];

const GraphView = () => {
  const [data, setData] = useState<GraphData | null>(null);
  const [layout, setLayout] = useState<LayoutType>('hierarchical');
  const [selection, setSelection] = useState<Selection>({ nodes: [], edges: [] });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(transformData(exampleData));
  }, []);

  const handleSelectionChange = useCallback((newSelection: Selection) => {
    setSelection(newSelection);
  }, []);

  const handleNodeClick = useCallback((node: GraphNodeType) => {
    console.log('Node clicked:', node);
  }, []);

  const handleEdgeClick = useCallback((edge: GraphEdgeType) => {
    console.log('Edge clicked:', edge);
  }, []);

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading graph data...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2 style={styles.title}>Graph View</h2>
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Layout</h3>
          <div style={styles.buttonGroup}>
            {LAYOUTS.map((l) => (
              <button
                key={l.type}
                onClick={() => setLayout(l.type)}
                style={{
                  ...styles.button,
                  ...(layout === l.type ? styles.buttonActive : {}),
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Selection</h3>
          <div style={styles.selectionInfo}>
            <div>Nodes: {selection.nodes.length}</div>
            <div>Edges: {selection.edges.length}</div>
          </div>
          {selection.nodes.length > 0 && (
            <div style={styles.selectedItems}>
              <strong>Selected Nodes:</strong>
              <ul style={styles.list}>
                {selection.nodes.map((node) => (
                  <li key={node.id} style={styles.listItem}>
                    {node.names[0] || node.id}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {selection.edges.length > 0 && (
            <div style={styles.selectedItems}>
              <strong>Selected Edges:</strong>
              <ul style={styles.list}>
                {selection.edges.map((edge) => (
                  <li key={edge.id} style={styles.listItem}>
                    {edge.predicate}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Stats</h3>
          <div style={styles.stats}>
            <div>Total Nodes: {Object.keys(data.nodes).length}</div>
            <div>Total Edges: {Object.keys(data.edges).length}</div>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Controls</h3>
          <ul style={styles.controlsList}>
            <li>Click: Select node/edge</li>
            <li>Shift+Click: Multi-select</li>
            <li>Drag: Pan view</li>
            <li>Scroll: Zoom in/out</li>
            <li>Box select: Drag from empty area</li>
          </ul>
        </div>
      </div>

      <div style={styles.graphContainer}>
        <TranslatorGraphView
          data={data}
          layout={layout}
          onSelectionChange={handleSelectionChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
        />
      </div>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    width: '100%',
    height: '100%',
  },
  sidebar: {
    width: '280px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRight: '1px solid #dee2e6',
    overflowY: 'auto',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '20px',
    color: '#212529',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#495057',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  button: {
    padding: '8px 12px',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    color: '#495057',
    transition: 'all 0.2s',
    textAlign: 'left',
  },
  buttonActive: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
    color: 'white',
  },
  selectionInfo: {
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
    fontSize: '13px',
    color: '#495057',
  },
  selectedItems: {
    marginTop: '12px',
    fontSize: '12px',
    color: '#495057',
  },
  list: {
    listStyle: 'none',
    margin: '8px 0 0 0',
    padding: 0,
  },
  listItem: {
    padding: '4px 8px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    marginBottom: '4px',
    fontSize: '11px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  stats: {
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
    fontSize: '13px',
    color: '#495057',
  },
  controlsList: {
    fontSize: '12px',
    color: '#6c757d',
    paddingLeft: '16px',
    margin: 0,
    lineHeight: 1.8,
  },
  graphContainer: {
    flex: 1,
    height: '100%',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    color: '#6c757d',
    fontSize: '16px',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    color: '#dc3545',
    fontSize: '16px',
  },
};

export default GraphView;