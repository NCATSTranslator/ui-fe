import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import styles from './ResultsItem.module.scss';
import { getIcon, capitalizeAllWords } from '../../Utilities/utilities';
import PathView from '../PathView/PathView';
import LoadingBar from '../LoadingBar/LoadingBar';
import {ReactComponent as ChevDown } from "../../Icons/Directional/Property 1 Down.svg"
import AnimateHeight from "react-animate-height";
import Highlighter from 'react-highlight-words';
import { cloneDeep } from 'lodash';

const GraphView = lazy(() => import("../GraphView/GraphView"));

const ResultsItem = ({key, item, type, activateEvidence, activeStringFilters, rawResults}) => {

  let icon = getIcon(item.type);

  let evidenceCount = item.evidence.length;
  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(0);
  const formattedPaths = item.compressedPaths;
  const [selectedPaths, setSelectedPaths] = useState(new Set());

  const initPathString = (type !== undefined && type.pathString) ? type.pathString : 'may affect';

  let pathString = (formattedPaths.size > 1) ? `Paths that ${initPathString}` : `Path that ${initPathString}`;
  let nameString = (item.name !== null) ? item.name : '';
  let objectString = (item.object !== null) ? capitalizeAllWords(item.object) : '';

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  }

  const handleEdgeSpecificEvidence = (edgeGroup) => {
    const filterEvidenceObjs = (objs, selectedEdge, container) => {
      for (const obj of objs) {
        let include = true;
        // check for subject match
        if(obj.edge.subject.toLowerCase() !== selectedEdge.subject.names[0].toLowerCase())
          include = false;
        // check for predicate match
        if(!obj.edge.predicates.map((p) => p.toLowerCase()).includes(selectedEdge.predicate.toLowerCase()))
          include = false;
        // check for object match
        if(obj.edge.object.toLowerCase() !== selectedEdge.object.names[0].toLowerCase())
          include = false;

        if(include) {
          const includedObj = cloneDeep(obj);
          includedObj.edge.predicates = [selectedEdge.predicate];
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
      filterEvidenceObjs(item.evidence.publications, edge, filteredPublications);
      filterEvidenceObjs(item.evidence.sources, edge, filteredSources);
    }

    // call activateEvidence with the filtered evidence
    activateEvidence(filteredEvidence, edgeGroup, false);
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
        <span className={styles.effect}>{formattedPaths.size} {pathString} {objectString}</span>
      </div>
      <div className={`${styles.evidenceContainer} ${styles.resultSub}`}>
        <span
          className={styles.evidenceLink}
          onClick={(e)=>{
            e.stopPropagation();
            activateEvidence(item.evidence, [], true);
          }}
          >
          <span className={styles.viewAll}>View All Evidence</span> ({evidenceCount})
        </span>
      </div>
      <div className={`${styles.scoreContainer} ${styles.resultSub}`}>
        <span className={styles.score}>
          <span className={styles.scoreNum}>{item.score === null ? '0' : item.score }</span>
        </span>
      </div>
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
            rawResults={rawResults}
            onNodeClick={handleNodeClick}
            clearSelectedPaths={handleClearSelectedPaths}
            active={isExpanded}
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
