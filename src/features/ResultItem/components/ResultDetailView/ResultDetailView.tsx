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
import { useBookmarkItem } from '@/features/ResultItem/hooks/useBookmarkItem';
import { Path } from '@/features/ResultList/types/results';
import PathView from '@/features/ResultItem/components/PathView/PathView';
import LoadingBar from '@/features/Core/components/LoadingBar/LoadingBar';
import Tabs from '@/features/Common/components/Tabs/Tabs';
import Tab from '@/features/Common/components/Tabs/Tab';
import { resultToCytoscape } from '@/features/ResultItem/utils/graphFunctions';
import ResultDetailViewSkeleton from '@/features/ResultItem/components/ResultDetailViewSkeleton/ResultDetailViewSkeleton';
import ViewNotFound from '@/features/Navigation/components/ViewNotFound/ViewNotFound';
import SafeHtmlHighlighter from '@/features/Core/components/SafeHtmlHighlighter/SafeHtmlHighlighter';
import styles from './ResultDetailView.module.scss';
import ResultItemName from '@/features/ResultItem/components/ResultItemName/ResultItemName';
import ResultItemInteractables from '@/features/ResultItem/components/ResultItemInteractables/ResultItemInteractables';
import BookmarkConfirmationModal from '@/features/ResultItem/components/BookmarkConfirmationModal/BookmarkConfirmationModal';
import { currentUser } from '@/features/UserAuth/slices/userSlice';
import { sortTagsBySelected, handleTagClick } from '@/features/ResultItem/utils/utilities';
import ResultItemTag from '@/features/ResultItem/components/ResultItemTag/ResultItemTag';

const GraphView = lazy(() => import('@/features/ResultItem/components/GraphView/GraphView'));

