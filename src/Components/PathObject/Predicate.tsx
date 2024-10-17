import { useState, FC, MouseEvent } from 'react';
import styles from './Predicate.module.scss';
import ResearchMultiple from '../../Icons/Queries/Evidence.svg?react';
import Robot from '../../Icons/DEP/robot-purple.png';
import RobotSelected from '../../Icons/DEP/robot-darkpurple.png';
import Badge from '../../Icons/DEP/badge-purple.png';
import BadgeSelected from '../../Icons/DEP/badge-darkpurple.png';
import ConnectorStart from '../../Icons/Connectors/direct-line-start.svg?react';
import ConnectorEnd from '../../Icons/Connectors/direct-line-end.svg?react';
import ConnectorDottedStart from '../../Icons/Connectors/inferred-line-start.svg?react';
import ConnectorDottedEnd from '../../Icons/Connectors/inferred-line-end.svg?react';
import ExternalLink from '../../Icons/Buttons/External Link.svg?react';
import Up from '../../Icons/Directional/Chevron/Chevron Up.svg?react';
import Highlighter from 'react-highlight-words';
import { capitalizeAllWords, formatBiolinkEntity } from '../../Utilities/utilities';
import Tooltip from '../Tooltip/Tooltip';
import SupportPathGroup from '../SupportPathGroup/SupportPathGroup';
import { SupportDataObject, FormattedEdgeObject, PathObjectContainer, PathFilterState } from '../../Types/results';
import { isFormattedEdgeObject } from '../../Utilities/utilities';

interface PredicateProps {
  pathObject: FormattedEdgeObject;
  pathObjectContainer: PathObjectContainer;
  selected?: boolean;
  activeEntityFilters: string[];
  uid: string;
  parentClass?: string;
  handleEdgeClick: (edge: FormattedEdgeObject, path: PathObjectContainer) => void;
  hasSupport: boolean;
  supportDataObject: SupportDataObject | null;
  inModal?: boolean | null;
  className?: string;
  pathFilterState: PathFilterState;
  pathViewStyles?: {[key: string]: string;} | null;
}

const Predicate: FC<PredicateProps> = ({ pathObject, pathObjectContainer, selected = false, activeEntityFilters, uid, parentClass = '', handleEdgeClick, pathFilterState,
   hasSupport, supportDataObject = null, inModal = false, className = "", pathViewStyles = null }) => {

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
  const hasMore = (pathObject.predicates && pathObject.predicates.length > 1);

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
                      searchWords={activeEntityFilters}
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
      <span
        className={`${selected ? styles.selected : ''} ${parentClass} ${className} ${isMachineLearned ? styles.ml : ''} ${isTrusted ? styles.trusted : ''} ${!!pathViewStyles && pathViewStyles.predicateInterior}`}
        onClick={(e)=> {e.stopPropagation(); handleEdgeClick(pathObject, pathObjectContainer);}}
        >
          {
            hasSupport 
              ?
                <>
                  <ConnectorDottedStart className={`connector ${styles.connector} ${styles.start}`}/>
                  <ConnectorDottedEnd className={`connector ${styles.connector} ${styles.end}`}/>
                </>
              :
                <>
                  <ConnectorStart className={`connector ${styles.connector} ${styles.start}`}/> 
                  <ConnectorEnd className={`connector ${styles.connector} ${styles.end}`}/>
                </>
          }
        <span
          className={`${styles.path} path ${hasMore ? styles.hasMore : ''}`}
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
          <span data-tooltip-id={`${pathObject.predicate}${uid}`} className={styles.pathLabel}>
            <Highlighter
              highlightClassName="highlight"
              searchWords={activeEntityFilters}
              autoEscape={true}
              textToHighlight={capitalizeAllWords(pathObject.predicate)}
            />
            {
              !!pathObject.predicates &&
              hasMore &&
              <span className={styles.more}>
                + {pathObject.predicates.length - 1} More
              </span>
            }
          </span>
        </span>
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
          pathFilterState={pathFilterState}
        />
      }
    </>
  )
}

export default Predicate;
