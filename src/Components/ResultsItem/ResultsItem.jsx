import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import styles from './ResultsItem.module.scss';
import { getIcon, capitalizeAllWords } from '../../Utilities/utilities';
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
import { getFormattedEdgeLabel, getUrlByType, getTypeFromPub } from '../../Utilities/resultsFormattingFunctions';
import { displayScore } from '../../Utilities/scoring';

const GraphView = lazy(() => import("../GraphView/GraphView"));

const sortTagsBySelected = (a, b, selected) => {
  const aExistsInSelected = selected.some((item)=> item.type === a );
  const bExistsInSelected = selected.some((item)=> item.type === b );

  if (aExistsInSelected && bExistsInSelected) return 0; 
  if (aExistsInSelected) return -1; 
  if (bExistsInSelected) return 1; 

  return 0; 
}

const getCurrentEvidence = (result) => {
  let evidenceObject = {};
  if(!result || !result.evidence)
    return evidenceObject; 

  evidenceObject.distinctSources = (result.evidence.distinctSources) ? result.evidence.distinctSources : [];
  evidenceObject.sources = (result.evidence.sources) ? result.evidence.sources : [];
  evidenceObject.publications = [];
  for(const path of result.compressedPaths) {
    for(const [i, subgraphItem] of Object.entries(path.path.subgraph)) {
      if(i % 2 === 0)
        continue;

      let index = parseInt(i);
      let subjectName = path.path.subgraph[index-1].name;
      let predicateName = subgraphItem.predicates[0];
      let objectName = path.path.subgraph[index + 1].name;
      let edgeLabel = getFormattedEdgeLabel(subjectName, predicateName, objectName);

      for(const pubID of subgraphItem.publications) {
        let type = getTypeFromPub(pubID);
        let url = getUrlByType(pubID, type);
        let newPub = {
          edges: [{label: edgeLabel}],
          type: type,
          url: url,
          id: pubID
        }
        evidenceObject.publications.push(newPub);
      }
    }
  }
  return evidenceObject;
}

const ResultsItem = ({key, item, type, activateEvidence, activeStringFilters, rawResults, zoomKeyDown, handleFilter, activeFilters,
  currentQueryID, queryNodeID, queryNodeLabel, queryNodeDescription, bookmarked, bookmarkID = null, availableTags,
  hasNotes, activateNotes, bookmarkAddedToast = ()=>{}, bookmarkRemovedToast = ()=>{}, handleBookmarkError = ()=>{}}) => {

  const root = useSelector(currentRoot);

  const currentEvidence = useMemo(() => getCurrentEvidence(item), [item]);
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(0);
  const formattedPaths = item.compressedPaths;
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

  const pathString = (formattedPaths.length > 1) ? `Paths that ${initPathString.current}` : `Path that ${initPathString.current}`;
  const nameString = (item.name !== null) ? item.name : '';
  const objectString = (item.object !== null) ? capitalizeAllWords(item.object) : '';

  const [itemGraph, setItemGraph] = useState(null);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  }

  const handleEdgeSpecificEvidence = (edgeGroup, path) => {
    activateEvidence(currentEvidence, item, edgeGroup, path, false);
  }

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

    for(const path of formattedPaths) {
      if(path.path.subgraph.length === 3) {
        newSelectedPaths.add(path);
      }
    }

    for(const selPath of selectedPaths) {
      for(const path of formattedPaths) {
        let currentNodeIndex = 0;
        let numMatches = 0;
        for(const [i, el] of path.path.subgraph.entries()) {
          if(i % 2 !== 0)
            continue;

          if(selPath[currentNodeIndex] && el.curies.includes(selPath[currentNodeIndex])) {
            numMatches++;
          }
          currentNodeIndex++;
        }
        if(numMatches === selPath.length) {
          newSelectedPaths.add(path);
          break;
        }
      }
    }

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
  }, [item, hasNotes]);

  return (
    <div key={key} className={`${styles.result} result`} data-resultcurie={JSON.stringify(item.subjectNode.curies.slice(0, 5))}>
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
        <span className={styles.effect}>{formattedPaths.length} {pathString} {objectString}</span>
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
          paths={formattedPaths}
          selectedPaths={selectedPaths}
          active={isExpanded}
          handleEdgeSpecificEvidence={(edgeGroup, path)=> {handleEdgeSpecificEvidence(edgeGroup, path)}}
          handleActivateEvidence={(path)=>activateEvidence(currentEvidence, item, null, path, false)}
          activeStringFilters={activeStringFilters}
        />
      </AnimateHeight>
    </div>
  );
}

export default ResultsItem;
