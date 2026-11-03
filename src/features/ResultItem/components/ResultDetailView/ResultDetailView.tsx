import { FC, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getResultSetById, getResultById, getNodeById, getNodeSpecies } from '@/features/ResultList/slices/resultsSlice';
import { getDataFromQueryVar } from '@/features/Core/utils/urlHelpers';
import { formatBiolinkEntity, formatBiolinkNode } from '@/features/Core/utils/stringFormatters';
import { useResultCounts } from '@/features/ResultItem/hooks/useResultCounts';
import { useDecodedParams } from '@/features/Core/hooks/useDecodedParams';
import { useResultListContext } from '@/features/ResultList/context/ResultListContext';
import { useBookmarkItem } from '@/features/ResultItem/hooks/useBookmarkItem';
import { resultToGraphData } from '@/features/ResultGraphView/utils/graphFunctions';
import ResultDetailViewSkeleton from '@/features/ResultItem/components/ResultDetailViewSkeleton/ResultDetailViewSkeleton';
import ResultDetailTabs from '@/features/ResultItem/components/ResultDetailTabs/ResultDetailTabs';
import ViewNotFound from '@/features/Navigation/components/ViewNotFound/ViewNotFound';
import ClampedDescription from '@/features/ResultItem/components/ClampedDescription/ClampedDescription';
import styles from './ResultDetailView.module.scss';
import ResultItemName from '@/features/ResultItem/components/ResultItemName/ResultItemName';
import ResultItemInteractables from '@/features/ResultItem/components/ResultItemInteractables/ResultItemInteractables';
import BookmarkConfirmationModal from '@/features/ResultItem/components/BookmarkConfirmationModal/BookmarkConfirmationModal';
import { currentUser } from '@/features/UserAuth/slices/userSlice';
import { getNodeDescription, getResultRoleTagsString } from '@/features/ResultItem/utils/utilities';
import ViewTopBar from '@/features/Navigation/components/ViewTopBar/ViewTopBar';
import FilteredOutWrapper from '@/features/Core/components/FilteredOutWrapper/FilteredOutWrapper';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import { useResultCanvasDrag } from '@/features/ResultItem/hooks/useResultCanvasDrag';
import dragStyles from '@/features/DragAndDrop/styles/resultEntityDraggable.module.scss';
import ResultEvidenceSummary from '@/features/ResultItem/components/ResultEvidenceSummary/ResultEvidenceSummary';

