import styles from './UserSave.module.scss';
import { RefObject, Dispatch, SetStateAction, FC, useCallback, useMemo, useRef } from 'react';
import Highlighter from 'react-highlight-words';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import ResultItem from '@/features/ResultItem/components/ResultItem/ResultItem';
import { SaveGroup } from '@/features/UserAuth/utils/userApi';
import { getResultsShareURLPath } from "@/features/Common/utils/web";
import { getCompressedEdge, getFormattedDate } from '@/features/Common/utils/utilities';
import { Path, Result, ResultEdge, ScoreWeights } from '@/features/ResultList/types/results';
import { ResultListProvider, ResultListContextValue } from '@/features/ResultList/context/ResultListContext';
import AnimateHeight from 'react-animate-height';
import ChevDown from "@/assets/icons/directional/Chevron/Chevron Down.svg?react"
import ChevUp from "@/assets/icons/directional/Chevron/Chevron Up.svg?react";
import Alert from "@/assets/icons/status/Alerts/Info.svg?react";
import { getEdgeById, getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { useSelector } from 'react-redux';
import { currentConfig } from '@/features/UserAuth/slices/userSlice';
import { useAnimateHeight } from '@/features/Core/hooks/useAnimateHeight';

interface UserSaveProps {
  activateEvidence?: (item: Result, edge: ResultEdge, path: Path, pathKey: string, pk: string) => void;
  activateNotes?: (nameString: string, id: string) => void;
  bookmarkAddedToast?: () => void;
  bookmarkRemovedToast?: () => void;
  currentSearchString: RefObject<string>;
  handleBookmarkError?: () => void;
  save: [string, SaveGroup];
  scoreWeights: ScoreWeights;
  setShareModalOpen: Dispatch<SetStateAction<boolean>>;
  setShareResultID: (state: string | null) => void;
  setShowHiddenPaths: Dispatch<SetStateAction<boolean>>;
  showHiddenPaths: boolean;
  zoomKeyDown: boolean;
}

const UserSave: FC<UserSaveProps> = ({
  activateEvidence,
  activateNotes,
  bookmarkAddedToast,
  bookmarkRemovedToast,
  currentSearchString,
  handleBookmarkError,
  save,
  scoreWeights,
  setShareModalOpen, 
  setShareResultID,
  setShowHiddenPaths,
  showHiddenPaths,
  zoomKeyDown }) => {

  const config = useSelector(currentConfig);
  const shouldUpdateRef = useRef(false) as RefObject<boolean>;
  let key = save[0];
  let queryObject = save[1];
  const arspk = useMemo(() => save[1].query.pk, [save]);
  const resultSet = useSelector(getResultSetById(key));
  let typeString = (!!queryObject.query.type) ? `What ${queryObject.query.type.targetType}s ${queryObject.query.type.pathString}` : "";
  let queryNodeString = queryObject.query.nodeLabel;
  let queryTypeID = (!!queryObject.query.type) ? queryObject.query.type.id : 'p';
  let shareURL = getResultsShareURLPath(queryNodeString, queryObject.query.nodeId, queryTypeID, "", key, config?.include_hashed_parameters);
  let submittedDate = (queryObject?.query?.submitted_time) ? getFormattedDate(new Date(queryObject.query.submitted_time)) : '';
  const { height, isOpen: isExpanded, toggle: handleToggle } = useAnimateHeight();

  const handleActivateEvidence = useCallback((item: Result, edgeIDs: string[], path: Path, pathKey: string) => {
    if(!resultSet)
      return;
    let edge;
    if(edgeIDs.length > 1)
      edge = getEdgeById(resultSet, edgeIDs[0]);
    else 
      edge = getCompressedEdge(resultSet, edgeIDs);

    if(!!edge && !!activateEvidence)
      activateEvidence(item, edge, path, pathKey, arspk);
  }, [resultSet, arspk, activateEvidence]);

  // Stable no-op callbacks to avoid creating new function references each render
  const noopFilter = useCallback(() => {}, []);
  const noopSetExpand = useCallback(() => {}, []);
  const noopUpdateSaves = useCallback(() => {}, []) as unknown as Dispatch<SetStateAction<SaveGroup | null>>;
  const stableActivateNotes = useMemo(() => activateNotes ?? (() => {}), [activateNotes]);
  const stableBookmarkAdded = useMemo(() => bookmarkAddedToast ?? (() => {}), [bookmarkAddedToast]);
  const stableBookmarkRemoved = useMemo(() => bookmarkRemovedToast ?? (() => {}), [bookmarkRemovedToast]);
  const stableBookmarkError = useMemo(() => handleBookmarkError ?? (() => {}), [handleBookmarkError]);

  // Memoized base context value with all shared (non-per-item) properties.
  // activeEntityFilters reflects the search string at render time; parent re-renders from setFilteredUserSaves keep it up to date.
  const baseContextValue = useMemo((): Omit<ResultListContextValue, 'queryNodeID' | 'queryNodeLabel' | 'queryNodeDescription' | 'queryType'> => ({
    activateEvidence: handleActivateEvidence,
    activateNotes: stableActivateNotes,
    activeEntityFilters: [currentSearchString.current],
    activeFilters: [],
    availableFilters: {},
    handleFilter: noopFilter,
    bookmarkAddedToast: stableBookmarkAdded,
    bookmarkRemovedToast: stableBookmarkRemoved,
    handleBookmarkError: stableBookmarkError,
    isPathfinder: false,
    pathFilterState: null,
    pk: arspk,
    resultsComplete: true,
    scoreWeights,
    setExpandSharedResult: noopSetExpand,
    setShareModalOpen,
    setShareResultID,
    showHiddenPaths,
    setShowHiddenPaths,
    shouldUpdateResultsAfterBookmark: shouldUpdateRef,
    updateUserSaves: noopUpdateSaves,
    zoomKeyDown,
  }), [
    handleActivateEvidence, stableActivateNotes, currentSearchString,
    noopFilter, stableBookmarkAdded, stableBookmarkRemoved, stableBookmarkError,
    arspk, scoreWeights, noopSetExpand, setShareModalOpen, setShareResultID,
    showHiddenPaths, setShowHiddenPaths, shouldUpdateRef, noopUpdateSaves, zoomKeyDown,
  ]);

  return (
    <div key={key} className={styles.query}>
      <div className={styles.topBar}>
        <div className={styles.headingContainer}>
          <span onClick={handleToggle}>
            {/* Temporary fix to not display the "treats" predicate in the UI */}
            <h4 className={styles.heading}>{typeString.replaceAll("treat", "impact")}
              <Highlighter
                highlightClassName="highlight"
                searchWords={[currentSearchString.current]}
                autoEscape={true}
                textToHighlight={queryNodeString}
              />?
            </h4>
          </span>
          
        </div>
        {
          queryObject.saves && queryObject.saves.size > 0 &&
          <p className={styles.numSaves}>{queryObject.saves.size} Saved Result{(queryObject.saves.size > 1) && "s"}</p>
        }
        <button className={`${styles.accordionButton} accordionButton ${isExpanded ? 'open' : 'closed' }`} onClick={handleToggle}>
          <ChevDown/>
        </button>
      </div>
      <div className={styles.bottomBar}>
        <p className={styles.date}>
          <Highlighter
            highlightClassName="highlight"
            searchWords={[currentSearchString.current]}
            autoEscape={true}
            textToHighlight={submittedDate.toString()}
          />
        </p>
        <a
          href={shareURL}
          target="_blank"
          rel="noreferrer"
          className={styles.link}
          data-tooltip-id={`originalquery-${key}`}
          aria-describedby={`originalquery-${key}`}
          >
            View All Results
          <Tooltip id={`originalquery-${key}`}>
            <span className={styles.tooltip}>Open this query in a new tab.</span>
          </Tooltip>
        </a>
      </div>
      <div className={styles.separator}></div>
      <AnimateHeight
        className={`${styles.ResultList}
          ${isExpanded ? styles.open : styles.closed }
        `}
        duration={500}
        height={height}
        >
        <div className={`${styles.tableHead}`}>
          <div
            className={`${styles.head} ${styles.nameHead}`}
            // onClick={()=>{
            //   let sortString = (isSortedByName === null) ? 'nameLowHigh' : (isSortedByName) ? 'nameHighLow' : 'nameLowHigh';
            //   currentSortString.current = sortString;
            //   handleUpdateResults(activeFilters, activeEntityFilters, rawResults.current, originalResults.current, true, sortString, formattedResults);
            // }}
          >
            Name
            <ChevUp className={styles.chev}/>
          </div>
          <div></div>
          <div
            className={`${styles.head} ${styles.evidenceHead}`}
            // onClick={()=>{
            //   let sortString = (isSortedByEvidence === null) ? 'evidenceHighLow' : (isSortedByEvidence) ? 'evidenceHighLow' : 'evidenceLowHigh';
            //   currentSortString.current = sortString;
            //   handleUpdateResults(activeFilters, activeEntityFilters, rawResults.current, originalResults.current, true, sortString, formattedResults);
            // }}
          >
            Evidence
            <ChevUp className={styles.chev}/>
          </div>
          <div
            className={`${styles.head} ${styles.pathsHead}`}
            // onClick={()=>{
            //   let sortString = (isSortedByPaths === null) ? 'pathsHighLow' : (isSortedByPaths) ? 'pathsHighLow' : 'pathsLowHigh';
            //   currentSortString.current = sortString;
            //   handleUpdateResults(activeFilters, activeEntityFilters, rawResults.current, originalResults.current, true, sortString, formattedResults);
            // }}
            data-tooltip-id="paths-tooltip"
          >
            Paths
            <Alert/>
            <ChevUp className={styles.chev}/>
            <Tooltip id="paths-tooltip">
              <span className={styles.scoreSpan}>Each path represents a discrete series of relationships that connect the result to the searched-for entity.</span>
            </Tooltip>
          </div>
          <div
            className={`${styles.head} ${styles.scoreHead}`}
            // onClick={()=>{
            //   let sortString = (isSortedByScore === null) ? 'scoreHighLow' : (isSortedByScore) ? 'scoreHighLow' : 'scoreLowHigh';
            //   currentSortString.current = sortString;
            //   handleUpdateResults(activeFilters, activeEntityFilters, rawResults.current, originalResults.current, true, sortString, formattedResults);
            // }}
            data-tooltip-id="score-tooltip"
          >
            Score
            <Alert/>
            <ChevUp className={styles.chev}/>
            <Tooltip id="score-tooltip">
              <span className={styles.scoreSpan}>Multimodal calculation considering strength of relationships supporting the result. Scores range from 0 to 5 and may change as new results are added. Scores will be displayed once all results have been loaded.</span>
            </Tooltip>
          </div>
          <div></div>
        </div>
        {queryObject.saves && Array.from(queryObject.saves.values()).sort((a, b) => a.label.localeCompare(b.label)).map((save, i) => {
          const queryType = save.data.query.type;
          const queryItem = save.data.item;
          const queryNodeID = save.data.query.nodeId;
          const queryNodeLabel = save.data.query.nodeLabel;
          const queryNodeDescription = save.data.query.nodeDescription;
          if ('compressedPaths' in (save?.data?.item || {}))
            return null;

          const bookmarkItem = queryObject.saves.get(save.object_ref) ?? null;
          const contextValue: ResultListContextValue = {
            ...baseContextValue,
            queryNodeID: (typeof queryNodeID === "string") ? queryNodeID : queryNodeID.toString(),
            queryNodeLabel,
            queryNodeDescription: queryNodeDescription ?? null,
            queryType,
          };
          return (
            <div key={save.id} className={styles.result}>
              <ResultListProvider value={contextValue}>
                <ResultItem
                  key={queryItem.id}
                  result={queryItem}
                  isEven={i % 2 !== 0}
                  bookmarkItem={bookmarkItem}
                  sharedItemRef={null}
                  startExpanded={false}
                  isInUserSave={true}
                />
              </ResultListProvider>
            </div>
          )
        })}
      </AnimateHeight>
    </div>
  )
}

export default UserSave;
