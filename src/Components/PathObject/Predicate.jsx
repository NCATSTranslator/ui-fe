import { useState } from 'react';
import styles from './Predicate.module.scss';
import ResearchSingle from '../../Icons/research-single.svg?react';
import ResearchMultiple from '../../Icons/research-multiple.svg?react';
import Robot from '../../Icons/robot-purple.png';
import RobotSelected from '../../Icons/robot-darkpurple.png';
import Badge from '../../Icons/badge-purple.png';
import BadgeSelected from '../../Icons/badge-darkpurple.png';
import Up from '../../Icons/Directional/Property 1=Up.svg?react';
import Highlighter from 'react-highlight-words';
import { capitalizeAllWords, formatBiolinkEntity } from '../../Utilities/utilities';
import Tooltip from '../Tooltip/Tooltip';
import SupportPathGroup from '../SupportPathGroup/SupportPathGroup';
import { cloneDeep } from 'lodash';

const Predicate = ({ pathObject, selected, activeStringFilters, uid, parentClass = '', handleEdgeClick, 
   hasSupport, supportDataObject = null, inModal = false }) => {

  const checkForProvenanceType = (pathObject, type) => {
    if(!pathObject?.provenance || !Array.isArray(pathObject.provenance))
      return false;
    
    if(type === "ml") {
      if(pathObject.provenance.some(item => item.knowledge_level === "ml"))
        return true;
    }
    if(type === "trusted") {
      if(pathObject.provenance.some(item => item.knowledge_level === "trusted"))
        return true;
    }

    return false;
  }

  pathObject.predicate = formatBiolinkEntity(pathObject.predicates[0]); 
  const pubCount = Object.values(pathObject.publications).reduce((sum, arr) => sum + arr.length, 0);
  const [isSupportExpanded, setIsSupportExpanded] = useState(true);
  const isMachineLearned = checkForProvenanceType(pathObject, "ml");
  const isTrusted = checkForProvenanceType(pathObject, "trusted");

  const handleSupportExpansion = (e) => {
    e.stopPropagation();
    setIsSupportExpanded(prev=>!prev);
  }

  return (
    <>
      <Tooltip 
        id={`${pathObject.predicate}${uid}-ML`}
        place="top"
        className={styles.mlTooltip}
      >
        <span>This relationship was provided by a text-mining algorithm. Click on the relationship and view its knowledge sources to learn more.</span>
      </Tooltip> 
      <Tooltip 
        id={`${pathObject.predicate}${uid}-TR`}
        place="top"
        className={styles.mlTooltip}
      >
        <span>This relationship has been manually curated by a trusted source. Click on the relationship and view its knowledge sources to learn more.</span>
      </Tooltip> 
      <span 
        className={`${selected ? styles.selected : ''} ${parentClass} ${isMachineLearned ? styles.ml : ''} ${isTrusted ? styles.trusted : ''}`} 
        onClick={(e)=> {e.stopPropagation(); handleEdgeClick(pathObject);}}
        >
        <span className={`connector ${styles.connector} ${hasSupport ? styles.inferred : ''}`}></span>
        <span 
          className={`${styles.path} path ${(pathObject.predicates.length > 1) ? styles.hasMore : ''}`}
          >
          <div className={styles.badges}>
            {
              isTrusted
              ? <img src={selected ? BadgeSelected : Badge} alt="" className={styles.robot} data-tooltip-id={`${pathObject.predicate}${uid}-TR`} />
              : null
            }
            {
              isMachineLearned
              ? <img src={selected ? RobotSelected : Robot} alt="" className={styles.robot} data-tooltip-id={`${pathObject.predicate}${uid}-ML`} />
              : null
            }
          </div>
          {
            pubCount > 1
            ? <ResearchMultiple />
            : (pubCount > 0 || pathObject.provenance?.length > 0) 
              ? <ResearchSingle /> 
              : '' 
          }
          <span data-tooltip-id={`${pathObject.predicate}${uid}`}>
            <Highlighter
              highlightClassName="highlight"
              searchWords={activeStringFilters}
              autoEscape={true}
              textToHighlight={capitalizeAllWords(pathObject.predicate)}
            />

            {
              pathObject.predicates.length > 1 && 
              <span className={styles.more}>
                + {pathObject.predicates.length - 1} More
              </span>
            }
          </span>
        </span>
        {
          <Tooltip 
            id={`${pathObject.predicate}${uid}`}
            place={`${inModal ? 'left' : 'top' }`}
            > 
            {
              pathObject.predicates &&
              <div className={styles.predicatesList}>
                {
                  pathObject.predicates.map((predicate, i)=> {
                    return (
                      <p 
                        key={`${predicate}${uid}${i}`} 
                        className={`${styles.tooltipPredicate} ${inModal ? styles.inModal : ''}`} 
                        onClick={(e)=> {
                          e.stopPropagation(); 
                          const newPathObject = cloneDeep(pathObject);
                          newPathObject.predicate = predicate;
                          handleEdgeClick(newPathObject);
                        }}
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
              </div>
            }
          </Tooltip>
        }
        {
          hasSupport && 
          <button 
            onClick={(e)=>{handleSupportExpansion(e);}} 
            className={`${styles.supportExpansionButton} ${isSupportExpanded ? styles.expanded : ''}`}>
            <div className={styles.supportConnector}></div>
            <span className={styles.supportButtonIcon}>
              <Up/>
            </span>
          </button>
        }
      </span>
      {
        hasSupport && 
        <SupportPathGroup 
          dataObj={supportDataObject} 
          isExpanded={isSupportExpanded}
        />
      }
    </>
  )
}

export default Predicate;