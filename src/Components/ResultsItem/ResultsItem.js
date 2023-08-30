import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import styles from './ResultsItem.module.scss';
import { getIcon, capitalizeAllWords } from '../../Utilities/utilities';
import PathView from '../PathView/PathView';
import LoadingBar from '../LoadingBar/LoadingBar';
import {ReactComponent as ChevDown } from "../../Icons/Directional/Property 1 Down.svg"
import {ReactComponent as Export } from "../../Icons/Buttons/Export.svg"
import {ReactComponent as Bookmark } from "../../Icons/Navigation/Bookmark.svg"
import {ReactComponent as Notes } from "../../Icons/note.svg"
import AnimateHeight from "react-animate-height";
import Highlighter from 'react-highlight-words';
import { cloneDeep } from 'lodash';
import { CSVLink } from 'react-csv';
import { generateCsvFromItem } from '../../Utilities/csvGeneration';
import { createUserSave, deleteUserSave, getFormattedBookmarkObject } from '../../Utilities/userApi';
import { useSelector } from 'react-redux';
import { currentRoot } from '../../Redux/rootSlice';
import { getFormattedEdgeLabel } from '../../Utilities/resultsFormattingFunctions';
import { displayScore } from '../../Utilities/scoring';

const GraphView = lazy(() => import("../GraphView/GraphView"));

const getTypeFromPub = (publicationID) => { 
  if(publicationID.toLowerCase().includes("pmid"))
    return "PMID";
  if(publicationID.toLowerCase().includes("pmc"))
    return "PMC";
  if(publicationID.toLowerCase().includes("clinicaltrials"))
    return "NCT";
  return "other";
}

const getUrlByType = (publicationID, type) => {
  let url = false;
  switch (type) {
    case "PMID":
      url = `http://www.ncbi.nlm.nih.gov/pubmed/${publicationID.replace("PMID:", "")}`;
      break;
    case "PMC":
      url = `https://www.ncbi.nlm.nih.gov/pmc/${publicationID}`;
      break;
    case "NCT":
      url = `https://clinicaltrials.gov/ct2/show/${publicationID.replace("clinicaltrials:", "")}}`
      break;
    default:
      url = publicationID;
      break;
  }
  return url;
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

const ResultsItem = ({key, item, type, activateEvidence, activeStringFilters, rawResults, zoomKeyDown, 
  currentQueryID, queryNodeID, queryNodeLabel, queryNodeDescription, bookmarked, bookmarkID = null,
  hasNotes, activateNotes, bookmarkAddedToast = ()=>{}, bookmarkRemovedToast = ()=>{}, handleBookmarkError = ()=>{}}) => {

  const root = useSelector(currentRoot);

  const currentEvidence = useMemo(() => getCurrentEvidence(item), [item]);
  let icon = getIcon(item.type);
  let publicationCount = (currentEvidence.publications?.length) 
    ? currentEvidence.publications.length
    : 0;
  let sourcesCount = (currentEvidence.distinctSources?.length) 
    ? currentEvidence.distinctSources.length
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

  const pathString = (formattedPaths.length > 1) ? `Paths that ${initPathString.current}` : `Path that ${initPathString.current}`;
  const nameString = (item.name !== null) ? item.name : '';
  const objectString = (item.object !== null) ? capitalizeAllWords(item.object) : '';

  const [itemGraph, setItemGraph] = useState(null);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  }

  const handleEdgeSpecificEvidence = (edgeGroup) => {
    const filterEvidenceObjs = (objs, selectedEdge, container) => {
      const selectedEdgeLabel = getFormattedEdgeLabel(selectedEdge.subject.name, selectedEdge.predicate, selectedEdge.object.name);
      for (const obj of objs) {
        let proceed = false;
        if(Array.isArray(obj.edges) && obj.edges[0].label === selectedEdgeLabel) {
          proceed = true;
        } else if(obj.edges[selectedEdge.id] !== undefined) {
          proceed = true;
        }

        if(proceed) {
          const includedObj = cloneDeep(obj);
          // includedObj.edges = {};
          // includedObj.edges[selectedEdge.id] = obj.edges[selectedEdge.id];
          container.push(includedObj);
        }
      }
    }

    let filteredEvidence = {
      publications: [],
      sources: []
    };

    let filteredPublications = filteredEvidence.publications;
    let filteredSources = filteredEvidence.sources;
    for (const edge of edgeGroup.edges) {
      filterEvidenceObjs(currentEvidence.publications, edge, filteredPublications);
      filterEvidenceObjs(currentEvidence.sources, edge, filteredSources);
    }
    // call activateEvidence with the filtered evidence
    activateEvidence(filteredEvidence, item, edgeGroup, false);
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
                  <Bookmark onClick={handleBookmarkClick} />
                </div>
                <div className={`${styles.icon} ${styles.notesIcon} ${itemHasNotes ? styles.filled : ''}`}>
                  <Notes onClick={handleNotesClick} />
                </div>
              </>
            : <></>
        }
      </div>
      <div className={`${styles.evidenceContainer} ${styles.resultSub}`}>
        <span
          className={styles.evidenceLink}
          onClick={(e)=>{
            e.stopPropagation();
            activateEvidence(currentEvidence, item, [], true);
          }}
          >
          <div>
            <span className={styles.viewAll}>View All Evidence</span>
          </div>
          <div>
            <span className={styles.info}>Publications ({publicationCount})</span>
            <span className={styles.info}>Sources ({sourcesCount})</span>
          </div>
        </span>
      </div>
      <div className={`${styles.scoreContainer} ${styles.resultSub}`}>
        <span className={styles.score}>
          <span className={styles.scoreNum}>{item.score === null ? '0' : displayScore(item.score.sugeno) }</span>
        </span>
      </div>
      <CSVLink
        className={styles.downloadButton}
        data={csvData}
        filename={`${item.name.toLowerCase()}.csv`}
        onClick={generateCsvFromItem(item, setCsvData)}>
          <Export/>
      </CSVLink>
      <button className={`${styles.accordionButton} ${isExpanded ? styles.open : styles.closed }`} onClick={handleToggle}>
        <ChevDown/>
      </button>
      <AnimateHeight
        className={`${styles.accordionPanel} ${isExpanded ? styles.open : styles.closed } ${item.description ? styles.hasDescription : styles.noDescription }`}
        duration={500}
        height={height}
        >
        <div className={styles.container}>
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
          handleEdgeSpecificEvidence={(edgeGroup)=> {handleEdgeSpecificEvidence(edgeGroup)}}
          activeStringFilters={activeStringFilters}
        />
      </AnimateHeight>
    </div>
  );
}

export default ResultsItem;
