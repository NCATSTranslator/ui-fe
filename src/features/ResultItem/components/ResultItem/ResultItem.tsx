import { useState, useEffect, useCallback, useRef, FC, useMemo, memo } from 'react';
import styles from './ResultItem.module.scss';
import { formatBiolinkEntity, formatBiolinkNode, getPathCount } from '@/features/Common/utils/utilities';
import { getARATagsFromResultTags } from '@/features/ResultItem/utils/utilities';
import { getEvidenceCounts } from '@/features/Evidence/utils/utilities';
import Highlighter from 'react-highlight-words';
import BookmarkConfirmationModal from '@/features/ResultItem/components/BookmarkConfirmationModal/BookmarkConfirmationModal';
import { Save } from '@/features/UserAuth/utils/userApi';
import { useBookmarkItem } from '@/features/ResultItem/hooks/useBookmarkItem';
import { useSelector } from 'react-redux';
import { getResultSetById, getNodeById, getPathById, getNodeSpecies } from '@/features/ResultList/slices/resultsSlice';
import { currentUser } from '@/features/UserAuth/slices/userSlice';
import { displayScore, generateScore, getPathfinderMetapathScore } from '@/features/ResultList/utils/scoring';
import { Result, ResultBookmark } from '@/features/ResultList/types/results';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { useResultListContext } from '@/features/ResultList/context/ResultListContext';
import * as filtering from '@/features/ResultFiltering/utils/filterFunctions';
import ResultItemName from '@/features/ResultItem/components/ResultItemName/ResultItemName';
import ResultItemInteractables from '@/features/ResultItem/components/ResultItemInteractables/ResultItemInteractables';

const sortTagsBySelected = (
  a: string,
  b: string,
  selected: [{id: string;}] | Filter[]
): number => {
  const aExistsInSelected = selected.some((item) => item.id === a);
  const bExistsInSelected = selected.some((item) => item.id === b);

  if (aExistsInSelected && bExistsInSelected) return 0;
  if (aExistsInSelected) return -1;
  if (bExistsInSelected) return 1;

  return 0;
};

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
    availableFilters: availableTags,
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

  const tagsRef = useRef<HTMLDivElement>(null);
  const [tagsHeight, setTagsHeight] = useState<number>(0);
  const minTagsHeight = 45;

  useEffect(() => {
    if(!tagsRef.current)
      return;

    const resizeObserver = new ResizeObserver(() => {
      if(tagsRef.current !== null)
      setTagsHeight(tagsRef.current.clientHeight);
    });

    resizeObserver.observe(tagsRef.current);
    return() => {
      resizeObserver.disconnect();
    };
  },[]);

  const pathCount: number = (!!resultSet) ? getPathCount(resultSet, newPaths) : 0;
  const subjectNode = (!!result) ? getNodeById(resultSet, result.subject) : undefined;
  const objectNode = (!!result) ? getNodeById(resultSet, result.object) : undefined;
  const typeString: string = (!!subjectNode?.types[0]) ? formatBiolinkEntity(subjectNode?.types[0]) : '';
  const nameString: string = (!!result?.drug_name && !!subjectNode) ? formatBiolinkNode(result.drug_name, typeString, getNodeSpecies(subjectNode)) : '';
  const resultDescription = subjectNode?.descriptions[0];

  const handleNotesClick = useCallback(async () => {
    await handleNotesClickHook(activateNotes, nameString);
  }, [handleNotesClickHook, activateNotes, nameString]);

  const handleTagClick = (filterID: string, filter: Filter) => {
    let newObj: Filter = {
      name: filter.name,
      negated: false,
      id: filterID,
      value: filter.name
    };
    handleFilter(newObj);
  }

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
    >
      <div className={styles.top}>
        <div className={`${styles.nameContainer} ${styles.resultSub}`} onClick={handleResultClick}>
          <ResultItemName
            isPathfinder={isPathfinder}
            subjectNode={subjectNode}
            objectNode={objectNode}
            item={result}
            activeEntityFilters={activeEntityFilters}
            nameString={nameString}
            ResultItemStyles={styles}
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
              result.tags && roleCount > 0 && availableTags &&
              <div className={`${styles.tags} ${tagsHeight > minTagsHeight ? styles.more : '' }`} ref={tagsRef}>
                {
                  Object.keys(result.tags).toSorted((a, b)=>sortTagsBySelected(a, b, activeFilters)).map((fid) => {
                    if (!(filtering.getTagFamily(fid) === filtering.CONSTANTS.FAMILIES.ROLE)) return null;
                    const tag = availableTags[fid];
                    const activeClass = (activeFilters.some((filter)=> filter.id === fid && filter.value === tag.name))
                      ? styles.active
                      : styles.inactive;
                    if(!tag)
                      return null;
                    return(
                      <button key={fid} className={`${styles.tag} ${activeClass}`} onClick={()=>handleTagClick(fid, tag)}>{tag.name} ({tag.count})</button>
                    )
                  })
                }
              </div>
            }
            {
              !!resultDescription && !isPathfinder &&
              <p className={styles.description}>
                <Highlighter
                  highlightClassName="highlight"
                  searchWords={activeEntityFilters}
                  autoEscape={true}
                  textToHighlight={resultDescription}
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
