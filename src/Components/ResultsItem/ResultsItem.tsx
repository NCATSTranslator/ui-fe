import { useState, useEffect, useCallback, useRef, lazy, Suspense, memo, FC, RefObject } from 'react';
import styles from './ResultsItem.module.scss';
import { formatBiolinkEntity, formatBiolinkNode, isFormattedEdgeObject,
  isPublication, isClinicalTrial, isMiscPublication, getPathsCount } from '../../Utilities/utilities';
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
import { createUserSave, deleteUserSave, getFormattedBookmarkObject } from '../../Utilities/userApi';
import { useSelector } from 'react-redux';
import { currentUser } from '../../Redux/rootSlice';
import { displayScore } from '../../Utilities/scoring';
import { QueryType } from '../../Utilities/queryTypes';
import { ResultItem, RawResult, PathObjectContainer, Tag, Filter, FormattedEdgeObject, PathFilterState } from '../../Types/results';
import { useTurnstileEffect } from '../../Utilities/customHooks';
import { isEqual } from 'lodash';
import Tabs from '../Tabs/Tabs';
import Tab from '../Tabs/Tab';
import * as filtering from '../../Utilities/filterFunctions';
import ResultsItemName from '../ResultsItemName/ResultsItemName';
import Feedback from '../../Icons/Navigation/Feedback.svg?react';

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
  activateEvidence?: (item: ResultItem, edgeGroup: FormattedEdgeObject | null, path: PathObjectContainer) => void;
  activateNotes?: (nameString: string, id: string | number, item: ResultItem) => void;
  activeFilters: Filter[];
  activeEntityFilters: string[];
  availableTags: {[key: string]: Tag};
  bookmarkAddedToast?: () => void;
  bookmarkRemovedToast?: () => void;
  bookmarked?: boolean;
  bookmarkID?: string | null;
  currentQueryID: string;
  sharedItemRef: RefObject<HTMLDivElement>;
  startExpanded: boolean;
  setExpandSharedResult: (state: boolean) => void;
  setShareModalOpen: (state: boolean) => void;
  setShareResultID: (state: string) => void;
  handleBookmarkError?: () => void;
  handleFilter: (tag: Tag) => void;
  hasNotes: boolean;
  item: ResultItem;
  key: string;
  queryNodeDescription: string;
  queryNodeID: string;
  queryNodeLabel: string;
  rawResults: RawResult[];
  type: QueryType;
  pathFilterState: PathFilterState;
  zoomKeyDown: boolean;
  isInUserSave?: boolean;
  isEven: boolean;
  isPathfinder?: boolean;
  resultsComplete: boolean;
}

