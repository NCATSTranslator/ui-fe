import { FC, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getResultSetById, getNodeById } from '@/features/ResultList/slices/resultsSlice';
import { formatBiolinkEntity } from '@/features/Core/utils/stringFormatters';
import { getEvidenceCounts } from '@/features/Evidence/utils/utilities';
import { getPathCount } from '@/features/Core/utils/resultHelpers';
import type { InspectorQueryData } from '@/features/Canvas/types/canvas';
import type { CanvasInspectorState } from '@/features/Canvas/hooks/useCanvasInspector';
import styles from './InspectorViews.module.scss';

interface InspectorQueryViewProps {
  data: InspectorQueryData;
  inspector: CanvasInspectorState;
  onAddAllToGraph?: () => void;
}

const InspectorQueryView: FC<InspectorQueryViewProps> = ({ data, inspector, onAddAllToGraph }) => {
  const resultSet = useSelector(getResultSetById(data.queryPk));

  const results = useMemo(() => {
    if (!resultSet) return [];
    return resultSet.data.results.map(result => {
      const subjectNode = getNodeById(resultSet, result.subject);
      const objectNode = getNodeById(resultSet, result.object);
      const counts = result.evidenceCount ?? getEvidenceCounts(resultSet, result);
      const pathCount = getPathCount(resultSet, result.paths);
      return {
        id: result.id,
        name: result.drug_name || subjectNode?.names[0] || result.subject,
        type: subjectNode?.types[0] ? formatBiolinkEntity(subjectNode.types[0]) : '',
        objectName: objectNode?.names[0],
        evidenceCount: counts ? (counts.publicationCount + counts.clinicalTrialCount + counts.miscCount) : 0,
        pathCount,
      };
    });
  }, [resultSet]);

  if (!resultSet) {
    return <div className={styles.empty}>No results loaded for this query.</div>;
  }

  if (results.length === 0) {
    return <div className={styles.empty}>No results found.</div>;
  }

  return (
    <div className={styles.listView}>
      <div className={styles.listHeader}>
        <span className={styles.listCount}>{results.length} Results</span>
        {onAddAllToGraph && (
          <button className={styles.addToGraphButton} onClick={onAddAllToGraph}>
            Add All to Graph
          </button>
        )}
      </div>
      <div className={styles.list}>
        {results.map(result => (
          <button
            key={result.id}
            className={styles.listItem}
            onClick={() => inspector.pushView('result', result.name, result.id, {
              queryPk: data.queryPk,
              resultId: result.id,
            })}
          >
            <div className={styles.listItemMain}>
              <span className={styles.listItemName}>{result.name}</span>
              {result.type && <span className={styles.listItemType}>{result.type}</span>}
            </div>
            <div className={styles.listItemMeta}>
              {result.evidenceCount > 0 && <span>{result.evidenceCount} evidence</span>}
              {result.pathCount > 0 && <span>{result.pathCount} paths</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default InspectorQueryView;
