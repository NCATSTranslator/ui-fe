import { useState, useEffect, useCallback, useRef, FC, RefObject, lazy, Suspense } from 'react';
import styles from './ResultsItem.module.scss';
import { formatBiolinkEntity, formatBiolinkNode, getPathCount, getEvidenceCounts } from '../../Utilities/utilities';
import PathView from '../PathView/PathView';
import LoadingBar from '../LoadingBar/LoadingBar';
import ChevDown from "../../Icons/Directional/Chevron/Chevron Down.svg?react";
import ShareIcon from '../../Icons/Buttons/Link.svg?react';
import Bookmark from "../../Icons/Navigation/Bookmark/Bookmark.svg?react";
import BookmarkFilled from "../../Icons/Navigation/Bookmark/Filled Bookmark.svg?react";
import Notes from "../../Icons/Buttons/Notes/Notes.svg?react"
import NotesFilled from "../../Icons/Buttons/Notes/Filled Notes.svg?react"
import AnimateHeight from "react-animate-height";
import Highlighter from 'react-highlight-words';
import Tooltip from '../Tooltip/Tooltip';
import BookmarkConfirmationModal from '../Modals/BookmarkConfirmationModal';
import { Link } from 'react-router-dom';
// import { CSVLink } from 'react-csv';
// import { generateCsvFromItem } from '../../Utilities/csvGeneration';
import { createUserSave, deleteUserSave, generateSafeResultSet, getFormattedBookmarkObject } from '../../Utilities/userApi';
import { useSelector } from 'react-redux';
import { getResultSetById, getNodeById } from '../../Redux/resultsSlice';
import { currentUser } from '../../Redux/rootSlice';
import { displayScore, generateScore } from '../../Utilities/scoring';
import { QueryType } from '../../Types/querySubmission';
import { Result, Filter, PathFilterState, Path, isResultNode, ResultBookmark, ResultSet } from '../../Types/results.d';
import { useTurnstileEffect } from '../../Utilities/customHooks';
import Tabs from '../Tabs/Tabs';
import Tab from '../Tabs/Tab';
import * as filtering from '../../Utilities/filterFunctions';
import ResultsItemName from '../ResultsItemName/ResultsItemName';
import Feedback from '../../Icons/Navigation/Feedback.svg?react';
import { cloneDeep } from 'lodash';

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
  activateEvidence?: (item: Result, edgeID: string, path: Path) => void;
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
  queryType: QueryType;
  result: Result | ResultBookmark;
  resultsComplete: boolean;
  scoreWeights: {confidenceWeight: number, noveltyWeight: number, clinicalWeight: number };
  setExpandSharedResult: (state: boolean) => void;
  setShareModalOpen: (state: boolean) => void;
  setShareResultID: (state: string) => void;
  sharedItemRef: RefObject<HTMLDivElement> | null;
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
    sharedItemRef,
    startExpanded = false,
    zoomKeyDown
  }) => {

  let resultSet = useSelector(getResultSetById(pk));
  const {confidenceWeight, noveltyWeight, clinicalWeight} = scoreWeights;
  const score = (!!result?.score) ? result.score : generateScore(result.scores, confidenceWeight, noveltyWeight, clinicalWeight);
  const user = useSelector(currentUser);

  let roleCount: number = (!!result && !result.tags) ? Object.keys(result.tags).filter(tag => tag.includes("role")).length : 0;

  const evidenceCounts = (!!result.evidenceCount) ? result.evidenceCount : getEvidenceCounts(resultSet, result);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(bookmarked);
  const itemBookmarkID = useRef<string | null>(bookmarkID);
  const [itemHasNotes, setItemHasNotes] = useState<boolean>(hasNotes);
  const [isExpanded, setIsExpanded] = useState<boolean>(startExpanded);
  const [graphActive, setGraphActive] = useState<boolean>(false);
  const [height, setHeight] = useState<number | string>(0);
  const newPaths = (!!result) ? result.paths: [];
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

  const handleEdgeSpecificEvidence = useCallback((edgeID: string, path: Path) => {
    if(!result)
      return;

    activateEvidence(result, edgeID, path);
  }, [result, activateEvidence])

  const handleActivateEvidence = useCallback((path: Path) => {
    if(!!path.subgraph[1])
      activateEvidence(result, path.subgraph[1], path);
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

  const handleNodeClick = useCallback((selectedPaths: Set<string[]>) => {
    if(!selectedPaths)
      return;

    let newSelectedPaths: Set<Path> = new Set();

    const checkForNodeMatches = (nodeList: string[], path: Path) => {
      let currentNodeIndex = 0;
      let numMatches = 0;
      for(const el of path.subgraph) {
        if(!isResultNode(el))
          continue;

        if(nodeList[currentNodeIndex] && el.curies.includes(nodeList[currentNodeIndex])) {
          numMatches++;
        }
        currentNodeIndex++;
      }
      if(numMatches === nodeList.length) {
        newSelectedPaths.add(path);
        return true;
      }
      return false;
    }

    // for(const selPath of selectedPaths) {
    //   for(const path of formattedPaths.current) {
    //     if(path.path.subgraph.length === 3) {
    //       const firstNode = path.path.subgraph[0];
    //       const lastNode = path.path.subgraph[path.path.subgraph.length - 1];
    //       if('curies' in firstNode && firstNode.curies.includes(selPath[0]) &&
    //       'curies' in lastNode && lastNode.curies.includes(selPath[selPath.length - 1])) {
    //         newSelectedPaths.add(path);
    //       }
    //     }
    //     if(path.path.inferred) {
    //       for(const [i, item] of path.path.subgraph.entries()) {
    //         if(i % 2 === 0)
    //           continue;
    //         if('support' in item && item.support) {
    //           for(const supportPath of item.support){
    //             if(checkForNodeMatches(selPath, supportPath))
    //               newSelectedPaths.add(supportPath);
    //           }
    //         }
    //       }
    //     }
    //     if(checkForNodeMatches(selPath, path))
    //       newSelectedPaths.add(path);
    //   }
    // }
    // setSelectedPaths(newSelectedPaths)

  },[]);

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
      console.log(bookmarkedItem);
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
    <div key={key} className={`${styles.result} result ${isPathfinder ? styles.pathfinder : ''}`} data-resultcurie={result.subject} ref={sharedItemRef} data-result-name={nameString}>
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
      <div className={`${styles.bookmarkContainer} ${styles.resultSub} ${!!isEven && styles.even}`}>
        {
          !!user && !isPathfinder
            ? <>
                <div className={`${styles.icon} ${styles.bookmarkIcon} ${isBookmarked ? styles.filled : ''}`}>
                  <BookmarkFilled className={styles.bookmarkFilledSVG} data-result-name={nameString} onClick={handleBookmarkClick} data-tooltip-id={`bookmark-tooltip-${nameString.replaceAll("'", "")}`} aria-describedby={`bookmark-tooltip-${nameString.replaceAll("'", "")}`} />
                  <Bookmark data-result-name={nameString} onClick={handleBookmarkClick} data-tooltip-id={`bookmark-tooltip-${nameString.replaceAll("'", "")}`} aria-describedby={`bookmark-tooltip-${nameString.replaceAll("'", "")}`} />
                  <Tooltip id={`bookmark-tooltip-${nameString.replaceAll("'", "")}`}>
                    <span className={styles.tooltip}>
                      {
                        isBookmarked
                        ? <>Remove this bookmark.</>
                        : <>Bookmark this result to review it later in the <Link to="/workspace" target='_blank'>Workspace</Link>.</>
                      }
                    </span>
                  </Tooltip>
                </div>
                <div className={`${styles.icon} ${styles.notesIcon} ${itemHasNotes ? styles.filled : ''}`}>
                  <NotesFilled className={styles.notesFilledSVG} data-result-name={nameString} onClick={handleNotesClick} data-tooltip-id={`notes-tooltip-${nameString.replaceAll("'", "")}`} aria-describedby={`notes-tooltip-${nameString.replaceAll("'", "")}`} />
                  <Notes className='note-icon' data-result-name={nameString} onClick={handleNotesClick} data-tooltip-id={`notes-tooltip-${nameString.replaceAll("'", "")}`} aria-describedby={`notes-tooltip-${nameString.replaceAll("'", "")}`} />
                  <Tooltip id={`notes-tooltip-${nameString.replaceAll("'", "")}`}>
                    <span className={styles.tooltip}>Add your own custom notes to this result. <br/> (You can also view and edit notes on your<br/> bookmarked results in the <Link to="/workspace" target='_blank'>Workspace</Link>).</span>
                  </Tooltip>
                </div>
              </>
            : <></>
        }
        <button
          className={`${styles.icon} ${styles.shareResultIcon} ${isExpanded ? styles.open : styles.closed } share-result-icon`}
          onClick={handleOpenResultShare}
          data-tooltip-id={`share-tooltip-${nameString.replaceAll("'", "")}`}
          >
          <ShareIcon/>
          <Tooltip id={`share-tooltip-${nameString.replaceAll("'", "")}`}>
            <span className={styles.tooltip}>Generate a sharable link for this result.</span>
          </Tooltip>
        </button>
      </div>
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
      <AnimateHeight
        className={`${styles.accordionPanel}
          ${isExpanded ? styles.open : styles.closed }
          ${(Object.entries(result.tags).some(item=>item.includes("role")) && !isInUserSave) ? styles.hasTags : ''}
          ${(!!resultDescription && !isPathfinder) ? styles.hasDescription : '' }
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
                pathArray={result?.paths}
                selectedPaths={selectedPaths}
                handleEdgeSpecificEvidence={handleEdgeSpecificEvidence}
                handleActivateEvidence={handleActivateEvidence}
                activeEntityFilters={activeEntityFilters}
                pathFilterState={pathFilterState}
                isEven={isEven}
                active={isExpanded}
                activeFilters={activeFilters}
                pk={pk ? pk : ""}
              />
            </Tab>
            <Tab heading="Graph">
              <Suspense fallback={<LoadingBar useIcon reducedPadding />}>
                <GraphView
                  result={result}
                  updateGraphFunction={setItemGraph}
                  prebuiltGraph={(!!itemGraph)? itemGraph: null}
                  resultSet={resultSet}
                  onNodeClick={handleNodeClick}
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
