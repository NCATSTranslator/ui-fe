import { FC, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { getResultSetById, getResultById, getNodeById, getPathsByIds } from '@/features/ResultList/slices/resultsSlice';
import { formatBiolinkEntity } from '@/features/Core/utils/stringFormatters';
import { getEvidenceCounts } from '@/features/Evidence/utils/utilities';
import { getPathCount, isStringArray } from '@/features/Core/utils/resultHelpers';
import { getNodeDescription } from '@/features/ResultItem/utils/utilities';
import FilteredOutWrapper from '@/features/Core/components/FilteredOutWrapper/FilteredOutWrapper';
import type { InspectorResultData } from '@/features/Canvas/types/canvas';
import type { CanvasInspectorState } from '@/features/Canvas/hooks/useCanvasInspector';
import type { CanvasInspectorFiltersState } from '@/features/Canvas/hooks/useCanvasInspectorFilters';
import type { ResultSet, Result, ResultNode, Path } from '@/features/ResultList/types/results.d';
import type { EvidenceCountsContainer } from '@/features/Evidence/types/evidence';
import styles from './InspectorViews.module.scss';

const EvidenceStatsRow: FC<{ evidenceCounts: EvidenceCountsContainer | null; pathCount: number }> = ({ evidenceCounts, pathCount }) => (
  <div className={styles.statsRow}>
    {evidenceCounts && (
      <>
        {evidenceCounts.publicationCount > 0 && <span className={styles.stat}>Publications: {evidenceCounts.publicationCount}</span>}
        {evidenceCounts.clinicalTrialCount > 0 && <span className={styles.stat}>Clinical Trials: {evidenceCounts.clinicalTrialCount}</span>}
        {evidenceCounts.sourceCount > 0 && <span className={styles.stat}>Sources: {evidenceCounts.sourceCount}</span>}
      </>
    )}
    <span className={styles.stat}>Paths: {pathCount}</span>
  </div>
);

const resolveResultDisplayName = (result: Result, subjectNode: ResultNode | undefined) =>
  result.drug_name || subjectNode?.names[0] || result.subject;

interface PathItemProps {
  path: Path;
  index: number;
  resultSet: ResultSet;
  data: InspectorResultData;
  inspector: CanvasInspectorState;
}

const PathItem: FC<PathItemProps> = ({ path, index, resultSet, data, inspector }) => {
  if (!path.id) return null;
  const pathId = path.id;
  const pathNodes = path.subgraph
    .filter((_, idx) => idx % 2 === 0)
    .map(nodeId => {
      const node = getNodeById(resultSet, nodeId as string);
      return node?.names[0] || nodeId;
    });

  return (
    <button
      className={styles.listItem}
      onClick={() => inspector.pushView('path', `Path ${index + 1}`, pathId, {
        queryPk: data.queryPk,
        resultId: data.resultId,
        pathId,
      })}
    >
      <div className={styles.listItemMain}>
        <span className={styles.listItemName}>Path {index + 1}</span>
      </div>
      <div className={styles.pathPreview}>
        {pathNodes.join(' → ')}
      </div>
    </button>
  );
};

interface FilteredPathListProps {
  paths: Path[];
  resultSet: ResultSet;
  data: InspectorResultData;
  inspector: CanvasInspectorState;
  inspectorFilters?: CanvasInspectorFiltersState;
}

const FilteredPathList: FC<FilteredPathListProps> = ({ paths, resultSet, data, inspector, inspectorFilters }) => {
  const [showExcluded, setShowExcluded] = useState(false);

  const { includedPaths, excludedPaths } = useMemo(() => {
    if (!inspectorFilters || !inspectorFilters.hasActiveFilters) {
      return { includedPaths: paths, excludedPaths: [] as Path[] };
    }
    const included: Path[] = [];
    const excluded: Path[] = [];
    for (const path of paths) {
      if (inspectorFilters.isPathFilteredOut(path)) {
        excluded.push(path);
      } else {
        included.push(path);
      }
    }
    return { includedPaths: included, excludedPaths: excluded };
  }, [paths, inspectorFilters]);

  return (
    <div className={styles.list}>
      {includedPaths.map((path, i) => (
        <PathItem key={path.id ?? i} path={path} index={i} resultSet={resultSet} data={data} inspector={inspector} />
      ))}
      {excludedPaths.length > 0 && (
        <>
          <button
            className={styles.toggleExcludedButton}
            onClick={() => setShowExcluded(prev => !prev)}
            type="button"
          >
            {showExcluded ? 'Hide' : 'View'} {excludedPaths.length} Excluded {excludedPaths.length === 1 ? 'Path' : 'Paths'}
          </button>
          {showExcluded && inspectorFilters && excludedPaths.map((path, i) => (
            <FilteredOutWrapper
              key={path.id ?? `excluded-${i}`}
              isFilteredOut
              message="This path is excluded by active filters."
              onClearFilters={inspectorFilters.clearFilters}
            >
              <PathItem
                path={path}
                index={includedPaths.length + i}
                resultSet={resultSet}
                data={data}
                inspector={inspector}
              />
            </FilteredOutWrapper>
          ))}
        </>
      )}
    </div>
  );
};

interface ResultNodeListProps {
  result: Result;
  subjectNode: ResultNode;
  objectNode: ResultNode | undefined;
  data: InspectorResultData;
  inspector: CanvasInspectorState;
}

const ResultNodeList: FC<ResultNodeListProps> = ({ result, subjectNode, objectNode, data, inspector }) => {
  const subjectTypeString = subjectNode.types[0] ? formatBiolinkEntity(subjectNode.types[0]) : '';
  return (
    <div className={styles.list}>
      <button
        className={styles.listItem}
        onClick={() => inspector.pushView('node', subjectNode.names[0] || result.subject, result.subject, {
          nodeId: result.subject,
          queryPk: data.queryPk,
        })}
      >
        <div className={styles.listItemMain}>
          <span className={styles.listItemName}>{subjectNode.names[0] || result.subject}</span>
          <span className={styles.listItemType}>{subjectTypeString}</span>
        </div>
      </button>
      {objectNode && (
        <button
          className={styles.listItem}
          onClick={() => inspector.pushView('node', objectNode.names[0] || result.object, result.object, {
            nodeId: result.object,
            queryPk: data.queryPk,
          })}
        >
          <div className={styles.listItemMain}>
            <span className={styles.listItemName}>{objectNode.names[0] || result.object}</span>
            {objectNode.types[0] && (
              <span className={styles.listItemType}>{formatBiolinkEntity(objectNode.types[0])}</span>
            )}
          </div>
        </button>
      )}
    </div>
  );
};

interface InspectorResultViewProps {
  data: InspectorResultData;
  inspector: CanvasInspectorState;
  inspectorFilters?: CanvasInspectorFiltersState;
  onAddToGraph?: () => void;
}

const InspectorResultView: FC<InspectorResultViewProps> = ({ data, inspector, inspectorFilters, onAddToGraph }) => {
  const resultSet = useSelector(getResultSetById(data.queryPk));
  const result = useMemo(() => getResultById(resultSet, data.resultId), [resultSet, data.resultId]);
  const subjectNode = useMemo(() => result ? getNodeById(resultSet, result.subject) : undefined, [resultSet, result]);
  const objectNode = useMemo(() => result ? getNodeById(resultSet, result.object) : undefined, [resultSet, result]);

  const evidenceCounts = useMemo(
    () => result ? (result.evidenceCount ?? getEvidenceCounts(resultSet, result)) : null,
    [resultSet, result]
  );
  const pathCount = useMemo(
    () => result && resultSet ? getPathCount(resultSet, result.paths) : 0,
    [resultSet, result]
  );

  const paths = useMemo(() => {
    if (!result || !resultSet) return [];
    if (!isStringArray(result.paths)) return [];
    return getPathsByIds(resultSet, result.paths as string[]);
  }, [resultSet, result]);

  const description = subjectNode ? getNodeDescription(subjectNode) : null;
  const typeString = subjectNode?.types[0] ? formatBiolinkEntity(subjectNode.types[0]) : '';

  if (!result) {
    return <div className={styles.empty}>Result not found.</div>;
  }

  return (
    <div className={styles.detailView}>
      <div className={styles.detailHeader}>
        <div className={styles.detailNameRow}>
          <span className={styles.detailName}>{resolveResultDisplayName(result, subjectNode)}</span>
          {typeString && <span className={styles.typeChip}>{typeString}</span>}
        </div>
        {objectNode && (
          <span className={styles.detailSub}>
            &rarr; {objectNode.names[0] || result.object}
          </span>
        )}
        {description && <p className={styles.detailDescription}>{description}</p>}
      </div>

      <EvidenceStatsRow evidenceCounts={evidenceCounts} pathCount={pathCount} />

      {onAddToGraph && (
        <button className={styles.addToGraphButton} onClick={onAddToGraph}>
          Add to Graph
        </button>
      )}

      {paths.length > 0 && resultSet && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Paths</h4>
          <FilteredPathList
            paths={paths}
            resultSet={resultSet}
            data={data}
            inspector={inspector}
            inspectorFilters={inspectorFilters}
          />
        </div>
      )}

      {subjectNode && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Nodes</h4>
          <ResultNodeList
            result={result}
            subjectNode={subjectNode}
            objectNode={objectNode}
            data={data}
            inspector={inspector}
          />
        </div>
      )}
    </div>
  );
};

export default InspectorResultView;
