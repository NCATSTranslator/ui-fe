import { FC, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getResultSetById, getEdgeById, getNodeById, getEdgeProvenance } from '@/features/ResultList/slices/resultsSlice';
import { formatBiolinkEntity } from '@/features/Core/utils/stringFormatters';
import type { ResultSet, ResultEdge } from '@/features/ResultList/types/results.d';
import type { Provenance } from '@/features/Evidence/types/evidence';
import type { InspectorEvidenceData } from '@/features/Canvas/types/canvas';
import styles from './InspectorViews.module.scss';

const getEdgeNodeNames = (resultSet: ResultSet | null, edge: ResultEdge) => {
  const subjectNode = edge ? getNodeById(resultSet, edge.subject) : undefined;
  const objectNode = edge ? getNodeById(resultSet, edge.object) : undefined;
  return {
    subjectName: subjectNode?.names[0] || edge.subject,
    objectName: objectNode?.names[0] || edge.object,
  };
};

const ProvenanceSection: FC<{ provenance: Provenance[] }> = ({ provenance }) => (
  <div className={styles.section}>
    <h4 className={styles.sectionTitle}>Knowledge Sources</h4>
    <div className={styles.list}>
      {provenance.map(source => (
        <div key={source.infores} className={styles.sourceItem}>
          <span className={styles.sourceName}>{source.name || source.infores}</span>
          {source.knowledge_level && (
            <span className={styles.sourceLevel}>{source.knowledge_level}</span>
          )}
        </div>
      ))}
    </div>
  </div>
);

interface InspectorEvidenceViewProps {
  data: InspectorEvidenceData;
  onAddToGraph?: () => void;
}

const InspectorEvidenceView: FC<InspectorEvidenceViewProps> = ({ data, onAddToGraph }) => {
  const resultSet = useSelector(getResultSetById(data.queryPk));
  const edge = useMemo(() => getEdgeById(resultSet, data.edgeId), [resultSet, data.edgeId]);
  const provenance = useMemo(() => getEdgeProvenance(resultSet, edge), [resultSet, edge]);
  const { subjectName, objectName } = useMemo(
    () => edge ? getEdgeNodeNames(resultSet, edge) : { subjectName: '', objectName: '' },
    [resultSet, edge]
  );

  const pubCount = useMemo(() => {
    if (!edge?.publications) return 0;
    return Object.values(edge.publications).reduce((sum, pubs) => sum + pubs.length, 0);
  }, [edge]);

  const trialCount = edge?.trials?.length ?? 0;

  if (!edge) {
    return <div className={styles.empty}>Edge not found.</div>;
  }

  const predicateLabel = formatBiolinkEntity(edge.predicate);

  return (
    <div className={styles.detailView}>
      <div className={styles.detailHeader}>
        <div className={styles.edgeLabel}>
          <span className={styles.edgeNodeName}>{subjectName}</span>
          <span className={styles.edgePredicate}>{predicateLabel}</span>
          <span className={styles.edgeNodeName}>{objectName}</span>
        </div>
        {edge.inferred && <span className={styles.typeChip}>Inferred</span>}
      </div>

      {onAddToGraph && (
        <button className={styles.addToGraphButton} onClick={onAddToGraph}>
          Add to Graph
        </button>
      )}

      <div className={styles.statsRow}>
        {pubCount > 0 && <span className={styles.stat}>Publications: {pubCount}</span>}
        {trialCount > 0 && <span className={styles.stat}>Clinical Trials: {trialCount}</span>}
        {provenance.length > 0 && <span className={styles.stat}>Sources: {provenance.length}</span>}
      </div>

      {provenance.length > 0 && <ProvenanceSection provenance={provenance} />}

      {edge.description && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Description</h4>
          <p className={styles.detailDescription}>{edge.description}</p>
        </div>
      )}
    </div>
  );
};

export default InspectorEvidenceView;
