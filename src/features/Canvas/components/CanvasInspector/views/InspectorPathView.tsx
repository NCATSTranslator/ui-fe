import { FC, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getResultSetById, getPathById, getNodeById, getEdgeById } from '@/features/ResultList/slices/resultsSlice';
import { formatBiolinkEntity } from '@/features/Core/utils/stringFormatters';
import type { InspectorPathData } from '@/features/Canvas/types/canvas';
import type { CanvasInspectorState } from '@/features/Canvas/hooks/useCanvasInspector';
import styles from './InspectorViews.module.scss';

interface InspectorPathViewProps {
  data: InspectorPathData;
  inspector: CanvasInspectorState;
  onAddToGraph?: () => void;
}

const InspectorPathView: FC<InspectorPathViewProps> = ({ data, inspector, onAddToGraph }) => {
  const resultSet = useSelector(getResultSetById(data.queryPk));
  const path = useMemo(() => getPathById(resultSet, data.pathId), [resultSet, data.pathId]);

  const pathElements = useMemo(() => {
    if (!path || !resultSet) return [];
    return path.subgraph.map((id, i) => {
      const isNode = i % 2 === 0;
      if (isNode) {
        const node = getNodeById(resultSet, id as string);
        return {
          kind: 'node' as const,
          id: id as string,
          name: node?.names[0] || id,
          type: node?.types[0] ? formatBiolinkEntity(node.types[0]) : '',
        };
      }
      const edge = getEdgeById(resultSet, id as string);
      return {
        kind: 'edge' as const,
        id: id as string,
        name: edge ? formatBiolinkEntity(edge.predicate) : id,
        type: edge?.inferred ? 'Inferred' : '',
      };
    });
  }, [resultSet, path]);

  if (!path) {
    return <div className={styles.empty}>Path not found.</div>;
  }

  return (
    <div className={styles.detailView}>
      <div className={styles.detailHeader}>
        <span className={styles.detailName}>Path Details</span>
        {path.score !== undefined && (
          <span className={styles.detailSub}>Score: {path.score.toFixed(3)}</span>
        )}
      </div>

      {onAddToGraph && (
        <button className={styles.addToGraphButton} onClick={onAddToGraph}>
          Add Path to Graph
        </button>
      )}

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Path</h4>
        <div className={styles.pathChain}>
          {pathElements.map((el, i) => (
            <div key={`${el.id}-${i}`} className={styles.pathChainItem}>
              {el.kind === 'node' ? (
                <button
                  className={styles.pathNode}
                  onClick={() => inspector.pushView('node', el.name, el.id, {
                    nodeId: el.id,
                    queryPk: data.queryPk,
                  })}
                >
                  <span className={styles.pathNodeName}>{el.name}</span>
                  {el.type && <span className={styles.pathNodeType}>{el.type}</span>}
                </button>
              ) : (
                <button
                  className={styles.pathEdge}
                  onClick={() => inspector.pushView('evidence', el.name, el.id, {
                    queryPk: data.queryPk,
                    edgeId: el.id,
                    pathId: data.pathId,
                    resultId: data.resultId,
                  })}
                >
                  <span className={styles.pathEdgeLabel}>{el.name}</span>
                  {el.type && <span className={styles.pathEdgeInferred}>{el.type}</span>}
                </button>
              )}
              {i < pathElements.length - 1 && el.kind === 'node' && (
                <span className={styles.pathArrow}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {path.aras && path.aras.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>ARAs</h4>
          <div className={styles.detailList}>
            {path.aras.map(ara => (
              <span key={ara} className={styles.detailListItem}>{ara}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectorPathView;
