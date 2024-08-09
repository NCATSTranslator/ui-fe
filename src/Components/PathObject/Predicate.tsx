import { useState, FC, MouseEvent } from 'react';
import styles from './Predicate.module.scss';
import ResearchSingle from '../../Icons/Queries/Evidence.svg?react';
import ResearchMultiple from '../../Icons/Queries/Evidence.svg?react';
import Robot from '../../Icons/DEP/robot-purple.png';
import RobotSelected from '../../Icons/DEP/robot-darkpurple.png';
import Badge from '../../Icons/DEP/badge-purple.png';
import BadgeSelected from '../../Icons/DEP/badge-darkpurple.png';
import Connector from '../../Icons/DEP/straight.svg?react';
import ConnectorTop from '../../Icons/DEP/solid-top.svg?react';
import ConnectorBottom from '../../Icons/DEP/solid-bottom.svg?react';
import ConnectorDotted from '../../Icons/DEP/straight-dotted.svg?react';
import ConnectorDottedTop from '../../Icons/DEP/dotted-top.svg?react';
import ConnectorDottedBottom from '../../Icons/DEP/dotted-bottom.svg?react';
import ExternalLink from '../../Icons/Buttons/External Link.svg?react';
import Up from '../../Icons/Directional/Chevron/Chevron Up.svg?react';
import Highlighter from 'react-highlight-words';
import { capitalizeAllWords, formatBiolinkEntity } from '../../Utilities/utilities';
import Tooltip from '../Tooltip/Tooltip';
import SupportPathGroup from '../SupportPathGroup/SupportPathGroup';
import { SupportDataObject, FormattedEdgeObject, PathObjectContainer } from '../../Types/results';
import { isFormattedEdgeObject } from '../../Utilities/utilities';

interface PredicateProps {
  pathObject: FormattedEdgeObject;
  pathObjectContainer: PathObjectContainer;
  selected?: boolean;
  activeStringFilters: string[];
  uid: string;
  parentClass?: string;
  handleEdgeClick: (edge: FormattedEdgeObject, path: PathObjectContainer) => void;
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

  pathObject.predicate = (pathObject.predicates) 
    ? (typeof pathObject.predicates[0] == "string")
      ? formatBiolinkEntity(pathObject.predicates[0]) 
      : formatBiolinkEntity(pathObject.predicates[0].predicate) 
    : ""; 
  const pubCount = (Array.isArray(pathObject.publications)) ? pathObject.publications.length : 0;
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
        onClick={(e)=> {e.stopPropagation(); handleEdgeClick(pathObject, pathObjectContainer);}}
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
            (pubCount >= 1 && pathObject.provenance?.length > 0)
            ? <ResearchMultiple />
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
                          if(i > 0) {
                            handleEdgeClick(pathObject.compressedEdges[i-1], pathObjectContainer);
                          } else {
                            handleEdgeClick(pathObject, pathObjectContainer);
                          }
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