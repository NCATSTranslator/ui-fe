import React, { useState, useEffect, useCallback } from 'react';
import styles from './ResultsItem.module.scss';
import { getIcon, capitalizeAllWords } from '../../Utilities/utilities';
import GraphView from '../GraphView/GraphView';
import {ReactComponent as ChevDown } from "../../Icons/Directional/Property 1 Down.svg"
import AnimateHeight from "react-animate-height";
import Highlighter from 'react-highlight-words';
import { formatBiolinkPredicate } from '../../Utilities/utilities';
import { cloneDeep } from 'lodash';

const ResultsItem = ({key, item, type, activateEvidence, activeStringFilters}) => {
  
  let icon = getIcon(item.type);

  let evidenceCount = item.evidence.length;
  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(0);
  const [formattedPaths, setFormattedPaths] = useState([]);

  let pathString = (formattedPaths.length > 1) ? `Paths that ${type.pathString}` : `Path that ${type.pathString}`;
  let nameString = (item.name !== null) ? item.name : '';
  let objectString = (item.object !== null) ? capitalizeAllWords(item.object) : '';

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  }

  // Filter out any evidence that doesn't correspond with the provided edges
  const handleEdgeSpecificEvidence = (edge) => {
    let filteredEvidence = [];
    let edgesRepresented = [];
    for(const evidenceItem of item.evidence) {
      for(const edgeItem of edge.edges) {
        if(!edgesRepresented.includes(`${edgeItem.subject.names[0].toLowerCase()} ${edgeItem.predicate.toLowerCase()} ${edgeItem.object.names[0].toLowerCase()}`))
          edgesRepresented.push(
            `${edgeItem.subject.names[0].toLowerCase()} ${edgeItem.predicate.toLowerCase()} ${edgeItem.object.names[0].toLowerCase()}` 
          );
        if(
            evidenceItem.edge.subject.toLowerCase() === edgeItem.subject.names[0].toLowerCase() && 
            evidenceItem.edge.object.toLowerCase() === edgeItem.object.names[0].toLowerCase() && 
            evidenceItem.edge.predicate.toLowerCase() === edgeItem.predicate.toLowerCase()
          ) {
            filteredEvidence.push(evidenceItem);
          }
      }
    }
    // call activateEvidence with the filtered evidence
    activateEvidence(filteredEvidence, edgesRepresented);
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
    let newCompressedPaths = [];
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
        newCompressedPaths.push(pathToDisplay);
        pathToDisplay = null;
      } 
    }

    return newCompressedPaths;
  }, []);

  useEffect(() => {
    setIsExpanded(false);
    let newPaths = [];
    item.paths.forEach((path) => {
      let pathToAdd = []
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
          }
        } else {
          let pred = (item.predicate) ? formatBiolinkPredicate(item.predicate) : '';
          pathToAdd[i] = {
            category: 'predicate',
            predicates: [pred],
            edges: [{object: item.object, predicate: pred, subject: item.subject}]
          }
        }
      })
      newPaths.push(pathToAdd);
    }) 
    setFormattedPaths(generateCompressedPaths(newPaths));
  }, [item, generateCompressedPaths]);

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

        <GraphView 
          paths={formattedPaths} 
          active={isExpanded} 
          handleEdgeSpecificEvidence={(edge)=> {handleEdgeSpecificEvidence(edge)}} 
          activeStringFilters={activeStringFilters}
        />
      </AnimateHeight>

    </div>
  );
}

export default ResultsItem;
