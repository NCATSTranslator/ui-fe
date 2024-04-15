import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense, memo, FC, RefObject } from 'react';
import styles from './ResultsItem.module.scss';
import { getIcon, formatBiolinkEntity, formatBiolinkNode } from '../../Utilities/utilities';
import PathView from '../PathView/PathView';
import LoadingBar from '../LoadingBar/LoadingBar';
import ChevDown from "../../Icons/Directional/Property_1_Down.svg?react"
// import Export from "../../Icons/Buttons/Export.svg?react"
import Bookmark from "../../Icons/Navigation/Bookmark.svg?react"
import Notes from "../../Icons/note.svg?react"
import AnimateHeight from "react-animate-height";
import Highlighter from 'react-highlight-words';
import Tooltip from '../Tooltip/Tooltip';
import BookmarkConfirmationModal from '../Modals/BookmarkConfirmationModal';
import { Link } from 'react-router-dom';
// import { CSVLink } from 'react-csv';
// import { generateCsvFromItem } from '../../Utilities/csvGeneration';
import { createUserSave, deleteUserSave, getFormattedBookmarkObject } from '../../Utilities/userApi';
import { useSelector } from 'react-redux';
import { currentRoot } from '../../Redux/rootSlice';
import { getEvidenceFromResult } from '../../Utilities/resultsFormattingFunctions';
import { displayScore } from '../../Utilities/scoring';
import { QueryType } from '../../Utilities/queryTypes';
// import { setResultsQueryParam } from '../../Utilities/resultsInteractionFunctions';
import { ResultItem, RawResult, PathObjectContainer, Tag, Filter, FormattedEdgeObject } from '../../Types/results';
import { EvidenceContainer, PublicationObject } from '../../Types/evidence';

const GraphView = lazy(() => import("../GraphView/GraphView"));

const sortTagsBySelected = (
  a: string,
  b: string,
  selected: [{type: string;}] | Filter[]
): number => {
  const aExistsInSelected = selected.some((item) => item.type === a);
  const bExistsInSelected = selected.some((item) => item.type === b);

  if (aExistsInSelected && bExistsInSelected) return 0;
  if (aExistsInSelected) return -1;
  if (bExistsInSelected) return 1;

  return 0;
};

interface ResultsItemProps {
  activateEvidence?: (evidence: EvidenceContainer, item: ResultItem, edgeGroup: FormattedEdgeObject[] | null, path: PathObjectContainer) => void;
  activateNotes?: (nameString: string, id: string | number, item: ResultItem) => void;
  activeFilters: Filter[];
  activeStringFilters: string[];
  availableTags: {[key: string]: Tag};
  bookmarkAddedToast?: () => void;
  bookmarkRemovedToast?: () => void;
  bookmarked?: boolean;
  bookmarkID?: string | null;
  currentQueryID: string;
  focusedItemRef: RefObject<HTMLDivElement>;
  handleBookmarkError?: () => void;
  handleFilter: (tagObject: Tag) => void;
  hasNotes: boolean;
  item: ResultItem;
  isFocused: boolean;
  key: string;
  queryNodeDescription: string;
  queryNodeID: string;
  queryNodeLabel: string;
  rawResults: RawResult[];
  type: QueryType;
  zoomKeyDown: boolean;
}

