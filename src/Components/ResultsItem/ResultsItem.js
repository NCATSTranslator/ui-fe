import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import styles from './ResultsItem.module.scss';
import { getIcon, capitalizeAllWords } from '../../Utilities/utilities';
import PathView from '../PathView/PathView';
import LoadingBar from '../LoadingBar/LoadingBar';
import {ReactComponent as ChevDown } from "../../Icons/Directional/Property 1 Down.svg"
import AnimateHeight from "react-animate-height";
import Highlighter from 'react-highlight-words';
import { formatBiolinkEntity } from '../../Utilities/utilities';
import { cloneDeep } from 'lodash';
// import GraphView from '../GraphView/GraphView';

const GraphView = lazy(() => import("../GraphView/GraphView"));

const ResultsItem = ({key, item, type, activateEvidence, activeStringFilters, rawResults}) => {

  let icon = getIcon(item.type);

  let evidenceCount = item.evidence.length;
  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(0);
  const [formattedPaths, setFormattedPaths] = useState(new Set());
  const [selectedPaths, setSelectedPaths] = useState(new Set());

  const initPathString = (type !== undefined && type.pathString) ? type.pathString : 'may affect';

  let pathString = (formattedPaths.size > 1) ? `Paths that ${initPathString}` : `Path that ${initPathString}`;
  let nameString = (item.name !== null) ? item.name : '';
  let objectString = (item.object !== null) ? capitalizeAllWords(item.object) : '';

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  }

  const handleEdgeSpecificEvidence = (edgeGroup) => {
    const filteredEvidence = [];
    for(const evidenceItem of item.evidence) {
      for(const clickedPredicate of edgeGroup.predicates) {
        if (evidenceItem.edge.predicates.map((p) => p.toLowerCase()).includes(clickedPredicate.toLowerCase())) {
          const newEvidenceItem = cloneDeep(evidenceItem);
          newEvidenceItem.edge.predicates = [clickedPredicate];
          filteredEvidence.push(newEvidenceItem);
          break;
        }
      }
    }

    // call activateEvidence with the filtered evidence
    activateEvidence(filteredEvidence, edgeGroup);
  }

  useEffect(() => {
    if(isExpanded === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [isExpanded])

  const checkForNodeUniformity = (pathOne, pathTwo) => {
    // if the lengths of the paths are different, they cannot have the same nodes
    if(pathOne.length !== pathTwo.length)
      return false;

    let nodesMatch = true;

    for(const [i, path] of pathOne.entries()) {
      // if we're at an odd index, it's a predicate, so skip it
      if(i % 2 !== 0)
        continue;

      // if the names of the nodes don't match, set nodesMatch to false
      if(path.name !== pathTwo[i].name)
        nodesMatch = false;
    }
    return nodesMatch;
  }

  const generateCompressedPaths = useCallback((graph) => {
    let newCompressedPaths = new Set();
    let pathToDisplay = null
    for(const [i, path] of graph.entries()) {
      if(pathToDisplay === null)
        pathToDisplay = cloneDeep(path);
      let displayPath = false;
      let nextPath = (graph[i+1] !== undefined) ? graph[i+1] : null;
      let nodesEqual = (nextPath) ? checkForNodeUniformity(pathToDisplay, nextPath) : false;
      // if all nodes are equal
      // compare predicates, combine them where different
      // display final 'version' of path

      // if theres another path after the current one, and the nodes of each are equal
      if(nextPath && nodesEqual) {
        // loop through the current path's items
        for(const [i] of path.entries()) {
          if(displayPath) {
            break;
          }
          // if we're at an even index, it's a node, so skip it
          if(i % 2 === 0)
            continue;

          if(!nextPath[i])
            continue;

          // loop through nextPath's item's predicates
          for(const predicate of nextPath[i].predicates) {
            // if the next path item to be displayed doesn't have the predicate,
            if(!pathToDisplay[i].predicates.includes(predicate)) {
              // add it
              pathToDisplay[i].predicates.push(predicate);
              pathToDisplay[i].edges.push(nextPath[i].edges[0]);
            }
          }
        }
      }
      // if there's no nextPath or the nodes are different, display the path
      if(!nextPath || !nodesEqual) {
        displayPath = true;
      }

      if(displayPath) {
        newCompressedPaths.add(pathToDisplay);
        pathToDisplay = null;
      }
    }

    return newCompressedPaths;
  }, []);

  useEffect(() => {
    setIsExpanded(false);
    let newPaths = new Set();
    item.paths.forEach((path) => {
      let pathToAdd = [];
      if(path.subgraph) {
        path.subgraph.forEach((item, i)=> {
          if(!item)
            return;
          if(i % 2 === 0) {
            let name = (item.names) ? item.names[0]: '';
            let type = (item.types) ? item.types[0]: '';
            let desc = (item.description) ? item.description[0]: '';
            let category = (i === path.subgraph.length - 1) ? 'target' : 'object';
            pathToAdd[i] = {
              category: category,
              name: name,
              type: type,
              description: desc,
              curies: item.curies
            }
          } else {
            let pred = (item.predicate) ? formatBiolinkEntity(item.predicate) : '';
            pathToAdd[i] = {
              category: 'predicate',
              predicates: [pred],
              edges: [{object: item.object, predicate: pred, subject: item.subject, provenance: item.provenance}]
            }
          }
          if(item.provenance !== undefined) {
            pathToAdd[i].provenance = item.provenance;
          }
        })
        newPaths.add({highlighted: false, path: pathToAdd});
      }
    })
    setFormattedPaths(generateCompressedPaths(newPaths));
  }, [item, generateCompressedPaths]);

  const handleClearSelectedPaths = useCallback(() => {
    setSelectedPaths(new Set())
  },[]);

  const handleNodeClick = useCallback((selectedPaths) => {
    if(!selectedPaths) 
      return;

    let newSelectedPaths = new Set();

    for(const path of formattedPaths) {
      if(path.path.length === 3) {
        newSelectedPaths.add(path);
      }
    }

    for(const selPath of selectedPaths) {
      for(const path of formattedPaths) {
        let currentNodeIndex = 0;
        let numMatches = 0;
        for(const [i, el] of path.path.entries()) {
          if(i % 2 !== 0)
            continue;

          if(selPath[currentNodeIndex] && el.curies.includes(selPath[currentNodeIndex])) {
            numMatches++;
          }
          currentNodeIndex++;
        }
        if(numMatches === selPath.length) {
          // console.log('potential match', selPath, path);
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
            activateEvidence(item.evidence, false);
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
          />
        </Suspense>
        <PathView
          paths={formattedPaths}
          selectedPaths={selectedPaths}
          active={isExpanded}
          handleEdgeSpecificEvidence={(edge)=> {handleEdgeSpecificEvidence(edge)}}
          activeStringFilters={activeStringFilters}
        />
      </AnimateHeight>

    </div>
  );
}

export default ResultsItem;
