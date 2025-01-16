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
import { capitalizeAllWords, getCompressedEdge } from '../../Utilities/utilities';
import Tooltip from '../Tooltip/Tooltip';
import SupportPathGroup from '../SupportPathGroup/SupportPathGroup';
import { Filter, Path, PathFilterState, ResultEdge, ResultNode } from '../../Types/results';
import { getResultSetById } from '../../Redux/resultsSlice';
import { useSelector } from 'react-redux';

interface PredicateProps {
  activeEntityFilters: string[];
  activeFilters: Filter[];
  className?: string;
  handleActivateEvidence: (path: Path) => void;
  handleEdgeClick: (edgeID: string, path: Path) => void;
  handleNodeClick: (name: ResultNode) => void;
  edge: ResultEdge;
  edgeIDs: string[];
  inModal?: boolean | null;
  parentClass?: string;
  pathFilterState: PathFilterState;
  path: Path;
  pathViewStyles?: {[key: string]: string;} | null;
  pk: string;
  selected?: boolean;
  selectedPaths: Set<Path> | null;
  showHiddenPaths: boolean;
  uid: string;
}

const Predicate: FC<PredicateProps> = ({ 
  activeEntityFilters, 
  activeFilters,
  className = "", 
  edge, 
  edgeIDs, 
  handleActivateEvidence, 
  handleEdgeClick, 
  handleNodeClick, 
  inModal = false, 
  parentClass = '', 
  pathFilterState,
  path, 
  pathViewStyles = null, 
  pk,
  selected = false, 
  selectedPaths,
  showHiddenPaths,
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

  let resultSet = useSelector(getResultSetById(pk));
  const formattedEdge = (!!resultSet && Array.isArray(edgeIDs) && edgeIDs.length > 1) ? getCompressedEdge(resultSet, edgeIDs) : edge;
  const hasMore = (!!formattedEdge?.compressed_edges && formattedEdge.compressed_edges.length > 0);
  const pubCount = (Array.isArray(formattedEdge.publications)) ? formattedEdge.publications.length : 0;
  const [isSupportExpanded, setIsSupportExpanded] = useState(formattedEdge.is_root);
  const isMachineLearned = checkForProvenanceType(formattedEdge, "ml");
  const isTrusted = checkForProvenanceType(formattedEdge, "trusted");

  const handleSupportExpansion = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsSupportExpanded(prev=>!prev);
  }

  let hasSupport = formattedEdge.support.length > 0 ? true : false;

  return (
    <>
      <Tooltip
        id={`${formattedEdge.predicate}${uid}-ML`}
        place="top"
        className={styles.mlTooltip}
      >
        <span>This relationship was provided by a text-mining algorithm. Click on the relationship and view its knowledge sources to learn more.</span>
      </Tooltip>
      <Tooltip
        id={`${formattedEdge.predicate}${uid}-TR`}
        place="top"
        className={styles.mlTooltip}
      >
        <span>This relationship was generated using information found in a database that includes human curation. Click on the relationship and view its knowledge sources to learn more.</span>
      </Tooltip>
      <Tooltip
        id={`${formattedEdge.predicate}${uid}`}
        place={`${inModal ? 'left' : 'top' }`}
        >
        {
          <div className={styles.predicatesList}>
            <p
              className={`${styles.tooltipPredicate} ${inModal ? styles.inModal : ''}`}
              onClick={(e)=> {
                e.stopPropagation();
                handleEdgeClick(edgeIDs[0], path);
              }}
              >
              <Highlighter
                highlightClassName="highlight"
                searchWords={activeEntityFilters}
                autoEscape={true}
                textToHighlight={capitalizeAllWords(formattedEdge.predicate)}
              />
              {
                formattedEdge.predicate_url &&
                <a
                  href={formattedEdge.predicate_url}
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
              !!formattedEdge?.compressed_edges &&
              formattedEdge.compressed_edges.sort((a, b)=> a.predicate.localeCompare(b.predicate)).map((edge) => {
                if(!edge)
                  return null;
                return (
                  <p
                    key={`${edge.predicate}`}
                    className={`${styles.tooltipPredicate} ${inModal ? styles.inModal : ''}`}
                    onClick={(e)=> {
                      e.stopPropagation();
                      handleEdgeClick(edge.id, path);
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
                        href={edge.predicate_url }
                        onClick={(e)=> {
                          e.stopPropagation();
                        }}
                        target="_blank"
                        rel='noreferrer'>
                          <ExternalLink/>
                      </a>
                    }
                  </p>
                );
              })
            }
          </div>
        }
      </Tooltip>
      <span
        className={`${selected ? styles.selected : ''} ${parentClass} ${className} ${isMachineLearned ? styles.ml : ''} ${isTrusted ? styles.trusted : ''} ${!!pathViewStyles && pathViewStyles.predicateInterior}`}
        onClick={(e)=> {e.stopPropagation(); handleEdgeClick(edgeIDs[0], path);}}
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
              ? <img src={selected ? BadgeSelected : Badge} alt="" className={styles.robot} data-tooltip-id={`${formattedEdge.predicate}${uid}-TR`} />
              : null
            }
            {
              isMachineLearned
              ? <img src={selected ? RobotSelected : Robot} alt="" className={styles.robot} data-tooltip-id={`${formattedEdge.predicate}${uid}-ML`} />
              : null
            }
          </div>
          {
            (pubCount >= 1 && formattedEdge.provenance?.length > 0)
            ? <ResearchMultiple className={styles.evidenceIcon} />
            : ''
          }
          <span data-tooltip-id={`${formattedEdge.predicate}${uid}`} className={styles.pathLabel}>
            <Highlighter
              highlightClassName="highlight"
              searchWords={activeEntityFilters}
              autoEscape={true}
              textToHighlight={capitalizeAllWords(formattedEdge.predicate)}
            />
            {
              !!formattedEdge?.compressed_edges && formattedEdge.compressed_edges.length > 0 &&
              <span className={styles.more}>
                + {formattedEdge.compressed_edges.length} More
              </span>
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
          pathArray={formattedEdge.support}
          isExpanded={isSupportExpanded}
          pathFilterState={pathFilterState}
          pathViewStyles={pathViewStyles}
          handleActivateEvidence={handleActivateEvidence}
          handleEdgeClick={handleEdgeClick}
          handleNodeClick={handleNodeClick}
          selectedPaths={selectedPaths}
          activeEntityFilters={activeEntityFilters}
          activeFilters={activeFilters}
          pk={pk}
          showHiddenPaths={showHiddenPaths}
        />
      }
    </>
  )
}

export default Predicate;
