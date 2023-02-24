import styles from './GraphPath.module.scss';
import React, {useState} from "react";
import Tooltip from '../Tooltip/Tooltip';
import { getIcon } from '../../Utilities/utilities';
import {ReactComponent as Disease} from '../../Icons/disease2.svg';
import {ReactComponent as Connector} from '../../Icons/connector-os.svg';
import { capitalizeAllWords, formatBiolinkPredicate } from '../../Utilities/utilities';
import { cloneDeep } from 'lodash';
import Highlighter from 'react-highlight-words';

const GraphPath = ({path, handleNameClick, handleEdgeClick, handleTargetClick, activeStringFilters}) => {

  let nameString;
  let typeString;
  if(path.category !== 'predicate') {
    nameString = capitalizeAllWords(path.name);
    typeString = formatBiolinkPredicate(path.type)
  }

  // filter path by a provided predicate, then call handleEdgeClick with the filtered path object
  const predicateSpecificEdgeClick = (path, predicate) => {

    let filteredPath = cloneDeep(path);
    for(const edge of path.edges) {
      if(edge.predicate === predicate) {
        // filter out the non-matching edges and predicates
        filteredPath.edges = filteredPath.edges.filter(edge => edge.predicate === predicate);
        filteredPath.predicates = filteredPath.predicates.filter(pred => pred === predicate);
      }
    }
    // call the edge click handler with the newly filtered path
    handleEdgeClick(filteredPath);
  }

  return (
    <>
      {
        path.category === 'object' &&
        <span className={styles.nameContainer} 
          onClick={(e)=> {e.stopPropagation(); handleNameClick(path);}}
          data-tooltip-id={nameString}
          >
          <span className={styles.name} >
            {getIcon(path.type)}
            <span className={styles.text}>
              <Highlighter
                highlightClassName="highlight"
                searchWords={activeStringFilters}
                autoEscape={true}
                textToHighlight={nameString}
              />
            </span>
          </span>
            <Tooltip id={nameString}>
              <span><strong>{nameString}</strong> ({typeString})</span>
              {path.description}
            </Tooltip>
        </span>
      }
      {
        path.category === 'predicate' &&
        <span 
          className={styles.pathContainer} 
          data-tooltip-id={path.predicates[0]}
          onClick={(e)=> {e.stopPropagation(); handleEdgeClick(path);}}
          >
          <Connector />
          <span className={`${styles.path} path`}>
            <Highlighter
              highlightClassName="highlight"
              searchWords={activeStringFilters}
              autoEscape={true}
              textToHighlight={path.predicates[0]}
            />
            {path.predicates.length > 1 && 
            <span className={styles.more}>
              + {path.predicates.length - 1} More
            </span>}
          </span>
          <Tooltip 
            id={path.predicates[0]}
            > 
            {
              path.predicates.length > 1 &&
              <ul className={styles.predicatesList}>{
                path.predicates.map((predicate, i)=> {

                  return (
                    <li>
                      <p 
                        key={i} 
                        className={styles.predicate} 
                        // Predicate click to get specific evidence will go here 
                        onClick={(e)=> {e.stopPropagation(); predicateSpecificEdgeClick(path, predicate)}}
                        >
                        <Highlighter
                          highlightClassName="highlight"
                          searchWords={activeStringFilters}
                          autoEscape={true}
                          textToHighlight={capitalizeAllWords(predicate)}
                        />
                      </p>
                    </li>
                  )
                })}
              </ul>
            }
            {
              path.predicates.length <= 1 &&
              path.predicates.map((predicate, i)=> {
                return (
                  <p 
                    key={i} 
                    className={styles.predicate} 
                    // Predicate click to get specific evidence will go here 
                    onClick={(e)=> {e.stopPropagation(); predicateSpecificEdgeClick(path, predicate)}}
                    >
                    <Highlighter
                      highlightClassName="highlight"
                      searchWords={activeStringFilters}
                      autoEscape={true}
                      textToHighlight={capitalizeAllWords(predicate)}
                    />
                  </p>
                )
              })
            }
          </Tooltip>
        </span>
      }
      {
        path.category === 'target' && 
        <span 
          className={styles.targetContainer} 
          data-tooltip-id={nameString}
          onClick={(e)=> {e.stopPropagation(); handleTargetClick(path);}}
          >
          <span className={styles.target} >
            <Disease/>
            <span className={styles.text}>
              <Highlighter
                highlightClassName="highlight"
                searchWords={activeStringFilters}
                autoEscape={true}
                textToHighlight={nameString}
              />
            </span>
          </span>
          <Tooltip id={nameString}>
            <span><strong>{nameString}</strong> ({typeString})</span>
            {path.description}
          </Tooltip>
        </span>
      }    
    </>
  )
}

export default GraphPath;