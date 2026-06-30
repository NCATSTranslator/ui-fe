import { useCallback, FC, useMemo, memo } from 'react';
import styles from './ResultItem.module.scss';
import { formatBiolinkEntity, formatBiolinkNode } from '@/features/Core/utils/stringFormatters';
import { getPathCount } from '@/features/Core/utils/resultHelpers';
import { getARATagsFromResultTags, getNodeDescription, handleTagClick } from '@/features/ResultItem/utils/utilities';
import { getEvidenceCounts } from '@/features/Evidence/utils/utilities';
import ClampedDescription from '@/features/ResultItem/components/ClampedDescription/ClampedDescription';
import BookmarkConfirmationModal from '@/features/ResultItem/components/BookmarkConfirmationModal/BookmarkConfirmationModal';
import { Save } from '@/features/UserAuth/utils/userApi';
import { useBookmarkItem } from '@/features/ResultItem/hooks/useBookmarkItem';
import { useSelector } from 'react-redux';
import { getResultSetById, getNodeById, getNodeSpecies } from '@/features/ResultList/slices/resultsSlice';
import { currentUser } from '@/features/UserAuth/slices/userSlice';
import { Result, ResultBookmark } from '@/features/ResultList/types/results';
import { useResultListContext } from '@/features/ResultList/context/ResultListContext';
import ResultItemName from '@/features/ResultItem/components/ResultItemName/ResultItemName';
import ResultItemInteractables from '@/features/ResultItem/components/ResultItemInteractables/ResultItemInteractables';
import ResultItemTag from '@/features/ResultItem/components/ResultItemTag/ResultItemTag';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import PathView from '@/features/ResultItem/components/PathView/PathView';
import { useDecodedParams } from '@/features/Core/hooks/useDecodedParams';
import { getDataFromQueryVar } from '@/features/Core/utils/urlHelpers';

type ResultItemProps = {
  bookmarkItem?: Save | null;
  isEven: boolean;
  isInUserSave?: boolean;
  result: Result | ResultBookmark;
}

