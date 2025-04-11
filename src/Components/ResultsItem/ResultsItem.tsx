import { useState, useEffect, useCallback, useRef, FC, RefObject, lazy, Suspense, Dispatch, SetStateAction, useMemo } from 'react';
import styles from './ResultsItem.module.scss';
import { formatBiolinkEntity, formatBiolinkNode, getPathCount, getEvidenceCounts, isStringArray } from '../../Utilities/utilities';
import PathView from '../PathView/PathView';
import LoadingBar from '../LoadingBar/LoadingBar';
import ChevDown from "../../Icons/Directional/Chevron/Chevron Down.svg?react";
import AnimateHeight from "react-animate-height";
import Highlighter from 'react-highlight-words';
import BookmarkConfirmationModal from '../Modals/BookmarkConfirmationModal';
import { Link } from 'react-router-dom';
// import { CSVLink } from 'react-csv';
// import { generateCsvFromItem } from '../../Utilities/csvGeneration';
import { createUserSave, deleteUserSave, generateSafeResultSet, getFormattedBookmarkObject } from '../../Utilities/userApi';
import { useSelector } from 'react-redux';
import { getResultSetById, getNodeById, getPathById, getPathsByIds, getEdgeById } from '../../Redux/resultsSlice';
import { currentUser } from '../../Redux/userSlice';
import { displayScore, generateScore } from '../../Utilities/scoring';
import { QueryType } from '../../Types/querySubmission';
import { Result, Filter, PathFilterState, Path, ResultBookmark, ResultSet } from '../../Types/results.d';
import { useTurnstileEffect } from '../../Utilities/customHooks';
import Tabs from '../Tabs/Tabs';
import Tab from '../Tabs/Tab';
import * as filtering from '../../Utilities/filterFunctions';
import ResultsItemName from '../ResultsItemName/ResultsItemName';
import Feedback from '../../Icons/Navigation/Feedback.svg?react';
import { cloneDeep } from 'lodash';
import ResultsItemInteractables from '../ResultsItemInteractables/ResultsItemInteractables';

const GraphView = lazy(() => import("../GraphView/GraphView"));

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

type ResultsItemProps = {
  activateEvidence?: (item: Result, edgeIDs: string[], path: Path, pathKey: string) => void;
  activateNotes?: (nameString: string, id: string) => void;
  activeEntityFilters: string[];
  activeFilters: Filter[];
  availableFilters: {[key: string]: Filter};
  bookmarkAddedToast?: () => void;
  bookmarkRemovedToast?: () => void;
  bookmarked?: boolean;
  bookmarkID?: string | null;
  handleBookmarkError?: () => void;
  handleFilter: (filter: Filter) => void;
  hasNotes: boolean;
  isEven: boolean;
  isInUserSave?: boolean;
  isPathfinder?: boolean;
  key: string;
  pathFilterState: PathFilterState;
  pk: string | null;
  queryNodeDescription: string | null;
  queryNodeID: string | null;
  queryNodeLabel: string | null;
  queryType: QueryType | null;
  result: Result | ResultBookmark;
  resultsComplete: boolean;
  scoreWeights: {confidenceWeight: number, noveltyWeight: number, clinicalWeight: number };
  setExpandSharedResult: (state: boolean) => void;
  setShareModalOpen: (state: boolean) => void;
  setShareResultID: (state: string) => void;
  setShowHiddenPaths: Dispatch<SetStateAction<boolean>>;
  sharedItemRef: RefObject<HTMLDivElement> | null;
  showHiddenPaths: boolean;
  startExpanded: boolean;
  zoomKeyDown: boolean;
}

