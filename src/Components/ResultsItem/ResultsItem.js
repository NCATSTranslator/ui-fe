import React, { useState, useEffect } from 'react';
import styles from './ResultsItem.module.scss';
import { getIcon, capitalizeFirstLetter, getLastPubYear, capitalizeAllWords } from '../../Utilities/utilities';
import Checkbox from "../FormFields/Checkbox";
import GraphView from '../GraphView/GraphView';
import {ReactComponent as CheckIcon } from "../../Icons/Buttons/Circle Checkmark.svg"
import {ReactComponent as ChevDown } from "../../Icons/Directional/Property 1=Down.svg"
import AnimateHeight from "react-animate-height";

const ResultsItem = ({key, item, allSelected, handleSelected, activateEvidence, checked, highlighted}) => {

  // let icon = getIcon(item.type);
  let icon = getIcon('chemical');

  let evidenceCount = 
    (
      item.edge !== undefined &&
      item.edge.evidence !== undefined 
    ) 
    ? item.edge.evidence.length
    : 0;
    
  // let fdaLevel = (item.subject.fda_info ) 
  //   ? item.subject.fda_info.max_level 
  //   : 'N/A';
    let fdaLevel =  'N/A';
  // let lastPubYear = getLastPubYear(item.edge.last_publication_date);

  // let predicate = (item.edge.predicate)
  //   ? item.edge.predicate.replace("biolink:", '') + ' ' + staticNode.names[0]
  //   : '';
    let predicate = '';
  
  checked = (allSelected || checked) ? true : false;

  let pathString = (item.paths.length > 1) ? 'Paths that treat' : 'Path that treats';
  let nameString = (item.name !== null) ? item.name : '';
  let objectString = (item.object !== null) ? capitalizeAllWords(item.object.toLowerCase()) : '';

  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(0);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  }

  useEffect(() => {
    if(isExpanded === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [isExpanded])

  return (
    <div key={key} className={`${styles.result} ${highlighted ? styles.highlighted : ''} result`}>
      <div className={`${styles.checkboxContainer} ${styles.resultSub}`}>
        <Checkbox checked={checked} handleClick={()=>handleSelected(item)}/>
      </div>
      <div className={`${styles.nameContainer} ${styles.resultSub}`}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.name}>{nameString}</span>
        <span className={styles.effect}>{item.paths.length} {pathString} {objectString}</span>
      </div>
      <div className={`${styles.fdaContainer} ${styles.resultSub}`}>
        { fdaLevel !== 'N/A' &&
          <span className={styles.fdaIcon}><CheckIcon /></span>
        }
      </div>
      <div className={`${styles.evidenceContainer} ${styles.resultSub}`}>
        <span className={styles.evidenceLink} onClick={()=>{activateEvidence(item.edge.evidence)}}>
          <span className={styles.viewAll}>View All</span> ({evidenceCount})
        </span>
      </div>
      <button className={`${styles.accordionButton} ${isExpanded ? styles.open : styles.closed }`} onClick={handleToggle}>
        <ChevDown/>
      </button>
      <AnimateHeight className={`${styles.accordionPanel} ${isExpanded ? styles.open : styles.closed }`}
          duration={250}
          height={height}
        > 
        <div className={styles.container}>
          <p>{item.description}</p>
        </div>

        <GraphView paths={item.paths} active={isExpanded} />
      </AnimateHeight>

    </div>
  );
}

export default ResultsItem;