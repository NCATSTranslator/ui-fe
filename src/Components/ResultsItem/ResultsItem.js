import React, { useState, useEffect } from 'react';
import styles from './ResultsItem.module.scss';
import { getIcon, capitalizeFirstLetter, getLastPubYear } from '../../Utilities/utilities';
import Checkbox from "../FormFields/Checkbox";
import GraphView from '../GraphView/GraphView';
import {ReactComponent as CheckIcon } from "../../Icons/Buttons/Circle Checkmark.svg"
import {ReactComponent as ChevDown } from "../../Icons/Directional/Property 1=Down.svg"
import AnimateHeight from "react-animate-height";

const ResultsItem = ({key, item, staticNode, allSelected, handleSelected, activateEvidence, checked, highlighted}) => {

  // let icon = getIcon(item.type);
  let icon = getIcon('chemical');

  let evidenceCount = 
    (
      item.edge !== undefined &&
      item.edge.evidence !== undefined 
    ) 
    ? item.edge.evidence.length
    : 0;
    
  let fdaLevel = (item.subject.fda_info ) 
    ? item.subject.fda_info.max_level 
    : 'N/A';
    
  // let lastPubYear = getLastPubYear(item.edge.last_publication_date);

  let predicate = (item.edge.predicate)
    ? item.edge.predicate.replace("biolink:", '') + ' ' + staticNode.names[0]
    : '';
  
  checked = (allSelected || checked) ? true : false;

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
        <span className={styles.name}>{capitalizeFirstLetter(item.subject.name)}</span>
        <span className={styles.effect}>{capitalizeFirstLetter(predicate)}</span>
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
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce non sem vel libero tincidunt consectetur et et turpis. Vestibulum venenatis sagittis libero, eu dapibus nibh consequat id. Fusce pharetra nisi eget velit facilisis molestie. Ut orci neque, pellentesque eu mauris sed, efficitur lacinia libero. Etiam et dolor eget diam mattis tristique sed ut felis. Nunc blandit consequat aliquam. Donec hendrerit faucibus nisi, at molestie nunc pretium lobortis. Sed dapibus tristique ipsum, et vulputate quam tristique ut. Nullam fermentum enim nunc, sed vestibulum ipsum volutpat eget. Proin arcu turpis, mollis in consequat in, congue sed lacus. Aliquam gravida eu leo eu mattis. Ut vehicula felis vel enim sollicitudin dictum. Duis suscipit purus et neque efficitur congue. Donec euismod vulputate arcu, sed venenatis lacus ullamcorper nec.</p>
          <p>Nam ex justo, tincidunt ut metus quis, egestas posuere risus. Maecenas rhoncus purus ac porttitor mollis. Morbi vehicula lorem id lorem commodo consectetur. Phasellus lobortis nibh id massa mollis, condimentum feugiat quam tempor. Etiam condimentum iaculis lorem, eget faucibus nibh ultrices ac. Sed scelerisque sagittis augue, et iaculis velit sagittis sit amet. Sed molestie leo risus, eget lobortis libero tempus sit amet. Vivamus eu egestas quam, non interdum eros. Morbi non vehicula nibh. Curabitur facilisis sit amet sapien quis molestie. Quisque commodo suscipit nunc eu iaculis. </p>
        </div>

        <GraphView />
      </AnimateHeight>

    </div>
  );
}

export default ResultsItem;