const ResultsItem: FC<ResultsItemProps> = ({
    activateEvidence = () => {},
    activateNotes = () => {},
    activeEntityFilters,
    activeFilters,
    availableFilters: availableTags,
    bookmarkAddedToast = () => {},
    bookmarkRemovedToast = () => {},
    bookmarked = false,
    bookmarkID = null,
    pk: currentQueryID,
    handleBookmarkError = () => {},
    handleFilter = () => {},
    hasNotes = false,
    key,
    isEven = false,
    isInUserSave = false,
    isPathfinder = false,
    queryNodeDescription,
    queryNodeID,
    queryNodeLabel,
    queryType,
    pathFilterState,
    pk,
    result,
    resultsComplete = false,
    scoreWeights,
    setExpandSharedResult = () => {},
    setShareModalOpen = () => {},
    setShareResultID = () => {},
    setShowHiddenPaths,
    sharedItemRef,
    showHiddenPaths,
    startExpanded = false,
    zoomKeyDown
  }) => {

  let resultSet = useSelector(getResultSetById(pk));
  const {confidenceWeight, noveltyWeight, clinicalWeight} = scoreWeights;
  const score = (!!result?.score) ? result.score : generateScore(result.scores, confidenceWeight, noveltyWeight, clinicalWeight);
  const user = useSelector(currentUser);

  let roleCount: number = (!!result) ? Object.keys(result.tags).filter(tag => tag.includes("role")).length : 0;

  const evidenceCounts = (!!result.evidenceCount) ? result.evidenceCount : getEvidenceCounts(resultSet, result);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(bookmarked);
  const itemBookmarkID = useRef<string | null>(bookmarkID);
  const [itemHasNotes, setItemHasNotes] = useState<boolean>(hasNotes);
  const [isExpanded, setIsExpanded] = useState<boolean>(startExpanded);
  const [graphActive, setGraphActive] = useState<boolean>(false);
  const [height, setHeight] = useState<number | string>(0);
  const newPaths = useMemo(()=>(!!result) ? result.paths: [], [result]);
  const [selectedPaths, setSelectedPaths] = useState<Set<Path> | null>(null);
  // const [csvData, setCsvData] = useState([]);
  const bookmarkRemovalApproved = useRef<boolean>(false);
  const [bookmarkRemovalConfirmationModalOpen, setBookmarkRemovalConfirmationModalOpen] = useState<boolean>(false);

  const tagsRef = useRef<HTMLDivElement>(null);
  const [tagsHeight, setTagsHeight] = useState<number>(0);
  const minTagsHeight = 45;

  useTurnstileEffect(
    () => startExpanded,
    () => setIsExpanded(true),
    () => setExpandSharedResult(false));

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
  const nameString: string = (!!result?.drug_name && !!subjectNode) ? formatBiolinkNode(result.drug_name, typeString, subjectNode.species) : '';
  const resultDescription = subjectNode?.descriptions[0];

  const [itemGraph, setItemGraph] = useState(null);

  const handleToggle = () => {
    setIsExpanded(prev => !prev);
  }

  const handleEdgeSpecificEvidence = useCallback((edgeIDs: string[], path: Path, pathKey: string) => {
    if(!result)
      return;

    activateEvidence(result, edgeIDs, path, pathKey);
  }, [result, activateEvidence])

  const handleActivateEvidence = useCallback((path: Path, pathKey: string) => {
    if(!!path.subgraph[1])
      activateEvidence(result, [path.subgraph[1]], path, pathKey);
  }, [result, activateEvidence])

  useEffect(() => {
    if(isExpanded === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [isExpanded])

  const handleClearSelectedPaths = useCallback(() => {
    setSelectedPaths(null);
  },[]);

  const handleGraphNodeClick = useCallback((nodeSequences: Set<string[]>) => {
    if(!nodeSequences)
      return;

    let newSelectedPaths: Set<Path> = new Set();
    let paths = (isStringArray(newPaths)) ? getPathsByIds(resultSet, newPaths) : newPaths;

    const extractNodeSequence = (subgraph: string[]): string[] => {
      let nodeSequence: string[] = [];
      for(let i = 0; i < subgraph.length; i+=2)
        nodeSequence.push(subgraph[i]);

      return nodeSequence;
    };

    const checkForNodeMatches = (nodeSequence: string[], path: Path) => {
      let pathNodeSequence = extractNodeSequence(path.subgraph);
      return pathNodeSequence === nodeSequence;
    }

    for(const sequence of nodeSequences) {
      for(const path of paths) {
        // check edges for support
        for(let i = 1; i < path.subgraph.length; i+=2) {
          let edge = getEdgeById(resultSet, path.subgraph[i]);
          // check support for matches
          if(!!edge && edge.support.length > 0) {
            for(const pathID of edge.support) {
              let supportPath = (typeof pathID === "string") ? getPathById(resultSet, pathID) : pathID;
              if(!!supportPath && checkForNodeMatches(sequence, supportPath))
                newSelectedPaths.add(supportPath);
            }
          }
        }

        // include all 1 hops, bc they're unselectable otherwise
        if(path.subgraph.length === 3) {
          newSelectedPaths.add(path);
          continue;
        }

        // check base path for matches
        if(checkForNodeMatches(sequence, path))
          newSelectedPaths.add(path);
      }
    }
    setSelectedPaths(newSelectedPaths)

  },[newPaths, resultSet]);

  const handleBookmarkClick = async () => {
    if(isBookmarked) {
      if(bookmarkRemovalApproved.current && itemBookmarkID.current) {
        console.log("remove bookmark");
        deleteUserSave(itemBookmarkID.current);
        setIsBookmarked(false);
        setItemHasNotes(false);
        itemBookmarkID.current = null;
        bookmarkRemovedToast();
      }
      if(!bookmarkRemovalApproved.current) {
        setBookmarkRemovalConfirmationModalOpen(true);
      }
      return false;
    } else {
      if(!resultSet) {
        console.warn("Unable to create bookmark, no resultSet available");
        return false;
      }
      let bookmarkResult: ResultBookmark = cloneDeep(result);
      bookmarkResult.graph = (!!itemGraph) ? itemGraph : undefined;
      // delete result.paths;
      const safeQueryNodeID = (!!queryNodeID) ? queryNodeID : "";
      const safeQueryNodeLabel = (!!queryNodeLabel) ? queryNodeLabel : "";
      const safeQueryNodeDescription = (!!queryNodeDescription) ? queryNodeDescription : "";
      const safeCurrentQueryID = (!!currentQueryID) ? currentQueryID : "";
      const safeResultSet: ResultSet = generateSafeResultSet(resultSet, bookmarkResult);
      let bookmarkObject = getFormattedBookmarkObject("result", bookmarkResult.drug_name, "", safeQueryNodeID,
        safeQueryNodeLabel, safeQueryNodeDescription, queryType, result, safeCurrentQueryID, safeResultSet);
      
      bookmarkObject.user_id = (user?.id) ? user.id : null;
      bookmarkObject.time_created = new Date().toDateString();
      bookmarkObject.time_updated = new Date().toDateString();

      let bookmarkedItem = await createUserSave(bookmarkObject, handleBookmarkError, handleBookmarkError);
      if(bookmarkedItem) {
        let newBookmarkedItem = bookmarkedItem as any;
        setIsBookmarked(true);
        itemBookmarkID.current = newBookmarkedItem.id.toString()
        bookmarkAddedToast();
        return newBookmarkedItem.id;
      }
      return false;
    }
  }

  const handleNotesClick = async () => {
    let tempBookmarkID: string | null = itemBookmarkID.current;
    if(!isBookmarked) {
      console.log("no bookmark exists for this item, creating one...")
      let replacementID = await handleBookmarkClick();
      console.log("new id: ", replacementID);
      tempBookmarkID = (replacementID) ? replacementID : tempBookmarkID;
    }
    if(tempBookmarkID) {
      activateNotes(nameString, tempBookmarkID);
      setItemHasNotes(true);
    }
  }

  const handleTagClick = (filterID: string, filter: Filter) => {
    let newObj: Filter = {
      name: filter.name,
      negated: false,
      id: filterID,
      value: filter.name
    };
    handleFilter(newObj);
  }

  const handleBookmarkRemovalApproval = () => {
    bookmarkRemovalApproved.current = true;
    handleBookmarkClick();
  }

  const handleOpenResultShare = () => {
    setShareResultID(result.id);
    setShareModalOpen(true);
  }

  useEffect(() => {
    itemBookmarkID.current = bookmarkID;
  }, [bookmarkID]);

  useEffect(() => {
    setItemHasNotes(hasNotes);
  }, [result, hasNotes]);

  return (
    <div key={key} className={`${styles.result} result ${isPathfinder ? styles.pathfinder : ''}`} data-result-curie={result.subject} ref={sharedItemRef} data-result-name={nameString}>
      <div className={styles.top}>
        <div className={`${styles.nameContainer} ${styles.resultSub}`} onClick={handleToggle}>
          <ResultsItemName
            isPathfinder={isPathfinder}
            subjectNode={subjectNode}
            objectNode={objectNode}
            item={result}
            activeEntityFilters={activeEntityFilters}
            nameString={nameString}
            resultsItemStyles={styles}
          />
        </div>
        <ResultsItemInteractables
          handleBookmarkClick={handleBookmarkClick}
          handleNotesClick={handleNotesClick}
          handleOpenResultShare={handleOpenResultShare}
          hasNotes={itemHasNotes}
          hasUser={!!user}
          isBookmarked={isBookmarked}
          isEven={isEven}
          isExpanded={isExpanded}
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
        {
          !isPathfinder &&
          <div className={`${styles.scoreContainer} ${styles.resultSub}`}>
            <span className={styles.score}>
              <span className={styles.scoreNum}>{resultsComplete ? score === null ? '0.00' : displayScore(score) : "Processing..." }</span>
            </span>
          </div>
        }
        {/* <CSVLink
          className={styles.downloadButton}
          data={csvData}
          filename={`${item.name.toLowerCase()}.csv`}
          onClick={generateCsvFromItem(item, setCsvData)}>
            <Export data-tooltip-id={`csv-tooltip-${nameString}`} aria-describedby={`csv-tooltip-${nameString}`}/>
            <Tooltip id={`csv-tooltip-${nameString}`}>
              <span className={styles.tooltip}>Download a version of this result in CSV format.</span>
            </Tooltip>
        </CSVLink> */}
        <button className={`${styles.accordionButton} ${isExpanded ? styles.open : styles.closed } result-accordion-button`} onClick={handleToggle} data-result-name={nameString}>
          <ChevDown/>
        </button>
      </div>
      <AnimateHeight
        className={`${styles.accordionPanel}
          ${isExpanded ? styles.open : styles.closed }
          ${(roleCount > 0 && !isInUserSave) ? styles.hasTags : ''}
          ${(!!resultDescription && !isPathfinder) ? styles.hasDescription : '' }
          ${!!isInUserSave && styles.inUserSave}
        `}
        duration={500}
        height={height}
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
        <Tabs 
          isOpen 
          className={styles.resultTabs} 
          handleTabSelection={(heading)=>{
              if(heading === "Graph")
                setGraphActive(true);
              else 
                setGraphActive(false);
            }}
          >
            <Tab heading="Paths">
              <PathView
                active={isExpanded}
                activeEntityFilters={activeEntityFilters}
                activeFilters={activeFilters}
                handleEdgeSpecificEvidence={handleEdgeSpecificEvidence}
                handleActivateEvidence={handleActivateEvidence}
                isEven={isEven}
                pathArray={result?.paths}
                pathFilterState={pathFilterState}
                pk={pk ? pk : ""}
                resultID={result.id}
                selectedPaths={selectedPaths}
                setShowHiddenPaths={setShowHiddenPaths}
                showHiddenPaths={showHiddenPaths}
              />
            </Tab>
            <Tab heading="Graph">
              <Suspense fallback={<LoadingBar useIcon reducedPadding />}>
                <GraphView
                  result={result}
                  updateGraphFunction={setItemGraph}
                  prebuiltGraph={(!!itemGraph)? itemGraph: null}
                  resultSet={resultSet}
                  onNodeClick={handleGraphNodeClick}
                  clearSelectedPaths={handleClearSelectedPaths}
                  active={graphActive}
                  zoomKeyDown={zoomKeyDown}
                />
              </Suspense>
            </Tab>
        </Tabs>
        <p className={styles.needHelp}>
          <Feedback/>
          <Link to={`/send-feedback`} target={'_blank'}>Send Feedback</Link>
        </p>
      </AnimateHeight>
      <BookmarkConfirmationModal
        isOpen={bookmarkRemovalConfirmationModalOpen}
        onApprove={handleBookmarkRemovalApproval}
        onClose={()=>{
          setBookmarkRemovalConfirmationModalOpen(false);
          bookmarkRemovalApproved.current = false;
        }}
      />
    </div>
  );
}

export default ResultsItem;
