import styles from './GraphPath.module.scss';
import React, {useState} from "react";
import Tooltip from '../Tooltip/Tooltip';
import { getIcon } from '../../Utilities/utilities';
import {ReactComponent as Disease} from '../../Icons/disease2.svg';
import {ReactComponent as Connector} from '../../Icons/connector-os.svg';
import OutsideClickHandler from '../OutsideClickHandler/OutsideClickHandler';
import { capitalizeAllWords, formatBiolinkPredicate } from '../../Utilities/utilities';
import { cloneDeep, debounce, filter } from 'lodash';


const GraphPath = ({path, handleNameClick, handleEdgeClick, handleTargetClick}) => {

  const [nameTooltipActive, setNameTooltipActive] = useState(false);
  const [pathTooltipActive, setPathTooltipActive] = useState(false);
  const [targetTooltipActive, setTargetTooltipActive] = useState(false);

  const handleOnMouseEnter = debounce((type) => {
    tooltipOpen(type)
  }, 250)

  const handleOnMouseLeave = (type) => {
    tooltipClose(type)
    handleOnMouseEnter.cancel()
  }

  let nameString;
  let typeString;
  if(path.category !== 'predicate') {
    nameString = capitalizeAllWords(path.name);
    typeString = formatBiolinkPredicate(path.type)
  }

  const tooltipOpen = (type) => {
    switch (type) {
      case 'name':
        setNameTooltipActive(true);
        break;
      case 'path':
        setPathTooltipActive(true);
        break;   
      case 'target':
        setTargetTooltipActive(true);
        break; 
      default:
        break;
    }
  }

  const tooltipClose = (type = 'all') => {
    switch (type) {
      case 'name':
        if(nameTooltipActive)
          setNameTooltipActive(false)
        break;
      case 'path':
        if(pathTooltipActive)
          setPathTooltipActive(false)
        break;   
      case 'target':
        if(targetTooltipActive)
          setTargetTooltipActive(false)
        break; 
      default:
        setPathTooltipActive(false)
        setNameTooltipActive(false)
        setTargetTooltipActive(false)
        break;
    }
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
          onMouseEnter={()=>handleOnMouseEnter('name')}
          onMouseLeave={()=>handleOnMouseLeave('name')}
          onClick={(e)=> {e.stopPropagation(); handleNameClick(path);}}
          >
          <span className={styles.name} >
            {getIcon(path.type)}
            <span className={styles.text}>
              {nameString}
            </span>
          </span>
            <Tooltip 
              active={nameTooltipActive} 
              onClose={() => tooltipClose('name')}
              heading={<span><strong>{nameString}</strong> ({typeString})</span>}
              text={path.description}
              >
            </Tooltip>
        </span>
      }
      {
        path.category === 'predicate' &&
        <span 
          className={styles.pathContainer} 
          onMouseEnter={()=>handleOnMouseEnter('path')}
          onMouseLeave={()=>handleOnMouseLeave('path')}
          onClick={(e)=> {e.stopPropagation(); handleEdgeClick(path);}}
          >
          <Connector />
          <span className={`${styles.path} path`}>
            {path.predicates[0]}
            {path.predicates.length > 1 && 
            <span className={styles.more}>+ {path.predicates.length - 1} More</span>}
          </span>
          <Tooltip 
            active={pathTooltipActive} 
            onClose={() => tooltipClose('path')}
            text=''
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
                        {capitalizeAllWords(predicate)}
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
                    {capitalizeAllWords(predicate)}
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
          onMouseEnter={()=>handleOnMouseEnter('target')}
          onMouseLeave={()=>handleOnMouseLeave('target')}
          onClick={(e)=> {e.stopPropagation(); handleTargetClick(path);}}
          >
          <span className={styles.target} onClick={(e) => {e.stopPropagation(); tooltipOpen('target')}}>
            <Disease/>
            <span className={styles.text}>
              {nameString}
            </span>
          </span>
          <Tooltip 
            active={targetTooltipActive} 
            onClose={() => tooltipClose('target')}
            onClick={(e)=> e.stopPropagation()}
            heading={<span><strong>{nameString}</strong> ({typeString})</span>}
            text={path.description}
            >
          </Tooltip>
        </span>
      }    
    </>
  )
}

export default GraphPath;