const ResultsItem: FC<ResultsItemProps> = ({
    activateEvidence = () => {},
    activateNotes = () => {},
    activeFilters,
    activeEntityFilters,
    availableTags,
    bookmarkAddedToast = () => {},
    bookmarkRemovedToast = () => {},
    bookmarked = false,
    bookmarkID = null,
    currentQueryID,
    sharedItemRef,
    startExpanded = false,
    setExpandSharedResult = () => {},
    setShareModalOpen = () => {},
    setShareResultID = () => {},
    handleBookmarkError = () => {},
    handleFilter = () => {},
    hasNotes = false,
    item,
    key,
    queryNodeID,
    queryNodeDescription,
    queryNodeLabel,
    rawResults,
    type,
    pathFilterState,
    zoomKeyDown,
    isInUserSave = false,
    isEven = false,
    isPathfinder = false,
    resultsComplete = false
  }) => {
  const user = useSelector(currentUser);

  let roleCount: number = (item.tags)
    ? item.tags.filter(tag => tag.includes("role")).length
    : 0;

  const publicationCount = (!!item.evidenceCounts)
    ? item.evidenceCounts.publicationCount
    : (!!item.evidence && !!item.evidence.publications)
      ? Object.values(item.evidence.publications).filter(item => isPublication(item)).length
      : 0;
  const clinicalTrialCount = (!!item.evidenceCounts)
    ? item.evidenceCounts.clinicalTrialCount
    : (!!item.evidence && !!item.evidence.publications)
      ? Object.values(item.evidence.publications).filter(item => isClinicalTrial(item)).length
      : 0;
  const miscCount = (!!item.evidenceCounts)
    ? item.evidenceCounts.miscCount
    : (!!item.evidence && !!item.evidence.publications)
      ? Object.values(item.evidence.publications).filter(item => isMiscPublication(item)).length
      : 0;
  const sourceCount = (!!item.evidenceCounts)
    ? item.evidenceCounts.sourceCount
    : (!!item.evidence && !!item.evidence.distinctSources)
      ? item.evidence.distinctSources.length
      : 0;

  const [isBookmarked, setIsBookmarked] = useState<boolean>(bookmarked);
  const itemBookmarkID = useRef<string | null>(bookmarkID);
  const [itemHasNotes, setItemHasNotes] = useState<boolean>(hasNotes);
  const [isExpanded, setIsExpanded] = useState<boolean>(startExpanded);
  const [height, setHeight] = useState<number | string>(0);
  const formattedPaths = useRef<PathObjectContainer[]>(item.compressedPaths);
  // selectedPaths include the node ids of a path in a string array
  const [selectedPaths, setSelectedPaths] = useState<Set<PathObjectContainer> | null>(null);
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

  const pathsCount: number = getPathsCount(formattedPaths.current);
  const typeString: string = (item.type !== null) ? formatBiolinkEntity(item.type) : '';
  const nameString: string = (item.name !== null) ? formatBiolinkNode(item.name, typeString, item.species) : '';

  const [itemGraph, setItemGraph] = useState(null);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  }

  const handleEdgeSpecificEvidence = useCallback((edgeGroup: FormattedEdgeObject, path: PathObjectContainer) => {
    activateEvidence(item, edgeGroup, path);
  }, [item, activateEvidence])

  const handleActivateEvidence = useCallback((path: PathObjectContainer) => {
    if(path.path.subgraph[1] !== null && isFormattedEdgeObject(path.path.subgraph[1]))
      activateEvidence(item, path.path.subgraph[1], path);
  }, [item, activateEvidence])

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

    let newSelectedPaths: Set<PathObjectContainer> = new Set();

    const checkForNodeMatches = (nodeList: string[], path: PathObjectContainer) => {
      let currentNodeIndex = 0;
      let numMatches = 0;
      for(const el of path.path.subgraph) {
        if(!('curies' in el))
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

    for(const selPath of selectedPaths) {
      for(const path of formattedPaths.current) {
        if(path.path.subgraph.length === 3) {
          const firstNode = path.path.subgraph[0];
          const lastNode = path.path.subgraph[path.path.subgraph.length - 1];
          if('curies' in firstNode && firstNode.curies.includes(selPath[0]) &&
          'curies' in lastNode && lastNode.curies.includes(selPath[selPath.length - 1])) {
            newSelectedPaths.add(path);
          }
        }
        if(path.path.inferred) {
          for(const [i, item] of path.path.subgraph.entries()) {
            if(i % 2 === 0)
              continue;
            if('support' in item && item.support) {
              for(const supportPath of item.support){
                if(checkForNodeMatches(selPath, supportPath))
                  newSelectedPaths.add(supportPath);
              }
            }
          }
        }
        if(checkForNodeMatches(selPath, path))
          newSelectedPaths.add(path);
      }
    }
    setSelectedPaths(newSelectedPaths)

  },[formattedPaths]);

  const handleBookmarkClick = async () => {
    console.log("bookmark click");
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
        console.log("open conf modal");
        setBookmarkRemovalConfirmationModalOpen(true);
      }
      return false;
    } else {
      item.graph = itemGraph;
      delete item.paths;
      let bookmarkObject = getFormattedBookmarkObject("result", item.name, "", queryNodeID,
        queryNodeLabel, queryNodeDescription, type, item, currentQueryID);

      console.log(bookmarkObject);

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
    let tempBookmarkID: string | number | null = itemBookmarkID.current;
    if(!isBookmarked) {
      console.log("no bookmark exists for this item, creating one...")
      let replacementID = await handleBookmarkClick();
      console.log("new id: ", replacementID);
      tempBookmarkID = (replacementID) ? replacementID : tempBookmarkID;
    }
    if(tempBookmarkID) {
      activateNotes(nameString, tempBookmarkID, item);
      setItemHasNotes(true);
    }
  }

  const handleTagClick = (tagID: string, tag: Tag) => {
    let newObj: Tag = {
      name: tag.name,
      negated: false,
      id: tagID,
      value: tag.name
    };
    handleFilter(newObj);
  }

  const handleBookmarkRemovalApproval = () => {
    console.log("removal approved");
    bookmarkRemovalApproved.current = true;
    handleBookmarkClick();
  }

  const handleOpenResultShare = () => {
    setShareResultID(item.id);
    setShareModalOpen(true);
  }

  useEffect(() => {
    itemBookmarkID.current = bookmarkID;
  }, [bookmarkID]);

  useEffect(() => {
    setItemHasNotes(hasNotes);
    formattedPaths.current = item.compressedPaths;
  }, [item, hasNotes]);

  return (
    <div key={key} className={`${styles.result} result ${isPathfinder ? styles.pathfinder : ''}`} data-resultcurie={JSON.stringify(item.subjectNode.curies.slice(0, 5))} ref={sharedItemRef} data-result-name={nameString}>
      <div className={`${styles.nameContainer} ${styles.resultSub}`} onClick={handleToggle}>
        <ResultsItemName
          isPathfinder={isPathfinder}
          item={item}
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
                publicationCount > 0  &&
                <span className={styles.info}>Publications ({publicationCount})</span>
              }
              {
                clinicalTrialCount > 0  &&
                <span className={styles.info}>Clinical Trials ({clinicalTrialCount})</span>
              }
              {
                miscCount > 0  &&
                <span className={styles.info}>Misc ({miscCount})</span>
              }
              {
                sourceCount > 0  &&
                <span className={styles.info}>Sources ({sourceCount})</span>
              }
          </div>
        </span>
      </div>
      <div className={`${styles.pathsContainer} ${styles.resultSub}`}>
        <span className={styles.paths}>
          <span className={styles.pathsNum}>{ pathsCount } {pathsCount > 1 ? "Paths" : "Path"}</span>
        </span>
      </div>
      {
        !isPathfinder &&
        <div className={`${styles.scoreContainer} ${styles.resultSub}`}>
          <span className={styles.score}>
            <span className={styles.scoreNum}>{resultsComplete ? item.score === null ? '0.00' : displayScore(item.score.main) : "Processing..." }</span>
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
          ${(item.tags.some(item=>item.includes("role")) && !isInUserSave) ? styles.hasTags : ''}
          ${(item.description && !isPathfinder) ? styles.hasDescription : '' }
        `}
        duration={500}
        height={height}
        >
        <div className={styles.container}>
          <div>
            {
              item.tags && roleCount > 0 && availableTags &&
              <div className={`${styles.tags} ${tagsHeight > minTagsHeight ? styles.more : '' }`} ref={tagsRef}>
                {
                  item.tags.toSorted((a, b)=>sortTagsBySelected(a, b, activeFilters)).map((fid, i) => {
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
              item.description && !isPathfinder &&
              <p className={styles.description}>
                <Highlighter
                  highlightClassName="highlight"
                  searchWords={activeEntityFilters}
                  autoEscape={true}
                  textToHighlight={item.description}
                />
              </p>
            }
          </div>
        </div>
        <Tabs isOpen className={styles.resultTabs}>
            <Tab heading="Paths">
              <PathView
                paths={formattedPaths.current}
                selectedPaths={selectedPaths}
                isPathfinder={isPathfinder}
                handleEdgeSpecificEvidence={handleEdgeSpecificEvidence}
                handleActivateEvidence={handleActivateEvidence}
                activeEntityFilters={activeEntityFilters}
                pathFilterState={pathFilterState}
                isEven={isEven}
              />
            </Tab>
            <Tab heading="Graph">
              <Suspense fallback={<LoadingBar useIcon reducedPadding />}>
                <GraphView
                  result={item}
                  updateGraphFunction={setItemGraph}
                  prebuiltGraph={(item.graph)? item.graph: null}
                  rawResults={rawResults}
                  onNodeClick={handleNodeClick}
                  clearSelectedPaths={handleClearSelectedPaths}
                  active={isExpanded}
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

// check if certain props are really different before rerendering
const areEqualProps = (prevProps: any, nextProps: any) => {
  // Check for deep equality of the item object
  if (!isEqual(prevProps.item, nextProps.item)) return false;
  // Check other properties
  if (!isEqual(prevProps.zoomKeyDown, nextProps.zoomKeyDown)) return false;
  if (!isEqual(prevProps.startExpanded, nextProps.startExpanded)) return false;
  if (!isEqual(prevProps.activeFilters, nextProps.activeFilters)) return false;
  if (!isEqual(prevProps.activeEntityFilters, nextProps.activeEntityFilters)) return false;
  if (!isEqual(prevProps.resultsComplete, nextProps.resultsComplete)) return false;
  // If none of the conditions are met, props are equal
  return true;
};

export default memo(ResultsItem, areEqualProps);
