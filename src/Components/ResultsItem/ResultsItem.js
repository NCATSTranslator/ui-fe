import React, { useState, useEffect } from 'react';
import styles from './ResultsItem.module.scss';
import { getIcon, capitalizeAllWords } from '../../Utilities/utilities';
import Checkbox from "../FormFields/Checkbox";
import GraphView from '../GraphView/GraphView';
import {ReactComponent as CheckIcon } from "../../Icons/Buttons/Circle Checkmark.svg"
import {ReactComponent as ChevDown } from "../../Icons/Directional/Property 1=Down.svg"
import AnimateHeight from "react-animate-height";
import Tooltip from '../Tooltip/Tooltip';

const ResultsItem = ({key, item, allSelected, handleSelected, activateEvidence, checked, highlighted}) => {
  
  let icon = getIcon(item.type);

  let evidenceCount = item.evidence.length;
    
  let fdaInfo = item.fdaInfo;
  
  checked = (allSelected || checked) ? true : false;

  let pathString = (item.paths.length > 1) ? 'Paths that treat' : 'Path that treats';
  let nameString = (item.name !== null) ? item.name : '';
  let objectString = (item.object !== null) ? capitalizeAllWords(item.object) : '';

  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(0);
  const [fdaTooltipActive, setFdaTooltipActive] = useState(false);

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

  useEffect(() => {
    setIsExpanded(false);
  }, [item]);

  return (
    <div key={key} className={`${styles.result} ${highlighted ? styles.highlighted : ''} result`} >
      <div className={`${styles.checkboxContainer} ${styles.resultSub}`}>
        <Checkbox checked={checked} handleClick={(e)=>{e.stopPropagation(); handleSelected(item)}}/>
      </div>
      <div className={`${styles.nameContainer} ${styles.resultSub}`} onClick={handleToggle}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.name}>{nameString}</span>
        <span className={styles.effect}>{item.paths.length} {pathString} {objectString}</span>
      </div>
      <div className={`${styles.fdaContainer} ${styles.resultSub}`}>
        { fdaInfo &&
          <span className={`${styles.fdaIcon} fda-icon`} onMouseEnter={()=>setFdaTooltipActive(true)} onMouseLeave={()=>setFdaTooltipActive(false)}>
            <CheckIcon />
            <Tooltip 
              delay={350}
              active={fdaTooltipActive} 
              onClose={() => setFdaTooltipActive(false)}
              text='Check marks in this column indicate drugs that have been approved by the FDA for the use of treating a specific disease or condition. This does not mean that the FDA has approved these drugs to treat the disease(s) you specified in your search.'
              >
            </Tooltip>
          </span>
        }
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
      <button className={`${styles.accordionButton} ${isExpanded ? styles.open : styles.closed }`} onClick={handleToggle}>
        <ChevDown/>
      </button>
      <AnimateHeight 
        className={`${styles.accordionPanel} ${isExpanded ? styles.open : styles.closed } ${item.description ? styles.hasDescription : styles.noDescription }`}
        duration={500}
        height={height}
        > 
        <div className={styles.container}>
          <p>{item.description}</p>
        </div>

        <GraphView paths={item.paths} active={isExpanded} handleEdgeSpecificEvidence={(edge)=> {handleEdgeSpecificEvidence(edge)}} />
      </AnimateHeight>

    </div>
  );
}

export default ResultsItem;