const ResultsItem: FC<ResultsItemProps> = ({
    activateEvidence = () => {},
    activateNotes = () => {},
    activeFilters,
    activeStringFilters,
    availableTags,
    bookmarkAddedToast = () => {},
    bookmarkRemovedToast = () => {},
    bookmarked = false,
    bookmarkID = null,
    currentQueryID,
    focusedItemRef,
    handleBookmarkError = () => {},
    handleFilter = () => {},
    hasNotes = false,
    isFocused = false,
    item,
    key,
    queryNodeID,
    queryNodeDescription,
    queryNodeLabel,
    rawResults,
    type,
    zoomKeyDown,
  }) => {
  const root = useSelector(currentRoot);

  let icon: JSX.Element = getIcon(item.type);
  const currentEvidence = useMemo(() => getEvidenceFromResult(item), [item]);
  let publicationCount: number = (currentEvidence.publications?.length)
    ? currentEvidence.publications.filter((pub: PublicationObject)=> pub.type === "PMID" || pub.type === "PMC").length
    : 0;
  let clinicalCount: number = (currentEvidence.publications?.length)
    ? currentEvidence.publications.filter((pub: PublicationObject)=> pub.type === "NCT").length
    : 0;
  let sourcesCount: number = (currentEvidence.distinctSources?.length)
    ? currentEvidence.distinctSources.length
    : 0;
  let roleCount: number = (item.tags)
    ? item.tags.filter(tag => tag.includes("role")).length
    : 0;

  const [isBookmarked, setIsBookmarked] = useState<boolean>(bookmarked);
  const [itemBookmarkID, setItemBookmarkID] = useState<string | null>(bookmarkID);
  const [itemHasNotes, setItemHasNotes] = useState<boolean>(hasNotes);
  const [isExpanded, setIsExpanded] = useState<boolean>(isFocused);
  const [height, setHeight] = useState<number | string>(0);
  const formattedPaths = useRef<PathObjectContainer[]>(item.compressedPaths);
  // selectedPaths include the node ids of a path in a string array
  const [selectedPaths, setSelectedPaths] = useState<Set<string[]> | Set<PathObjectContainer> | null>(null);
  // const [csvData, setCsvData] = useState([]);
  const bookmarkRemovalApproved = useRef<boolean>(false);
  const [bookmarkRemovalConfirmationModalOpen, setBookmarkRemovalConfirmationModalOpen] = useState<boolean>(false);

  const initPathString = useRef((type?.pathString) ? type.pathString : 'may affect');
  const tagsRef = useRef<HTMLDivElement>(null);
  const [tagsHeight, setTagsHeight] = useState<number>(0);
  const minTagsHeight = 45;

  const numRoles = item.tags.filter(tag => tag.includes("role")).length;

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

  // useEffect(() => {
  //   if (!isFocused || focusedItemRef === null || hasFocusedOnFirstLoad)
  //     return;

  //   focusedItemRef.current.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
  //   handleFocusedOnItem();
  // }, [focusedItemRef])

  const getPathsCount = (paths: PathObjectContainer[]): number => {
    let count = paths.length;
    for(const path of paths) {
      for(const subgraphItem of path.path.subgraph) {
        if('support' in subgraphItem && subgraphItem.support !== undefined)
          count += subgraphItem.support.length;
      }
    }
    return count;
  }

  const pathsCount: number = useMemo(()=>getPathsCount(formattedPaths.current), [formattedPaths]);
  const pathString: string = (pathsCount > 1) ? `Paths that ${initPathString.current}` : `Path that ${initPathString.current}`;
  const typeString: string = (item.type !== null) ? formatBiolinkEntity(item.type) : '';
  const nameString: string = (item.name !== null) ? formatBiolinkNode(item.name, typeString) : '';
  // const objectString = (item.object !== null) ? capitalizeAllWords(item.object) : '';

  const [itemGraph, setItemGraph] = useState(null);

  const handleToggle = () => {
    if (!isExpanded) {
      // setResultsQueryParam('r', item.id);
    }

    setIsExpanded(!isExpanded);
  }

  const handleEdgeSpecificEvidence = useCallback((edgeGroup: FormattedEdgeObject[], path: PathObjectContainer) => {
    activateEvidence(currentEvidence, item, edgeGroup, path);
  }, [currentEvidence, item, activateEvidence])

  const handleActivateEvidence = useCallback((path: PathObjectContainer) => {
    activateEvidence(currentEvidence, item, null, path);
  }, [currentEvidence, item, activateEvidence])

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
      console.log(bookmarkRemovalApproved.current, itemBookmarkID);
      if(bookmarkRemovalApproved.current && itemBookmarkID) {
        console.log("remove bookmark");
        deleteUserSave(itemBookmarkID);
        setIsBookmarked(false);
        setItemHasNotes(false);
        setItemBookmarkID(null);
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
        setItemBookmarkID(newBookmarkedItem.id.toString());
        bookmarkAddedToast();
        return newBookmarkedItem.id;
      }
      return false;
    }
  }

  const handleNotesClick = async () => {
    let tempBookmarkID: string | number | null = itemBookmarkID;
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

  const handleTagClick = (tagID: string, tagObject: Tag) => {
    let newObj: Tag = {
      name: tagObject.name,
      negated: false,
      type: tagID,
      value: tagObject.name
    };
    handleFilter(newObj);
  }

  const handleBookmarkRemovalApproval = () => {
    console.log("removal approved");
    bookmarkRemovalApproved.current = true;
    handleBookmarkClick();
  }

  useEffect(() => {
    setItemBookmarkID(bookmarkID);
  }, [bookmarkID]);

  useEffect(() => {
    setItemHasNotes(hasNotes);
    formattedPaths.current = item.compressedPaths;
  }, [item, hasNotes]);

  return (
    <div key={key} className={`${styles.result} result`} data-resultcurie={JSON.stringify(item.subjectNode.curies.slice(0, 5))} ref={isFocused ? focusedItemRef : null}>
      <div className={`${styles.nameContainer} ${styles.resultSub}`} onClick={handleToggle}>
        <span className={styles.icon}>{icon}</span>
        {
          item.highlightedName &&
          <span className={styles.name} dangerouslySetInnerHTML={{__html: item.highlightedName}} ></span>
        }
        {
          !item.highlightedName &&
          <span className={styles.name} >
            <Highlighter
              highlightClassName="highlight"
              searchWords={activeStringFilters}
              autoEscape={true}
              textToHighlight={nameString}
            />
          </span>
        }
        <span className={styles.effect}>{pathsCount} {pathString} {queryNodeLabel}</span>
      </div>
      <div className={`${styles.bookmarkContainer} ${styles.resultSub}`}>
        {
          root === "main"
            ? <>
                <div className={`${styles.icon} ${styles.bookmarkIcon} ${isBookmarked ? styles.filled : ''}`}>
                  <Bookmark onClick={handleBookmarkClick} data-tooltip-id={`bookmark-tooltip-${nameString.replaceAll("'", "")}`} aria-describedby={`bookmark-tooltip-${nameString.replaceAll("'", "")}`} />
                  <Tooltip id={`bookmark-tooltip-${nameString.replaceAll("'", "")}`}>
                    <span className={styles.tooltip}>
                      {
                        isBookmarked
                        ? <>Remove this bookmark.</>
                        : <>Bookmark this result to review it later in the <Link to="/main/workspace" target='_blank'>Workspace</Link>.</>
                      }
                    </span>
                  </Tooltip>
                </div>
                <div className={`${styles.icon} ${styles.notesIcon} ${itemHasNotes ? styles.filled : ''}`}>
                  <Notes onClick={handleNotesClick} data-tooltip-id={`notes-tooltip-${nameString.replaceAll("'", "")}`} aria-describedby={`notes-tooltip-${nameString.replaceAll("'", "")}`} />
                  <Tooltip id={`notes-tooltip-${nameString.replaceAll("'", "")}`}>
                    <span className={styles.tooltip}>Add your own custom notes to this result. <br/> (You can also view and edit notes on your<br/> bookmarked results in the <Link to="/main/workspace" target='_blank'>Workspace</Link>).</span>
                  </Tooltip>
                </div>
              </>
            : <></>
        }
      </div>
      <div className={`${styles.evidenceContainer} ${styles.resultSub}`}>
        <span
          className={styles.evidenceLink}
          // onClick={(e)=>{
          //   e.stopPropagation();
          //   activateEvidence(currentEvidence, item, [], null, true);
          // }}
          >
          <div>
            <span className={styles.viewAll}>Evidence</span>
          </div>
          <div>
            <span className={styles.info}>Publications ({publicationCount})</span>
            <span className={styles.info}>Clinical Trials ({clinicalCount})</span>
            <span className={styles.info}>Sources ({sourcesCount})</span>
          </div>
        </span>
      </div>
      <div className={`${styles.scoreContainer} ${styles.resultSub}`}>
        <span className={styles.score}>
          <span className={styles.scoreNum}>{item.score === null ? '0.00' : displayScore(item.score.main) }</span>
        </span>
      </div>
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
      <button className={`${styles.accordionButton} ${isExpanded ? styles.open : styles.closed }`} onClick={handleToggle}>
        <ChevDown/>
      </button>
      <AnimateHeight
        className={`${styles.accordionPanel}
          ${isExpanded ? styles.open : styles.closed }
          ${item.description || item.tags.some(item=>item.includes("role")) ? styles.hasDescription : styles.noDescription }
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
                  item.tags.sort((a, b)=>sortTagsBySelected(a, b, activeFilters)).map((tagID, i) => {
                    if(!tagID.includes("role"))
                      return null;
                    let tagObject = availableTags[tagID];
                    let activeClass = (activeFilters.some((item)=> item.type === tagID && item.value === tagObject.name))
                      ? styles.active
                      : styles.inactive;

                    if(numRoles > 4 && i === 4) {
                      const moreCount = numRoles - 4;
                      return (
                        <>
                          <button key={tagID} className={`${styles.tag} ${activeClass}`} onClick={()=>handleTagClick(tagID, tagObject)}>{tagObject.name} ({tagObject.count})</button>
                          <span className={styles.hasMore}>(+{moreCount} more)</span>
                        </>
                      );
                    }

                    return(
                      <button key={tagID} className={`${styles.tag} ${activeClass}`} onClick={()=>handleTagClick(tagID, tagObject)}>{tagObject.name} ({tagObject.count})</button>
                    )
                  })
                }
              </div>
            }
            {
              item.description &&
              <p>
                <Highlighter
                  highlightClassName="highlight"
                  searchWords={activeStringFilters}
                  autoEscape={true}
                  textToHighlight={item.description}
                />
              </p>
            }
          </div>
        </div>
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
        <PathView
          paths={formattedPaths.current}
          selectedPaths={selectedPaths}
          active={isExpanded}
          handleEdgeSpecificEvidence={handleEdgeSpecificEvidence}
          handleActivateEvidence={handleActivateEvidence}
          activeStringFilters={activeStringFilters}
        />
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
  // keys for the item prop
  const prevItemDataKeys = Object.keys(prevProps.item);
  const nextItemDataKeys = Object.keys(nextProps.item);

  if (prevItemDataKeys.length !== nextItemDataKeys.length) {
    return false;
  }

  // check for nonequivalent properties within the item prop object
  for (const key of prevItemDataKeys) {
    if (prevProps.item[key] !== nextProps.item[key]) {
      return false;
    }
  }

  // if zoom key status has changed, return false to rerender
  if(prevProps.zoomKeyDown !== undefined && nextProps.zoomKeyDown !== undefined && prevProps.zoomKeyDown !== nextProps.zoomKeyDown)
    return false;

  // If none of the above conditions are met, props are equal, return true to not rerender
  return true;
};

export default memo(ResultsItem, areEqualProps);
