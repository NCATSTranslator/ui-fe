import styles from './UserSave.module.scss';
import { useState, useEffect, MutableRefObject, Dispatch, SetStateAction, FC, useCallback, useMemo } from 'react';
import Highlighter from 'react-highlight-words';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import ResultItem from '@/features/ResultItem/components/ResultItem/ResultItem';
import { emptyEditor, SaveGroup } from '@/features/UserAuth/utils/userApi';
import { getResultsShareURLPath } from "@/features/ResultList/utils/resultsInteractionFunctions";
import { getCompressedEdge, getFormattedDate } from '@/features/Common/utils/utilities';
import { Path, Result, ResultEdge } from '@/features/ResultList/types/results';
import AnimateHeight from 'react-animate-height';
import ChevDown from "@/assets/icons/Directional/Chevron/Chevron Down.svg?react"
import ChevUp from "@/assets/icons/Directional/Chevron/Chevron Up.svg?react";
import Alert from "@/assets/icons/Status/Alerts/Info.svg?react";
import { getEdgeById, getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { useSelector } from 'react-redux';

interface UserSaveProps {
  activateEvidence?: (item: Result, edge: ResultEdge, path: Path, pathKey: string, pk: string) => void;
  activateNotes?: (nameString: string, id: string) => void;
  bookmarkAddedToast?: () => void;
  bookmarkRemovedToast?: () => void;
  currentSearchString: MutableRefObject<string>;
  handleBookmarkError?: () => void;
  save: [string, SaveGroup];
  scoreWeights: {confidenceWeight: number, noveltyWeight: number, clinicalWeight: number}
  setShareModalOpen: Dispatch<SetStateAction<boolean>>;
  setShareResultID: (state: string) => void;
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

    
  let key = save[0];
  let queryObject = save[1];
  const arspk = useMemo(() => save[1].query.pk, [save]);
  const resultSet = useSelector(getResultSetById(key));
  let typeString = (!!queryObject.query.type) ? `What ${queryObject.query.type.targetType}s ${queryObject.query.type.pathString}` : "";
  let queryNodeString = queryObject.query.nodeLabel;
  let queryTypeID = (!!queryObject.query.type) ? queryObject.query.type.id : 'p';
  let shareURL = getResultsShareURLPath(queryNodeString, queryObject.query.nodeId, '0', queryTypeID, key);
  let submittedDate = (queryObject?.query?.submitted_time) ? getFormattedDate(new Date(queryObject.query.submitted_time)) : '';
  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState<number | "auto">(0);

  useEffect(() => {
    if(isExpanded === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [isExpanded])

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  }

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
  return (
    <div key={key} className={styles.query}>
      <div className={styles.topBar}>
        <div className={styles.headingContainer}>
          <span onClick={handleToggle}>
            <h4 className={styles.heading}>{typeString}
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
          queryObject.saves && Array.from(queryObject.saves).length > 0 &&
          <p className={styles.numSaves}>{Array.from(queryObject.saves).length} Saved Result{(Array.from(queryObject.saves).length > 1) && "s"}</p>
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
        {queryObject.saves && Array.from(queryObject.saves).sort((a, b) => a.label.localeCompare(b.label)).map((save, i) => {
          const queryType = save.data.query.type;
          const queryItem = save.data.item;
          const queryNodeID = save.data.query.nodeId;
          const queryNodeLabel = save.data.query.nodeLabel;
          const queryNodeDescription = save.data.query.nodeDescription;
          queryItem.hasNotes = (save.notes.length === 0 || JSON.stringify(save.notes) === emptyEditor) ? false : true;
          if ('compressedPaths' in (save?.data?.item || {}))
            return null;

          return (
            <div key={save.id} className={styles.result}>
              <ResultItem
                isEven={i % 2 !== 0}
                key={queryItem.id}
                queryType={queryType}
                activateEvidence={handleActivateEvidence}
                activateNotes={activateNotes}
                activeEntityFilters={[currentSearchString.current]}
                zoomKeyDown={zoomKeyDown}
                pk={arspk}
                queryNodeID={(typeof queryNodeID === "string") ? queryNodeID : queryNodeID.toString()}
                queryNodeLabel={queryNodeLabel}
                queryNodeDescription={queryNodeDescription}
                bookmarked={true}
                bookmarkID={(typeof save.id === "string") ? save.id : (save.id === null) ? "" : save.id.toString()}
                hasNotes={queryItem.hasNotes}
                handleBookmarkError={handleBookmarkError}
                bookmarkAddedToast={bookmarkAddedToast}
                bookmarkRemovedToast={bookmarkRemovedToast}
                setShareModalOpen={setShareModalOpen}
                setShareResultID={setShareResultID}
                isInUserSave={true}
                resultsComplete={true}
                isPathfinder={false}
                result={queryItem}
                pathFilterState={{}}
                availableFilters={{}}
                handleFilter={()=>{}}
                activeFilters={[]}
                sharedItemRef={ null}
                startExpanded={false}
                setExpandSharedResult={()=>{}}
                scoreWeights={scoreWeights}
                showHiddenPaths={showHiddenPaths}
                setShowHiddenPaths={setShowHiddenPaths}
              />
            </div>
          )
        })}
      </AnimateHeight>
    </div>
  )
}

export default UserSave;