const ResultItem: FC<ResultItemProps> = ({
    bookmarkItem,
    isEven = false,
    isInUserSave = false,
    result
  }) => {

  const {
    activateNotes,
    activeEntityFilters,
    activeFilters,
    availableFilters,
    handleFilter,
    bookmarkAddedToast,
    bookmarkRemovedToast,
    handleBookmarkError,
    isPathfinder,
    pathFilterState,
    setShowHiddenPaths,
    showHiddenPaths,
    pk,
    queryNodeID,
    queryNodeLabel,
    queryNodeDescription,
    queryType,
    resultsNavigate,
    shouldUpdateResultsAfterBookmark,
    updateUserSaves,
  } = useResultListContext();
  const currentQueryID = pk;
  const resultSet = useSelector(getResultSetById(pk));
  const roleCount: number = (!!result) ? Object.keys(result.tags).filter(tag => tag.includes("role")).length : 0;
  const evidenceCounts = (!!result.evidenceCount) ? result.evidenceCount : getEvidenceCounts(resultSet, result);
  const user = useSelector(currentUser);
  const decodedParams = useDecodedParams();
  const isLookup = getDataFromQueryVar("t", decodedParams) === 'l';

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
    bookmarkItem: bookmarkItem ?? null,
    result,
    resultSet,
    queryNodeID,
    queryNodeLabel,
    queryNodeDescription,
    queryType,
    currentQueryID,
    bookmarkAddedToast,
    bookmarkRemovedToast,
    handleBookmarkError,
    updateUserSaves,
    shouldUpdateResultsAfterBookmark,
  });

  const handleResultClick = useCallback(() => {
    resultsNavigate(`/results/${result.id}`);
  }, [resultsNavigate, result.id]);

  const newPaths = useMemo(()=>(!!result) ? result.paths: [], [result]);
  const pathCount: number = useMemo(() => {
    if(result?.pathCount !== undefined) return result.pathCount;
    if(!resultSet) return 0;
    return getPathCount(resultSet, newPaths);
  }, [result?.pathCount, resultSet, newPaths]);
  const subjectNode = useMemo(() => getNodeById(resultSet, result.subject), [resultSet, result.subject]);
  const objectNode = useMemo(() => getNodeById(resultSet, result.object), [resultSet, result.object]);
  const typeString: string = (!!subjectNode?.types[0]) ? formatBiolinkEntity(subjectNode?.types[0]) : '';
  const nameString: string = (!!result?.drug_name && !!subjectNode) ? formatBiolinkNode(result.drug_name, typeString, getNodeSpecies(subjectNode)) : '';
  const resultDescription = subjectNode ? getNodeDescription(subjectNode) : null;

  const accordionPanelClass = joinClasses(styles.accordionPanel, roleCount > 0 && !isInUserSave && styles.hasTags, (!!resultDescription && !isPathfinder) && styles.hasDescription, !!isInUserSave && styles.inUserSave);

  const handleNotesClick = useCallback(async () => {
    await handleNotesClickHook(activateNotes, nameString);
  }, [handleNotesClickHook, activateNotes, nameString]);

  if(!resultSet)
    return null;


  return (
    <div
      className={joinClasses('result', styles.result, isPathfinder && styles.pathfinder)}
      data-result-curie={result.subject}
      data-result-name={nameString}
      data-aras={result.tags ? getARATagsFromResultTags(result.tags).toString() : ''}
      onClick={handleResultClick}
    >
      <div className={styles.top}>
        <div className={joinClasses(styles.nameContainer, styles.resultSub)}>
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
          hasNotes={itemHasNotes}
          hasUser={!!user}
          isBookmarked={isBookmarked}
          isEven={isEven}
          isPathfinder={isPathfinder}
          nameString={nameString}
        />
        <div className={joinClasses(styles.evidenceContainer, styles.resultSub)}>
          <span className={styles.evidenceLink}>
            <div>
              {
                evidenceCounts.publicationCount > 0  &&
                <span className={styles.info}>Publications ({evidenceCounts.publicationCount})</span>
              }
              {
                evidenceCounts.clinicalTrialCount > 0  &&
                <span className={styles.info}>Clinical Trials ({evidenceCounts.clinicalTrialCount})</span>
              }
              {
                evidenceCounts.miscCount > 0  &&
                <span className={styles.info}>Misc ({evidenceCounts.miscCount})</span>
              }
              {
                evidenceCounts.sourceCount > 0  &&
                <span className={styles.info}>Sources ({evidenceCounts.sourceCount})</span>
              }
            </div>
          </span>
        </div>
        <div className={joinClasses(styles.pathsContainer, styles.resultSub)}>
          <span className={styles.paths}>
            <span className={styles.pathsNum}>{ pathCount } {pathCount > 1 ? "Paths" : "Path"}</span>
          </span>
        </div>
      </div>
      <div
        className={accordionPanelClass}
        >
        <div className={styles.container}>
          <div>
            {
              result.tags && roleCount > 0 && availableFilters &&
              <div className={styles.tags}>
                {
                  Object.keys(result.tags).map((fid) => {
                    return(
                      <ResultItemTag
                        key={fid}
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
            }
            {
              !!resultDescription && !isPathfinder &&
              <ClampedDescription
                description={resultDescription}
                searchWords={activeEntityFilters}
                className={styles.description}
              />
            }
            {
              isLookup &&
              <div className={styles.lookupPathViewContainer}>
                <PathView
                  active
                  activeEntityFilters={activeEntityFilters}
                  activeFilters={activeFilters}
                  isEven={isEven}
                  isLookup
                  pathArray={result.paths}
                  pathFilterState={pathFilterState ?? {}}
                  pk={pk ?? ''}
                  resultId={result.id}
                  setShowHiddenPaths={setShowHiddenPaths}
                  showHiddenPaths={showHiddenPaths}
                />
              </div>
            }
          </div>
        </div>
      </div>
      <BookmarkConfirmationModal
        isOpen={bookmarkRemovalConfirmationModalOpen}
        onApprove={handleBookmarkRemovalApproval}
        onClose={()=>{
          setBookmarkRemovalConfirmationModalOpen(false);
          resetRemovalApproval();
        }}
      />
    </div>
  );
}

export default memo(ResultItem);