const ResultDetailView: FC = () => {
  const { resultId } = useParams();
  const decodedParams = useDecodedParams();
  const queryId = getDataFromQueryVar("q", decodedParams);
  const resultSet = useSelector(getResultSetById(queryId));

  const result = useMemo(() => resultId ? getResultById(resultSet, resultId) : undefined, [resultSet, resultId]);
  const subjectNode = useMemo(() => result ? getNodeById(resultSet, result.subject) : undefined, [resultSet, result]);
  const objectNode = useMemo(() => result ? getNodeById(resultSet, result.object) : undefined, [resultSet, result]);

  const {
    activateNotes,
    activeEntityFilters,
    activeFilters,
    availableFilters,
    handleClearAllFilters,
    isPathfinder,
    pathFilterState,
    pk,
    resultsLoading,
    setShowHiddenPaths,
    showHiddenPaths,
    userSaves,
    visibleResultIds,
  } = useResultListContext();

  const [graphActive, setGraphActive] = useState(false);

  const user = useSelector(currentUser);
  const { evidenceCounts, pathCount } = useResultCounts(resultSet, result);
  const typeString = subjectNode?.types[0] ? formatBiolinkEntity(subjectNode.types[0]) : '';
  const nameString = result?.drug_name && subjectNode ? formatBiolinkNode(result.drug_name, typeString, getNodeSpecies(subjectNode)) : '';
  const resultDescription = subjectNode ? getNodeDescription(subjectNode) : null;
  const resultTags = result?.tags && availableFilters ? getResultRoleTagsString(result.tags, availableFilters) : null;

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
  } = useBookmarkItem({ bookmarkItem, result, resultSet });

  const handleNotesClick = useCallback(async () => {
    await handleNotesClickHook(activateNotes, nameString);
  }, [handleNotesClickHook, activateNotes, nameString]);

  const {
    setNodeRef: setResultDragRef,
    attributes: resultDragAttributes,
    listeners: resultDragListeners,
    isDragging: isResultDragging,
    canDrag: canDragResult,
    onContextMenu: handleResultContextMenu,
  } = useResultCanvasDrag(result?.id, pk);

  const graph = useMemo(() => {
    if (!graphActive || !resultSet?.data || !result) return { nodes: {}, edges: {} };
    return resultToGraphData(result, resultSet.data);
  }, [graphActive, result, resultSet?.data]);

  if (!queryId) {
    return <ViewNotFound entity="query" id="missing" />;
  }

  // The result set can be cached in Redux while the list refetches, so this reads
  // the list's own loading state to stay in sync with `visibleResultIds` below.
  if (resultsLoading) {
    return <ResultDetailViewSkeleton />;
  }

  // Not found
  if (!result) {
    return <ViewNotFound entity="result" id={resultId || 'unknown'} />;
  }

  const isFilteredOut = !visibleResultIds.has(result.id);

  return (
    <div className={styles.resultDetailView}>
      <ViewTopBar/>
      <FilteredOutWrapper
        isFilteredOut={isFilteredOut}
        message="This result has been filtered out."
        onClearFilters={handleClearAllFilters}
      >
        <div className={styles.tableHeader}>
          <span className={styles.tableHeaderRow}></span>
          <span className={styles.tableHeaderRow}></span>
          <span className={styles.tableHeaderRow}>Evidence</span>
          <span className={styles.tableHeaderRow}>Paths</span>
        </div>
        <div className={styles.header}>
          <div className={styles.top}>
            <div className={styles.infoContainer}>
              <div
                ref={setResultDragRef}
                className={joinClasses(
                  styles.nameContainer,
                  canDragResult && dragStyles.draggable,
                  isResultDragging && dragStyles.dragging,
                )}
                onContextMenu={handleResultContextMenu}
                {...resultDragListeners}
                {...resultDragAttributes}
              >
                <ResultItemName
                  isPathfinder={isPathfinder}
                  subjectNode={subjectNode}
                  objectNode={objectNode}
                  item={result}
                  activeEntityFilters={activeEntityFilters}
                  nameString={nameString}
                />
              </div>
                {
                  resultTags && 
                  <div className={styles.tags}>
                    <span className={styles.tagsList}>{resultTags}</span>
                  </div>
                }
                {
                  resultDescription && !isPathfinder && (
                  <ClampedDescription
                    description={resultDescription}
                    searchWords={activeEntityFilters}
                    className={styles.description}
                  />
                )}
            </div>
            <ResultItemInteractables
              handleBookmarkClick={handleBookmarkClick}
              handleNotesClick={handleNotesClick}
              hasNotes={itemHasNotes}
              hasUser={!!user}
              isBookmarked={isBookmarked}
              isEven={false}
              isPathfinder={isPathfinder}
              nameString={nameString}
            />
            <ResultEvidenceSummary evidenceCounts={evidenceCounts} pathCount={pathCount} />
          </div>

        </div>
        <ResultDetailTabs
          activeEntityFilters={activeEntityFilters}
          activeFilters={activeFilters}
          graph={graph}
          graphActive={graphActive}
          pathCount={pathCount}
          pathFilterState={pathFilterState ?? {}}
          pk={pk ?? ''}
          result={result}
          resultSet={resultSet ?? undefined}
          setGraphActive={setGraphActive}
          setShowHiddenPaths={setShowHiddenPaths}
          showHiddenPaths={showHiddenPaths}
        />
      </FilteredOutWrapper>
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
