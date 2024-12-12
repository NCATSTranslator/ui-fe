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
import { capitalizeAllWords } from '../../Utilities/utilities';
import Tooltip from '../Tooltip/Tooltip';
import SupportPathGroup from '../SupportPathGroup/SupportPathGroup';
import { Filter, Path, PathFilterState, ResultEdge, ResultNode } from '../../Types/results';

interface PredicateProps {
  activeEntityFilters: string[];
  activeFilters: Filter[];
  className?: string;
  handleActivateEvidence: (pathID: string) => void;
  handleEdgeClick: (edgeID: string, pathID: string) => void;
  handleNodeClick: (name: ResultNode) => void;
  edge: ResultEdge;
  edgeID: string;
  inModal?: boolean | null;
  parentClass?: string;
  pathFilterState: PathFilterState;
  pathID: string;
  pathViewStyles?: {[key: string]: string;} | null;
  selected?: boolean;
  selectedPaths: Set<Path> | null;
  uid: string;
}

const Predicate: FC<PredicateProps> = ({ 
  activeEntityFilters, 
  activeFilters,
  className = "", 
  edge, 
  edgeID, 
  handleActivateEvidence, 
  handleEdgeClick, 
  handleNodeClick, 
  inModal = false, 
  parentClass = '', 
  pathFilterState,
  pathID, 
  pathViewStyles = null, 
  selected = false, 
  selectedPaths, 
  uid }) => {

  const checkForProvenanceType = (edge: ResultEdge, type: string) => {
    if(!edge?.provenance || !Array.isArray(edge.provenance))
      return false;

    if(type === "ml") {
      if(edge.provenance.some(item => item.knowledge_level === "ml"))
        return true;
    }
    if(type === "trusted") {
      if(edge.provenance.some(item => item.knowledge_level === "trusted"))
        return true;
    }
    return false;
  }

  const pubCount = (Array.isArray(edge.publications)) ? edge.publications.length : 0;
  const [isSupportExpanded, setIsSupportExpanded] = useState(edge.is_root);
  const isMachineLearned = checkForProvenanceType(edge, "ml");
  const isTrusted = checkForProvenanceType(edge, "trusted");
  // const hasMore = (edge.predicates && edge.predicates.length > 1);
  const hasMore = false;

  const handleSupportExpansion = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsSupportExpanded(prev=>!prev);
  }

  let hasSupport = edge.support.length > 0 ? true : false;

  return (
    <>
      <Tooltip
        id={`${edge.predicate}${uid}-ML`}
        place="top"
        className={styles.mlTooltip}
      >
        <span>This relationship was provided by a text-mining algorithm. Click on the relationship and view its knowledge sources to learn more.</span>
      </Tooltip>
      <Tooltip
        id={`${edge.predicate}${uid}-TR`}
        place="top"
        className={styles.mlTooltip}
      >
        <span>This relationship was generated using information found in a database that includes human curation. Click on the relationship and view its knowledge sources to learn more.</span>
      </Tooltip>
      <Tooltip
        id={`${edge.predicate}${uid}`}
        place={`${inModal ? 'left' : 'top' }`}
        >
        {
          <div className={styles.predicatesList}>
            <p
              className={`${styles.tooltipPredicate} ${inModal ? styles.inModal : ''}`}
              onClick={(e)=> {
                e.stopPropagation();
                handleEdgeClick(edgeID, pathID);
              }}
              >
              <Highlighter
                highlightClassName="highlight"
                searchWords={activeEntityFilters}
                autoEscape={true}
                textToHighlight={capitalizeAllWords(edge.predicate)}
              />
              {
                edge.predicate_url &&
                <a
                  href={edge.predicate_url}
                  onClick={(e)=> {
                    e.stopPropagation();
                  }}
                  target="_blank"
                  rel='noreferrer'>
                    <ExternalLink/>
                </a>
              }
            </p>
            {
              // pathObject.predicates &&
              // pathObject.predicates.map((predicate, i)=> {
              //   let formattedPredicate = (predicate?.predicate) ? predicate.predicate : "No Predicate Available";
              //   return (
              //     <p
              //       key={`${formattedPredicate}${uid}${i}`}
              //       className={`${styles.tooltipPredicate} ${inModal ? styles.inModal : ''}`}
              //       onClick={(e)=> {
              //         e.stopPropagation();
              //         if(i > 0) {
              //           handleEdgeClick(pathObject.compressedEdges[i-1], pathObjectContainer);
              //         } else {
              //           handleEdgeClick(pathObject, pathObjectContainer);
              //         }
              //       }}
              //       >
              //       <Highlighter
              //         highlightClassName="highlight"
              //         searchWords={activeEntityFilters}
              //         autoEscape={true}
              //         textToHighlight={capitalizeAllWords(formattedPredicate)}
              //       />
              //       {
              //         predicate?.url &&
              //         <a
              //           href={predicate.url}
              //           onClick={(e)=> {
              //             e.stopPropagation();
              //           }}
              //           target="_blank"
              //           rel='noreferrer'>
              //             <ExternalLink/>
              //         </a>
              //       }
              //     </p>
              //   )
              // })
            }
          </div>
        }
      </Tooltip>
      <span
        className={`${selected ? styles.selected : ''} ${parentClass} ${className} ${isMachineLearned ? styles.ml : ''} ${isTrusted ? styles.trusted : ''} ${!!pathViewStyles && pathViewStyles.predicateInterior}`}
        onClick={(e)=> {e.stopPropagation(); handleEdgeClick(edgeID, pathID);}}
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
              ? <img src={selected ? BadgeSelected : Badge} alt="" className={styles.robot} data-tooltip-id={`${edge.predicate}${uid}-TR`} />
              : null
            }
            {
              isMachineLearned
              ? <img src={selected ? RobotSelected : Robot} alt="" className={styles.robot} data-tooltip-id={`${edge.predicate}${uid}-ML`} />
              : null
            }
          </div>
          {
            (pubCount >= 1 && edge.provenance?.length > 0)
            ? <ResearchMultiple className={styles.evidenceIcon} />
            : ''
          }
          <span data-tooltip-id={`${edge.predicate}${uid}`} className={styles.pathLabel}>
            <Highlighter
              highlightClassName="highlight"
              searchWords={activeEntityFilters}
              autoEscape={true}
              textToHighlight={capitalizeAllWords(edge.predicate)}
            />
            {
              // !!pathObject.predicates &&
              // hasMore &&
              // <span className={styles.more}>
              //   + {pathObject.predicates.length - 1} More
              // </span>
            }
          </span>
        </span>
        {
          hasSupport && !inModal &&
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
        hasSupport && !inModal &&
        <SupportPathGroup
          pathArray={edge.support}
          isExpanded={isSupportExpanded}
          pathFilterState={pathFilterState}
          pathViewStyles={pathViewStyles}
          handleActivateEvidence={handleActivateEvidence}
          handleEdgeClick={handleEdgeClick}
          handleNodeClick={handleNodeClick}
          selectedPaths={selectedPaths}
          activeEntityFilters={activeEntityFilters}
          activeFilters={activeFilters}
        />
      }
    </>
  )
}

export default Predicate;
