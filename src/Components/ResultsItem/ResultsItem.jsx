import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense, memo } from 'react';
import styles from './ResultsItem.module.scss';
import { getIcon, capitalizeAllWords, formatBiolinkEntity, formatBiolinkNode } from '../../Utilities/utilities';
import PathView from '../PathView/PathView';
import LoadingBar from '../LoadingBar/LoadingBar';
import ChevDown from "../../Icons/Directional/Property_1_Down.svg?react"
import Export from "../../Icons/Buttons/Export.svg?react"
import Bookmark from "../../Icons/Navigation/Bookmark.svg?react"
import Notes from "../../Icons/note.svg?react"
import AnimateHeight from "react-animate-height";
import Highlighter from 'react-highlight-words';
import Tooltip from '../Tooltip/Tooltip';
import { Link } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import { generateCsvFromItem } from '../../Utilities/csvGeneration';
import { createUserSave, deleteUserSave, getFormattedBookmarkObject } from '../../Utilities/userApi';
import { useSelector } from 'react-redux';
import { currentRoot } from '../../Redux/rootSlice';
import { getEvidenceFromResult } from '../../Utilities/resultsFormattingFunctions';
import { displayScore } from '../../Utilities/scoring';
// import { setResultsQueryParam } from '../../Utilities/resultsInteractionFunctions';

const GraphView = lazy(() => import("../GraphView/GraphView"));

const sortTagsBySelected = (a, b, selected) => {
  const aExistsInSelected = selected.some((item)=> item.type === a );
  const bExistsInSelected = selected.some((item)=> item.type === b );

  if (aExistsInSelected && bExistsInSelected) return 0; 
  if (aExistsInSelected) return -1; 
  if (bExistsInSelected) return 1; 

  return 0; 
}

