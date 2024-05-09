import { useState, FC, MouseEvent } from 'react';
import styles from './Predicate.module.scss';
import ResearchSingle from '../../Icons/research-single.svg?react';
import ResearchMultiple from '../../Icons/research-multiple.svg?react';
import Robot from '../../Icons/robot-purple.png';
import RobotSelected from '../../Icons/robot-darkpurple.png';
import Badge from '../../Icons/badge-purple.png';
import BadgeSelected from '../../Icons/badge-darkpurple.png';
import Connector from '../../Icons/straight.svg?react';
import ConnectorTop from '../../Icons/solid-top.svg?react';
import ConnectorBottom from '../../Icons/solid-bottom.svg?react';
import ConnectorDotted from '../../Icons/straight-dotted.svg?react';
import ConnectorDottedTop from '../../Icons/dotted-top.svg?react';
import ConnectorDottedBottom from '../../Icons/dotted-bottom.svg?react';
import ExternalLink from '../../Icons/external-link.svg?react';
// import Notes from "../../Icons/note.svg?react"
import Up from '../../Icons/Directional/Property 1=Up.svg?react';
import Highlighter from 'react-highlight-words';
import { capitalizeAllWords, formatBiolinkEntity } from '../../Utilities/utilities';
import Tooltip from '../Tooltip/Tooltip';
import SupportPathGroup from '../SupportPathGroup/SupportPathGroup';
import { cloneDeep } from 'lodash';
import { SupportDataObject, FormattedEdgeObject, PathObjectContainer } from '../../Types/results';
import { isFormattedEdgeObject } from '../../Utilities/utilities';

interface PredicateProps {
  pathObject: FormattedEdgeObject;
  pathObjectContainer: PathObjectContainer;
  selected?: boolean;
  activeStringFilters: string[];
  uid: string;
  parentClass?: string;
  handleEdgeClick: (edge: FormattedEdgeObject[], path: PathObjectContainer) => void;
  hasSupport: boolean;
  supportDataObject: SupportDataObject | null;
  inModal?: boolean | null;
  isTop?: boolean | null;
  isBottom?: boolean | null;
  className?: string;
}

const Predicate: FC<PredicateProps> = ({ pathObject, pathObjectContainer, selected = false, activeStringFilters, uid, parentClass = '', handleEdgeClick, 
   hasSupport, supportDataObject = null, inModal = false, isTop = null, isBottom = null, className = "" }) => {

  const checkForProvenanceType = (pathObject: FormattedEdgeObject, type: string) => {
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

  pathObject.predicate = (pathObject.predicates) ? formatBiolinkEntity(pathObject.predicates[0].predicate) : ""; 
  const pubCount = Object.values(pathObject.publications).reduce((sum, arr) => sum + arr.length, 0);
  const [isSupportExpanded, setIsSupportExpanded] = useState(true);
  const isMachineLearned = checkForProvenanceType(pathObject, "ml");
  const isTrusted = checkForProvenanceType(pathObject, "trusted");

  const handleSupportExpansion = (e: MouseEvent<HTMLButtonElement>) => {
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
        <span>This relationship was generated using information found in a database that includes human curation. Click on the relationship and view its knowledge sources to learn more.</span>
      </Tooltip> 
      <span 
        className={`${selected ? styles.selected : ''} ${parentClass} ${className} ${isMachineLearned ? styles.ml : ''} ${isTrusted ? styles.trusted : ''}`} 
        onClick={(e)=> {e.stopPropagation(); handleEdgeClick([pathObject], pathObjectContainer);}}
        >
          {
            hasSupport && isTop &&
            <ConnectorDottedTop className={`connector ${styles.connector}`}/>
          }
          {
            hasSupport && isBottom &&
            <ConnectorDottedBottom className={`connector ${styles.connector}`}/>
          }
          {
            hasSupport && !isBottom && !isTop && 
            <ConnectorDotted className={`connector ${styles.connector}`}/>
          }
          {
            !hasSupport && isTop &&
            <ConnectorTop className={`connector ${styles.connector}`}/>
          }
          {
            !hasSupport && isBottom &&
            <ConnectorBottom className={`connector ${styles.connector}`}/>
          }
          {
            !hasSupport && !isBottom && !isTop && 
            <Connector className={`connector ${styles.connector}`}/>
          }
        <span 
          className={`${styles.path} path ${(pathObject.predicates && pathObject.predicates.length > 1) ? styles.hasMore : ''}`}
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
              pathObject.predicates &&
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
                    let formattedPredicate = (predicate?.predicate) ? predicate.predicate : "No Predicate Available";
                    return (
                      <p 
                        key={`${formattedPredicate}${uid}${i}`} 
                        className={`${styles.tooltipPredicate} ${inModal ? styles.inModal : ''}`} 
                        onClick={(e)=> {
                          e.stopPropagation(); 
                          const newPathObject = cloneDeep(pathObject);
                          newPathObject.predicate = formattedPredicate;
                          handleEdgeClick([newPathObject], pathObjectContainer);
                        }}
                        >
                        <Highlighter
                          highlightClassName="highlight"
                          searchWords={activeStringFilters}
                          autoEscape={true}
                          textToHighlight={capitalizeAllWords(formattedPredicate)}
                        />
                        {
                          predicate?.url &&
                          <a 
                            href={predicate.url} 
                            onClick={(e)=> {
                              e.stopPropagation(); 
                            }} 
                            target="_blank" 
                            rel='noreferrer'>
                              <ExternalLink/>
                          </a>
                        }
                      </p>
                    )
                  })
                }
              </div>
            }
          </Tooltip>
        }
        {
          hasSupport && isFormattedEdgeObject(supportDataObject?.pathItem) && supportDataObject?.pathItem?.support &&
          <button 
            onClick={handleSupportExpansion} 
            className={`support-button ${styles.supportExpansionButton} ${isSupportExpanded ? styles.expanded : ''}`}>
            <div className={styles.supportConnector}></div>
            <span className={styles.supportButtonIcon}>
              <Up/>
            </span>
          </button>
        }
      </span>
      {
        hasSupport && supportDataObject && isFormattedEdgeObject(supportDataObject?.pathItem) && supportDataObject?.pathItem?.support &&
        <SupportPathGroup 
          dataObj={supportDataObject} 
          isExpanded={isSupportExpanded}
        />
      }
    </>
  )
}

export default Predicate;