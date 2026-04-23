import { useCallback, FC, useMemo, memo } from 'react';
import styles from './ResultItem.module.scss';
import { formatBiolinkEntity, formatBiolinkNode, getPathCount } from '@/features/Common/utils/utilities';
import { getARATagsFromResultTags, handleTagClick } from '@/features/ResultItem/utils/utilities';
import { getEvidenceCounts } from '@/features/Evidence/utils/utilities';
import SafeHtmlHighlighter from '@/features/Core/components/SafeHtmlHighlighter/SafeHtmlHighlighter';
import BookmarkConfirmationModal from '@/features/ResultItem/components/BookmarkConfirmationModal/BookmarkConfirmationModal';
import { Save } from '@/features/UserAuth/utils/userApi';
import { useBookmarkItem } from '@/features/ResultItem/hooks/useBookmarkItem';
import { useSelector } from 'react-redux';
import { getResultSetById, getNodeById, getPathById, getNodeSpecies } from '@/features/ResultList/slices/resultsSlice';
import { currentUser } from '@/features/UserAuth/slices/userSlice';
import { displayScore, generateScore, getPathfinderMetapathScore } from '@/features/ResultList/utils/scoring';
import { Result, ResultBookmark } from '@/features/ResultList/types/results';
import { useResultListContext } from '@/features/ResultList/context/ResultListContext';
import ResultItemName from '@/features/ResultItem/components/ResultItemName/ResultItemName';
import ResultItemInteractables from '@/features/ResultItem/components/ResultItemInteractables/ResultItemInteractables';
import ResultItemTag from '@/features/ResultItem/components/ResultItemTag/ResultItemTag';

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
    pk,
    queryNodeID,
    queryNodeLabel,
    queryNodeDescription,
    queryType,
    resultsComplete,
    scoreWeights,
    setShareModalOpen,
    setShareResultID,
    resultsNavigate,
    shouldUpdateResultsAfterBookmark,
    updateUserSaves,
  } = useResultListContext();
  const currentQueryID = pk;

  let resultSet = useSelector(getResultSetById(pk));
  const {confidenceWeight, noveltyWeight, clinicalWeight} = scoreWeights;
  const firstPath = (typeof result.paths[0] === 'string') ? getPathById(resultSet, result.paths[0] as string) : result.paths[0];
  const score = (isPathfinder && firstPath) ? getPathfinderMetapathScore(firstPath) : generateScore(result.scores, confidenceWeight, noveltyWeight, clinicalWeight);

  let roleCount: number = (!!result) ? Object.keys(result.tags).filter(tag => tag.includes("role")).length : 0;

  const evidenceCounts = (!!result.evidenceCount) ? result.evidenceCount : getEvidenceCounts(resultSet, result);
  const user = useSelector(currentUser);

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
  const pathCount: number = (result?.pathCount !== undefined) ? result.pathCount : (!!resultSet) ? getPathCount(resultSet, newPaths) : 0;
  const subjectNode = (!!result) ? getNodeById(resultSet, result.subject) : undefined;
  const objectNode = (!!result) ? getNodeById(resultSet, result.object) : undefined;
  const typeString: string = (!!subjectNode?.types[0]) ? formatBiolinkEntity(subjectNode?.types[0]) : '';
  const nameString: string = (!!result?.drug_name && !!subjectNode) ? formatBiolinkNode(result.drug_name, typeString, getNodeSpecies(subjectNode)) : '';
  const resultDescription = subjectNode?.descriptions[0];

  const handleNotesClick = useCallback(async () => {
    await handleNotesClickHook(activateNotes, nameString);
  }, [handleNotesClickHook, activateNotes, nameString]);

  const handleOpenResultShare = () => {
    setShareResultID(result.id);
    setShareModalOpen(true);
  }

  if(!resultSet)
    return null;

  return (
    <div
      className={`${styles.result} result ${isPathfinder ? styles.pathfinder : ''}`}
      data-result-curie={result.subject}
      data-result-name={nameString}
      data-aras={result.tags ? getARATagsFromResultTags(result.tags).toString() : ''}
      onClick={handleResultClick}
    >
      <div className={styles.top}>
        <div className={`${styles.nameContainer} ${styles.resultSub}`}>
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
          isEven={isEven}
          isPathfinder={isPathfinder}
          nameString={nameString}
        />
        <div className={`${styles.evidenceContainer} ${styles.resultSub}`}>
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
      <div
        className={`${styles.accordionPanel} ${(roleCount > 0 && !isInUserSave) ? styles.hasTags : ''}
          ${(!!resultDescription && !isPathfinder) ? styles.hasDescription : '' } ${!!isInUserSave && styles.inUserSave}
        `}
        >
        <div className={styles.container}>
          <div>
            {
              result.tags && roleCount > 0 && availableFilters &&
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
            }
            {
              !!resultDescription && !isPathfinder &&
              <p className={styles.description}>
                <SafeHtmlHighlighter
                  stripHtml
                  htmlString={resultDescription}
                  searchWords={activeEntityFilters}
                  highlightClassName="highlight"
                />
              </p>
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