const ResultsItem = ({key, item, type, activateEvidence, activeStringFilters, rawResults, zoomKeyDown, handleFilter, activeFilters,
  currentQueryID, queryNodeID, queryNodeLabel, queryNodeDescription, bookmarked, bookmarkID = null, availableTags, hasFocusedOnFirstLoad,
  hasNotes, activateNotes, isFocused, focusedItemRef, bookmarkAddedToast = ()=>{}, bookmarkRemovedToast = ()=>{}, 
  handleBookmarkError = ()=>{}, handleFocusedOnItem = ()=>{}}) => {

  const root = useSelector(currentRoot);

  const currentEvidence = useMemo(() => getEvidenceFromResult(item), [item]);
  let icon = getIcon(item.type);
  let publicationCount = (currentEvidence.publications?.length) 
    ? currentEvidence.publications.filter((item)=> item.type === "PMID" || item.type === "PMC").length
    : 0;
  let clinicalCount = (currentEvidence.publications?.length) 
    ? currentEvidence.publications.filter((item)=> item.type === "NCT").length
    : 0;
  let sourcesCount = (currentEvidence.distinctSources?.length) 
    ? currentEvidence.distinctSources.length
    : 0;
  let roleCount = (item.tags) 
    ? item.tags.filter(tag => tag.includes("role")).length
    : 0;

  const [isBookmarked, setIsBookmarked] = useState(bookmarked);
  const [itemBookmarkID, setItemBookmarkID] = useState(bookmarkID);
  const [itemHasNotes, setItemHasNotes] = useState(hasNotes);
  const [isExpanded, setIsExpanded] = useState(isFocused);
  const [height, setHeight] = useState(0);
  const formattedPaths = useRef(item.compressedPaths);
  const [selectedPaths, setSelectedPaths] = useState(new Set());
  const [csvData, setCsvData] = useState([]);

  const initPathString = useRef((type?.pathString) ? type.pathString : 'may affect');
  const tagsRef = useRef(null);
  const [tagsHeight, setTagsHeight] = useState(0);
  const minTagsHeight = 45;

  const numRoles = item.tags.filter(tag => tag.includes("role")).length;

  useEffect(() => {
    if(!tagsRef.current)
      return;
    
    const resizeObserver = new ResizeObserver(() => {
      setTagsHeight(tagsRef.current.clientHeight);
    });

    resizeObserver.observe(tagsRef.current);
    return() => {
      resizeObserver.disconnect();
    };
  },[]);

  useEffect(() => {
    if (!isFocused || focusedItemRef === null || hasFocusedOnFirstLoad) 
      return;

    focusedItemRef.current.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
    handleFocusedOnItem();
  }, [focusedItemRef])

  const getPathsCount = (paths) => {
    let count = paths.length;
    for(const path of paths) {
      for(const [i, subgraphItem] of path.path.subgraph.entries()) {
        if(i % 2 === 0 || !subgraphItem.support)
          continue;
        count += subgraphItem.support.length;
      }
    }
    return count;
  } 
  
  const pathsCount = useMemo(()=>getPathsCount(formattedPaths.current), [formattedPaths]);
  const pathString = (pathsCount > 1) ? `Paths that ${initPathString.current}` : `Path that ${initPathString.current}`;
  const typeString = (item.type !== null) ? formatBiolinkEntity(item.type) : '';
  const nameString = (item.name !== null) ? formatBiolinkNode(item.name, typeString) : '';
  const objectString = (item.object !== null) ? capitalizeAllWords(item.object) : '';

  const [itemGraph, setItemGraph] = useState(null);

  const handleToggle = () => {
    if (!isExpanded) {
      // setResultsQueryParam('r', item.id);
    }

    setIsExpanded(!isExpanded);
  }

  const handleEdgeSpecificEvidence = useCallback((edgeGroup, path) => {
    activateEvidence(currentEvidence, item, edgeGroup, path, false);
  }, [currentEvidence, item, activateEvidence])

  const handleActivateEvidence = useCallback((path) => {
    activateEvidence(currentEvidence, item, null, path, false);
  }, [currentEvidence, item, activateEvidence])

  useEffect(() => {
    if(isExpanded === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [isExpanded])

  const handleClearSelectedPaths = useCallback(() => {
    setSelectedPaths(new Set())
  },[]);

  const handleNodeClick = useCallback((selectedPaths) => {
    if(!selectedPaths) 
      return;

    let newSelectedPaths = new Set();

    const checkForNodeMatches = (nodeList, path) => {
      let currentNodeIndex = 0;
      let numMatches = 0;
      for(const [i, el] of path.path.subgraph.entries()) {
        if(i % 2 !== 0)
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
        if(path.path.subgraph.length === 3
          && path.path.subgraph[0].curies.includes(selPath[0])
          && path.path.subgraph[path.path.subgraph.length - 1].curies.includes(selPath[selPath.length - 1])) {
          newSelectedPaths.add(path);
        }
        if(path.path.inferred) {
          for(const [i, item] of path.path.subgraph.entries()) {
            if(i % 2 === 0)
              continue;
            if(item.support) {
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
    console.log(newSelectedPaths);
    setSelectedPaths(newSelectedPaths)

  },[formattedPaths]);

  const handleBookmarkClick = async () => {
    if(isBookmarked) {
      if(itemBookmarkID) {
        deleteUserSave(itemBookmarkID);
        setIsBookmarked(false);
        setItemHasNotes(false);
        setItemBookmarkID(null);
        bookmarkRemovedToast();
      }
      return false;
    } else {
      item.graph = itemGraph;
      delete item.paths;
      let bookmarkObject = getFormattedBookmarkObject("result", item.name, "", queryNodeID, 
        queryNodeLabel, queryNodeDescription, type, item, currentQueryID);

      console.log(bookmarkObject);

      let bookmarkedItem = await createUserSave(bookmarkObject, handleBookmarkError, handleBookmarkError);
      console.log('bookmarked: ', bookmarkedItem);
      if(bookmarkedItem) {
        setIsBookmarked(true);
        setItemBookmarkID(bookmarkedItem.id);
        bookmarkAddedToast();
        return bookmarkedItem.id;
      }
      return false;
    }
  }

  const handleNotesClick = async () => {
    let tempBookmarkID = itemBookmarkID;
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

  const handleTagClick = (tagID, tagObject) => {
    let newObj = {};
    newObj.type = tagID;
    newObj.value = tagObject.name;
    handleFilter(newObj);
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
        <span className={styles.effect}>{pathsCount} {pathString} {objectString}</span>
      </div>
      <div className={`${styles.bookmarkContainer} ${styles.resultSub}`}>
        {
          root === "main" 
            ? <>
                <div className={`${styles.icon} ${styles.bookmarkIcon} ${isBookmarked ? styles.filled : ''}`}>
                  <Bookmark onClick={handleBookmarkClick} data-tooltip-id={`bookmark-tooltip-${nameString}`} aria-describedby={`bookmark-tooltip-${nameString}`} />
                  <Tooltip id={`bookmark-tooltip-${nameString}`}>
                    <span className={styles.tooltip}>Bookmark this result to review it later in the <Link to="/main/workspace" target='_blank'>Workspace</Link></span>
                  </Tooltip>
                </div>
                <div className={`${styles.icon} ${styles.notesIcon} ${itemHasNotes ? styles.filled : ''}`}>
                  <Notes onClick={handleNotesClick} data-tooltip-id={`notes-tooltip-${nameString}`} aria-describedby={`notes-tooltip-${nameString}`} />
                  <Tooltip id={`notes-tooltip-${nameString}`}>
                    <span className={styles.tooltip}>Add your own custom notes to this result. <br/> (You can also view and edit notes on your<br/> bookmarked results in the <Link to="/main/workspace" target='_blank'>Workspace</Link>)</span>
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
      <CSVLink
        className={styles.downloadButton}
        data={csvData}
        filename={`${item.name.toLowerCase()}.csv`}
        onClick={generateCsvFromItem(item, setCsvData)}>
          <Export data-tooltip-id={`csv-tooltip-${nameString}`} aria-describedby={`csv-tooltip-${nameString}`}/>
          <Tooltip id={`csv-tooltip-${nameString}`}>
            <span className={styles.tooltip}>Download a version of this result in CSV format.</span>
          </Tooltip>
      </CSVLink>
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
        <Suspense fallback={<LoadingBar loading useIcon reducedPadding />}>
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
    </div>
  );
}

const areEqualProps = (prevProps, nextProps) => {
  // Perform a shallow comparison of 'item' properties
  const prevDataKeys = Object.keys(prevProps.item);
  const nextDataKeys = Object.keys(nextProps.item);

  if (prevDataKeys.length !== nextDataKeys.length) {
    return false;
  }

  for (const key of prevDataKeys) {
    if (prevProps.item[key] !== nextProps.item[key]) {
      return false;
    }
  }

  // If none of the above conditions are met, props are equal
  return true;
};

export default memo(ResultsItem, areEqualProps);
