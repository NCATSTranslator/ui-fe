import { FC, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getResultSetById, getNodeById } from '@/features/ResultList/slices/resultsSlice';
import { formatBiolinkEntity } from '@/features/Core/utils/stringFormatters';
import { getNodeDescription } from '@/features/ResultItem/utils/utilities';
import type { Annotation } from '@/features/ResultList/types/results.d';
import type { InspectorNodeData, CanvasNode } from '@/features/Canvas/types/canvas';
import { selectActiveCanvas } from '@/features/Canvas/slices/canvasSlice';
import styles from './InspectorViews.module.scss';

const resolveNodeData = (
  resultNode: ReturnType<typeof getNodeById>,
  canvasNode: CanvasNode | undefined,
  nodeId: string,
) => ({
  name: resultNode?.names[0] || canvasNode?.names[0] || nodeId,
  types: resultNode?.types || canvasNode?.types || [],
  curies: resultNode?.curies || canvasNode?.curies || [],
});

const NodeAnnotations: FC<{ annotations: Annotation | undefined }> = ({ annotations }) => {
  if (!annotations) return null;

  return (
    <>
      {annotations.gene && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Gene Info</h4>
          {annotations.gene.name && <div className={styles.fieldRow}><span className={styles.fieldLabel}>Name</span><span>{annotations.gene.name}</span></div>}
          {annotations.gene.species && <div className={styles.fieldRow}><span className={styles.fieldLabel}>Species</span><span>{annotations.gene.species}</span></div>}
          {annotations.gene.tdl && <div className={styles.fieldRow}><span className={styles.fieldLabel}>TDL</span><span>{annotations.gene.tdl}</span></div>}
        </div>
      )}

      {annotations.chemical && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Chemical Info</h4>
          {annotations.chemical.indications && annotations.chemical.indications.length > 0 && (
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Indications</span>
              <span>{annotations.chemical.indications.join(', ')}</span>
            </div>
          )}
          {annotations.chemical.approval !== null && (
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Approval Year</span>
              <span>{annotations.chemical.approval}</span>
            </div>
          )}
        </div>
      )}

      {annotations.disease?.descriptions && annotations.disease.descriptions.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Disease Info</h4>
          <p className={styles.detailDescription}>{annotations.disease.descriptions[0]}</p>
        </div>
      )}
    </>
  );
};

const NodeDetailSections: FC<{ curies: string[]; types: string[]; annotations: Annotation | undefined }> = ({ curies, types, annotations }) => (
  <>
    {curies.length > 0 && (
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Identifiers</h4>
        <div className={styles.detailList}>
          {curies.map(curie => (
            <span key={curie} className={styles.detailListItem}>{curie}</span>
          ))}
        </div>
      </div>
    )}

    {types.length > 0 && (
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Types</h4>
        <div className={styles.detailList}>
          {types.map(type => (
            <span key={type} className={styles.detailListItem}>{formatBiolinkEntity(type)}</span>
          ))}
        </div>
      </div>
    )}

    <NodeAnnotations annotations={annotations} />
  </>
);

interface InspectorNodeViewProps {
  data: InspectorNodeData;
  onAddToGraph?: () => void;
}

const InspectorNodeView: FC<InspectorNodeViewProps> = ({ data, onAddToGraph }) => {
  const resultSet = useSelector(getResultSetById(data.queryPk ?? null));
  const activeCanvas = useSelector(selectActiveCanvas);

  const resultNode = useMemo(
    () => data.queryPk && resultSet ? getNodeById(resultSet, data.nodeId) : undefined,
    [resultSet, data.queryPk, data.nodeId]
  );

  const canvasNode: CanvasNode | undefined = activeCanvas?.nodes[data.nodeId];
  const { name, types, curies } = resolveNodeData(resultNode, canvasNode, data.nodeId);
  const typeString = types[0] ? formatBiolinkEntity(types[0]) : '';
  const description = resultNode ? getNodeDescription(resultNode) : null;
  const isOnCanvas = !!canvasNode;

  return (
    <div className={styles.detailView}>
      <div className={styles.detailHeader}>
        <div className={styles.detailNameRow}>
          <span className={styles.detailName}>{name}</span>
          {typeString && <span className={styles.typeChip}>{typeString}</span>}
        </div>
        {description && <p className={styles.detailDescription}>{description}</p>}
      </div>

      {onAddToGraph && !isOnCanvas && (
        <button className={styles.addToGraphButton} onClick={onAddToGraph}>
          Add to Graph
        </button>
      )}

      {isOnCanvas && (
        <div className={styles.onCanvasBadge}>On this canvas</div>
      )}

      <NodeDetailSections curies={curies} types={types} annotations={resultNode?.annotations} />
    </div>
  );
};

export default InspectorNodeView;
