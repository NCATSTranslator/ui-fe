import { FC, useState } from 'react';
import styles from './CanvasPane.module.scss';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import ChevRight from '@/assets/icons/directional/Chevron/Chevron Right.svg?react';
import type { Canvas, CanvasNode, CanvasEdge, CanvasSource } from '@/features/Canvas/types/canvas';
import type { CanvasInspectorState } from '@/features/Canvas/hooks/useCanvasInspector';
import { getCanvasNodeCount } from '@/features/Canvas/utils/canvasFunctions';

const EXAMPLE_SOURCE: CanvasSource = { id: 'test-source', type: 'manual', label: 'Test Data' };

const EXAMPLE_NODES: CanvasNode[] = [
  { id: 'MONDO:0005148', names: ['Type 2 Diabetes'], types: ['biolink:Disease'], curies: ['MONDO:0005148'], sources: ['test-source'] },
  { id: 'CHEBI:6801', names: ['Metformin'], types: ['biolink:Drug'], curies: ['CHEBI:6801'], sources: ['test-source'] },
  { id: 'HP:0001943', names: ['Hypoglycemia'], types: ['biolink:PhenotypicFeature'], curies: ['HP:0001943'], sources: ['test-source'] },
  { id: 'NCBIGene:5468', names: ['PPARG'], types: ['biolink:Gene'], curies: ['NCBIGene:5468'], sources: ['test-source'] },
  { id: 'CHEBI:9948', names: ['Pioglitazone'], types: ['biolink:Drug'], curies: ['CHEBI:9948'], sources: ['test-source'] },
];

const EXAMPLE_EDGES: CanvasEdge[] = [
  { id: 'edge-1', subject: 'CHEBI:6801', object: 'MONDO:0005148', predicate: 'biolink:treats', sources: ['test-source'] },
  { id: 'edge-2', subject: 'CHEBI:6801', object: 'HP:0001943', predicate: 'biolink:has_adverse_event', sources: ['test-source'] },
  { id: 'edge-3', subject: 'NCBIGene:5468', object: 'MONDO:0005148', predicate: 'biolink:gene_associated_with_condition', sources: ['test-source'] },
  { id: 'edge-4', subject: 'CHEBI:9948', object: 'MONDO:0005148', predicate: 'biolink:treats', sources: ['test-source'] },
  { id: 'edge-5', subject: 'CHEBI:9948', object: 'NCBIGene:5468', predicate: 'biolink:affects', sources: ['test-source'] },
];

interface CanvasTestPanelProps {
  canvas: Canvas;
  inspector: CanvasInspectorState;
  mergeEntities: (nodes: CanvasNode[], edges: CanvasEdge[], source: CanvasSource) => void;
  addNode: (node: CanvasNode) => void;
  addEdge: (edge: CanvasEdge) => void;
  removeNode: (nodeId: string) => void;
  undo: () => void;
  canUndo: boolean;
  resultSetKeys: string[];
}

const CanvasTestPanel: FC<CanvasTestPanelProps> = ({
  canvas, inspector, mergeEntities, addNode, addEdge, removeNode, undo, canUndo, resultSetKeys,
}) => {
  const [open, setOpen] = useState(false);
  const nodeCount = getCanvasNodeCount(canvas);

  const handleAddExampleGraph = () => {
    mergeEntities(EXAMPLE_NODES, EXAMPLE_EDGES, EXAMPLE_SOURCE);
  };

  const handleAddSingleNode = () => {
    const id = `test-node-${Date.now()}`;
    addNode({
      id,
      names: [`Node ${nodeCount + 1}`],
      types: ['biolink:ChemicalEntity'],
      curies: [id],
      sources: ['test-source'],
    });
  };

  const handleAddEdgeBetweenFirst2 = () => {
    const nodeIds = Object.keys(canvas.nodes);
    if (nodeIds.length < 2) return;
    addEdge({
      id: `test-edge-${Date.now()}`,
      subject: nodeIds[0],
      object: nodeIds[1],
      predicate: 'biolink:related_to',
      sources: ['test-source'],
    });
  };

  const handleRemoveLastNode = () => {
    const nodeIds = Object.keys(canvas.nodes);
    if (nodeIds.length === 0) return;
    removeNode(nodeIds[nodeIds.length - 1]);
  };

  const handleClearCanvas = () => {
    const nodeIds = Object.keys(canvas.nodes);
    for (const id of nodeIds) removeNode(id);
  };

  return (
    <div className={joinClasses(styles.testPanel, open && styles.testPanelOpen)}>
      <button
        className={styles.testPanelHeading}
        onClick={() => setOpen(prev => !prev)}
      >
        <span className={joinClasses(styles.testPanelChevron, open && styles.rotated)}>
          <ChevRight />
        </span>
        <h4>Test Interactions</h4>
      </button>
      {open && (
        <div className={styles.testPanelContent}>
          <span className={styles.testSectionLabel}>Graph</span>
          <button className={styles.testButton} onClick={handleAddExampleGraph}>
            Add example graph (5 nodes)
          </button>
          <button className={styles.testButton} onClick={handleAddSingleNode}>
            Add single node
          </button>
          <button className={styles.testButton} onClick={handleAddEdgeBetweenFirst2} disabled={nodeCount < 2}>
            Add edge (first 2 nodes)
          </button>
          <button className={styles.testButton} onClick={handleRemoveLastNode} disabled={nodeCount === 0}>
            Remove last node
          </button>
          <button className={styles.testButton} onClick={undo} disabled={!canUndo}>
            Undo
          </button>
          <button className={styles.testButton} onClick={handleClearCanvas} disabled={nodeCount === 0}>
            Clear canvas
          </button>

          <span className={styles.testSectionLabel}>Inspector</span>
          <button
            className={styles.testButton}
            onClick={() => {
              const firstNodeId = Object.keys(canvas.nodes)[0];
              if (firstNodeId) {
                const node = canvas.nodes[firstNodeId];
                inspector.openView('node', node.names[0] || firstNodeId, firstNodeId, { nodeId: firstNodeId });
              }
            }}
            disabled={nodeCount === 0}
          >
            Inspect first node
          </button>
          <button
            className={styles.testButton}
            onClick={() => inspector.reset()}
            disabled={!inspector.isOpen}
          >
            Close inspector
          </button>
          {resultSetKeys.length > 0 && (
            <>
              <span className={styles.testSectionLabel}>Queries ({resultSetKeys.length})</span>
              {resultSetKeys.map(pk => (
                <button
                  key={pk}
                  className={styles.testButton}
                  onClick={() => inspector.openView('query', `Query ${pk.slice(0, 8)}`, pk, { queryPk: pk })}
                >
                  Open query {pk.slice(0, 12)}...
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CanvasTestPanel;
