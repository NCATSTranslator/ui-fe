import { FC, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getResultSetById, getResultById, getNodeById, getNodeSpecies } from '@/features/ResultList/slices/resultsSlice';
import { getQueryStatusById } from '@/features/ResultList/slices/queryStatusSlice';
import { getDataFromQueryVar, formatBiolinkEntity, formatBiolinkNode, getPathCount } from '@/features/Common/utils/utilities';
import { getEvidenceCounts } from '@/features/Evidence/utils/utilities';
import { displayScore, generateScore, getPathfinderMetapathScore } from '@/features/ResultList/utils/scoring';
import { useDecodedParams } from '@/features/Core/hooks/useDecodedParams';
import { useResultListContext } from '@/features/ResultList/context/ResultListContext';
import { Path } from '@/features/ResultList/types/results';
import PathView from '@/features/ResultItem/components/PathView/PathView';
import LoadingBar from '@/features/Core/components/LoadingBar/LoadingBar';
import Tabs from '@/features/Common/components/Tabs/Tabs';
import Tab from '@/features/Common/components/Tabs/Tab';
import { resultToCytoscape } from '@/features/ResultItem/utils/graphFunctions';
import ViewSkeleton from '@/features/Navigation/components/ViewSkeleton/ViewSkeleton';
import ViewNotFound from '@/features/Navigation/components/ViewNotFound/ViewNotFound';
import Highlighter from 'react-highlight-words';
import styles from './ResultDetailView.module.scss';

const GraphView = lazy(() => import('@/features/ResultItem/components/GraphView/GraphView'));

const ResultDetailView: FC = () => {
  const { resultId } = useParams();
  const decodedParams = useDecodedParams();
  const queryId = getDataFromQueryVar("q", decodedParams);
  const resultSet = useSelector(getResultSetById(queryId));
  const queryStatus = useSelector(getQueryStatusById(queryId));

  const result = useMemo(() => resultId ? getResultById(resultSet, resultId) : undefined, [resultSet, resultId]);
  const subjectNode = useMemo(() => result ? getNodeById(resultSet, result.subject) : undefined, [resultSet, result]);

  const ctx = useResultListContext();

  const {
    isPathfinder,
    activeEntityFilters,
    activeFilters,
    pathFilterState,
    scoreWeights,
    showHiddenPaths,
    setShowHiddenPaths,
    resultsComplete,
    zoomKeyDown,
    pk,
    navigateToEvidenceView,
  } = ctx;

  const [graphActive, setGraphActive] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<Set<Path> | null>(null);
  const handleClearSelectedPaths = useCallback(() => setSelectedPaths(null), []);

  const handleEdgeSpecificEvidence = useCallback((edgeIDs: string[], path: Path) => {
    if (!result) return;
    navigateToEvidenceView(result, edgeIDs, path);
  }, [result, navigateToEvidenceView]);
  
  const handleActivateEvidence = useCallback((path: Path) => {
    if (!result) return;
    if (path.subgraph[1]) navigateToEvidenceView(result, [path.subgraph[1]], path);
  }, [result, navigateToEvidenceView]);

  const firstPath = result?.paths[0];
  const firstPathObj = typeof firstPath === 'string' ? null : firstPath;
  const score = result
    ? isPathfinder && firstPathObj
      ? getPathfinderMetapathScore(firstPathObj)
      : generateScore(result.scores, scoreWeights.confidenceWeight, scoreWeights.noveltyWeight, scoreWeights.clinicalWeight)
    : null;

  const evidenceCounts = result ? (result.evidenceCount ?? getEvidenceCounts(resultSet, result)) : null;
  const pathCount = result && resultSet ? getPathCount(resultSet, result.paths) : 0;
  const typeString = subjectNode?.types[0] ? formatBiolinkEntity(subjectNode.types[0]) : '';
  const nameString = result?.drug_name && subjectNode ? formatBiolinkNode(result.drug_name, typeString, getNodeSpecies(subjectNode)) : '';
  const resultDescription = subjectNode?.descriptions[0];

  const graph = useMemo(() => {
    if (!resultSet || !result) return { nodes: [], edges: [] };
    return resultToCytoscape(result, resultSet.data);
  }, [result, resultSet]);

  if (!queryId) {
    return <ViewNotFound entity="query" id="missing" />;
  }

  // Loading state
  if (!resultSet && (!queryStatus || queryStatus.isLoading)) {
    return <ViewSkeleton statusMessage="Loading results..." />;
  }

  // Not found
  if (!result) {
    return <ViewNotFound entity="result" id={resultId || 'unknown'} />;
  }

  return (
    <div className={styles.resultDetailView}>
      <div className={styles.header}>
        <div className={styles.nameRow}>
          <h4 className={styles.name}>{nameString}</h4>
        </div>
        <div className={styles.meta}>
          {evidenceCounts && evidenceCounts.publicationCount > 0 && (
            <span className={styles.metaItem}>Publications ({evidenceCounts.publicationCount})</span>
          )}
          {evidenceCounts && evidenceCounts.clinicalTrialCount > 0 && (
            <span className={styles.metaItem}>Clinical Trials ({evidenceCounts.clinicalTrialCount})</span>
          )}
          <span className={styles.metaItem}>{pathCount} {pathCount === 1 ? 'Path' : 'Paths'}</span>
          <span className={styles.metaItem}>Score: {resultsComplete ? score === null ? '0.00' : displayScore(score, 2) : 'Processing...'}</span>
        </div>
        {resultDescription && !isPathfinder && (
          <p className={styles.description}>
            <Highlighter
              highlightClassName="highlight"
              searchWords={activeEntityFilters}
              autoEscape
              textToHighlight={resultDescription}
            />
          </p>
        )}
      </div>
      <Tabs
        isOpen
        className={styles.tabs}
        handleTabSelection={(heading) => setGraphActive(heading === 'Graph')}
      >
        <Tab heading="Paths" className={styles.pathsTab}>
          <PathView
            active
            activeEntityFilters={activeEntityFilters}
            activeFilters={activeFilters}
            handleEdgeSpecificEvidence={handleEdgeSpecificEvidence}
            handleActivateEvidence={handleActivateEvidence}
            isEven={false}
            pathArray={result.paths}
            pathFilterState={pathFilterState ?? {}}
            pk={pk ?? ''}
            selectedPaths={selectedPaths}
            setShowHiddenPaths={setShowHiddenPaths}
            showHiddenPaths={showHiddenPaths}
          />
        </Tab>
        <Tab heading="Graph">
          <Suspense fallback={<LoadingBar useIcon reducedPadding />}>
            <GraphView
              graph={graph}
              result={result}
              resultSet={resultSet}
              clearSelectedPaths={handleClearSelectedPaths}
              active={graphActive}
              zoomKeyDown={zoomKeyDown}
            />
          </Suspense>
        </Tab>
      </Tabs>
    </div>
  );
};

export default ResultDetailView;