const ResultDetailView: FC = () => {
  const { resultId } = useParams();
  const decodedParams = useDecodedParams();
  const queryId = getDataFromQueryVar("q", decodedParams);
  const resultSet = useSelector(getResultSetById(queryId));
  const queryStatus = useSelector(getQueryStatusById(queryId));

  const result = useMemo(() => resultId ? getResultById(resultSet, resultId) : undefined, [resultSet, resultId]);
  const subjectNode = useMemo(() => result ? getNodeById(resultSet, result.subject) : undefined, [resultSet, result]);
  const objectNode = useMemo(() => result ? getNodeById(resultSet, result.object) : undefined, [resultSet, result]);
  let roleCount: number = (!!result) ? Object.keys(result.tags).filter(tag => tag.includes("role")).length : 0;

  const {
    activateNotes,
    activeEntityFilters,
    activeFilters,
    availableFilters,
    bookmarkAddedToast,
    bookmarkRemovedToast,
    handleBookmarkError,
    handleFilter,
    isPathfinder,
    navigateToEvidenceView,
    pathFilterState,
    pk,
    queryNodeDescription,
    queryNodeID,
    queryNodeLabel,
    queryType,
    resultsComplete,
    scoreWeights,
    setShareModalOpen,
    setShareResultID,
    setShowHiddenPaths,
    showHiddenPaths,
    shouldUpdateResultsAfterBookmark,
    updateUserSaves,
    userSaves,
    zoomKeyDown
  } = useResultListContext();


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

  const user = useSelector(currentUser);
  const evidenceCounts = result ? (result.evidenceCount ?? getEvidenceCounts(resultSet, result)) : null;
  const pathCount = result && resultSet ? getPathCount(resultSet, result.paths) : 0;
  const typeString = subjectNode?.types[0] ? formatBiolinkEntity(subjectNode.types[0]) : '';
  const nameString = result?.drug_name && subjectNode ? formatBiolinkNode(result.drug_name, typeString, getNodeSpecies(subjectNode)) : '';
  const resultDescription = subjectNode?.descriptions[0];

  const bookmarkItem = useMemo(
    () => (result ? userSaves?.saves.get(result.id) ?? null : null),
    [userSaves, result]
  );

  const {
    isBookmarked,
    hasNotes: itemHasNotes,
    confirmModalOpen: bookmarkRemovalConfirmationModalOpen,
    setConfirmModalOpen: setBookmarkRemovalConfirmationModalOpen,
    handleBookmarkClick,
    handleNotesClick: handleNotesClickHook,
    handleRemovalApproval: handleBookmarkRemovalApproval,
    resetRemovalApproval,
  } = useBookmarkItem({
    bookmarkItem,
    result,
    resultSet,
    queryNodeID,
    queryNodeLabel,
    queryNodeDescription,
    queryType,
    currentQueryID: pk,
    bookmarkAddedToast,
    bookmarkRemovedToast,
    handleBookmarkError,
    updateUserSaves,
    shouldUpdateResultsAfterBookmark,
  });

  const handleNotesClick = useCallback(async () => {
    await handleNotesClickHook(activateNotes, nameString);
  }, [handleNotesClickHook, activateNotes, nameString]);

  const handleOpenResultShare = useCallback(() => {
    if (!result) return;
    setShareResultID(result.id);
    setShareModalOpen(true);
  }, [result, setShareResultID, setShareModalOpen]);

  const graph = useMemo(() => {
    if (!resultSet || !result) return { nodes: [], edges: [] };
    return resultToCytoscape(result, resultSet.data);
  }, [result, resultSet]);

  if (!queryId) {
    return <ViewNotFound entity="query" id="missing" />;
  }

  // Loading state
  if (!resultSet && (!queryStatus || queryStatus.isLoading)) {
    return <ResultDetailViewSkeleton />;
  }

  // Not found
  if (!result) {
    return <ViewNotFound entity="result" id={resultId || 'unknown'} />;
  }

  return (
    <div className={styles.resultDetailView}>
      <div className={styles.tableHeader}>
        <span className={styles.tableHeaderRow}>Name</span>
        <span className={styles.tableHeaderRow}></span>
        <span className={styles.tableHeaderRow}>Evidence</span>
        <span className={styles.tableHeaderRow}>Paths</span>
        <span className={styles.tableHeaderRow}>Score</span>
      </div>
      <div className={styles.header}>
        <div className={styles.top}>
          <div className={styles.nameContainer}>
            <ResultItemName
              isPathfinder={isPathfinder}
              subjectNode={subjectNode}
              objectNode={objectNode}
              item={result}
              activeEntityFilters={activeEntityFilters}
              nameString={nameString}
            />
          </div>
          <ResultItemInteractables
            handleBookmarkClick={handleBookmarkClick}
            handleNotesClick={handleNotesClick}
            handleOpenResultShare={handleOpenResultShare}
            hasNotes={itemHasNotes}
            hasUser={!!user}
            isBookmarked={isBookmarked}
            isEven={false}
            isPathfinder={isPathfinder}
            nameString={nameString}
          />
          <div className={`${styles.evidenceContainer} ${styles.resultSub}`}>
            <span className={styles.evidenceLink}>
              <div>
                {
                  evidenceCounts && evidenceCounts.publicationCount > 0  &&
                  <span className={styles.info}>Publications ({evidenceCounts.publicationCount})</span>
                }
                {
                  evidenceCounts && evidenceCounts.clinicalTrialCount > 0  &&
                  <span className={styles.info}>Clinical Trials ({evidenceCounts.clinicalTrialCount})</span>
                }
                {
                  evidenceCounts && evidenceCounts.miscCount > 0  &&
                  <span className={styles.info}>Misc ({evidenceCounts.miscCount})</span>
                }
                {
                  evidenceCounts && evidenceCounts.sourceCount > 0  &&
                  <span className={styles.info}>Sources ({evidenceCounts.sourceCount})</span>
                }
              </div>
            </span>
          </div>
          <div className={`${styles.pathsContainer} ${styles.resultSub}`}>
            <span className={styles.paths}>
              <span className={styles.pathsNum}>{ pathCount } {pathCount > 1 ? "Paths" : "Path"}</span>
            </span>
          </div>
          <div className={`${styles.scoreContainer} ${styles.resultSub}`}>
            <span className={styles.score}>
              <span className={styles.scoreNum}>{resultsComplete ? score === null ? '0.00' : displayScore(score, 2) : "Processing..." }</span>
            </span>
          </div>
        </div>
        {
        result.tags && roleCount > 0 && availableFilters && (
          <div className={styles.tags}>
            {
              // Object.keys(result.tags).toSorted((a, b)=>sortTagsBySelected(a, b, activeFilters)).map((fid) => {
              Object.keys(result.tags).map((fid) => {
                return(
                  <ResultItemTag
                    activeFilters={activeFilters}
                    availableFilters={availableFilters}
                    fid={fid}
                    handleFilter={handleFilter}
                    handleTagClick={handleTagClick}
                  />
                )
              })
            }
          </div>
        )}
        {
          resultDescription && !isPathfinder && (
          <p className={styles.description}>
            <SafeHtmlHighlighter
              htmlString={resultDescription}
              searchWords={activeEntityFilters}
              highlightClassName="highlight"
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
      <BookmarkConfirmationModal
        isOpen={bookmarkRemovalConfirmationModalOpen}
        onApprove={handleBookmarkRemovalApproval}
        onClose={() => {
          setBookmarkRemovalConfirmationModalOpen(false);
          resetRemovalApproval();
        }}
      />
    </div>
  );
};

export default ResultDetailView;
