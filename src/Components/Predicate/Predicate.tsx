import { useState, FC, MouseEvent, useMemo } from 'react';
import styles from './Predicate.module.scss';
import ExternalLink from '../../Icons/Buttons/External Link.svg?react';
import PathArrow from '../../Icons/Connectors/PathArrow.svg?react';
import PubIcon from '../../Icons/Status/HasPub.svg?react';
import CTIcon from '../../Icons/Status/HasCT.svg?react';
import Up from '../../Icons/Directional/Chevron/Chevron Up.svg?react';
import InferredBorder from '../../Icons/Connectors/Double Lines.svg?react';
import Highlighter from 'react-highlight-words';
import { checkEdgesForClinicalTrials, checkEdgesForPubs, getCompressedEdge, getEvidenceFromEdge, hasSupport } from '../../Utilities/utilities';
import Tooltip from '../Tooltip/Tooltip';
import SupportPathGroup from '../SupportPathGroup/SupportPathGroup';
import { Filter, Path, PathFilterState, ResultEdge, ResultNode } from '../../Types/results';
import { getResultSetById } from '../../Redux/resultsSlice';
import { useSelector } from 'react-redux';
import { cloneDeep } from 'lodash';
import { useSupportPathKey } from '../../Utilities/customHooks';

interface PredicateProps {
  activeEntityFilters: string[];
  activeFilters: Filter[];
  className?: string;
  handleActivateEvidence: (path: Path, pathKey: string) => void;
  handleEdgeClick: (edgeIDs: string[], path: Path, pathKey: string) => void;
  handleNodeClick: (name: ResultNode) => void;
  hoverHandlers?: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
  edge: ResultEdge;
  edgeIDs: string[];
  inModal?: boolean | null;
  parentClass?: string;
  parentStyles?: {[key: string]: string;} | null;
  pathFilterState: PathFilterState;
  path: Path;
  parentPathKey: string;
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
  hoverHandlers,
  inModal = false,
  parentClass = '',
  parentStyles,
  pathFilterState,
  path,
  parentPathKey,
  pathViewStyles = null,
  pk,
  selected = false,
  selectedPaths,
  showHiddenPaths,
  uid }) => {

  let resultSet = useSelector(getResultSetById(pk));
  const formattedEdge = (!!resultSet && Array.isArray(edgeIDs) && edgeIDs.length > 1) ? getCompressedEdge(resultSet, edgeIDs) : edge;
  const hasMore = (!!formattedEdge?.compressed_edges && formattedEdge.compressed_edges.length > 0);
  const [isSupportExpanded, setIsSupportExpanded] = useState(formattedEdge.is_root);
  const edgeArrayToCheck = (!!formattedEdge?.compressed_edges && formattedEdge.compressed_edges.length > 0) ? [...formattedEdge.compressed_edges, formattedEdge] : [formattedEdge];
  const hasPubs = checkEdgesForPubs(edgeArrayToCheck);
  const hasCTs = checkEdgesForClinicalTrials(edgeArrayToCheck);
  const isInferred = hasSupport(formattedEdge);

  const ancestorsPathKey = useSupportPathKey();
  const fullPathKey = useMemo(() => {
    if(!!ancestorsPathKey)
      return `${ancestorsPathKey}.${parentPathKey}`;
    else
      return parentPathKey;
  }, [ancestorsPathKey, parentPathKey]);

  const handleSupportExpansion = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsSupportExpanded(prev=>!prev);
  }

  const pushAndReturn = (arr: any[], element: any) => {
    let newArr = cloneDeep(arr);
    newArr.push(element);
    return newArr;
  }
  
  const edgesToDisplay: ResultEdge[] = (!!formattedEdge?.compressed_edges) 
  ? pushAndReturn(formattedEdge.compressed_edges, formattedEdge)
  : [formattedEdge];

  return (
    <>
      <span
        className={`${selected && styles.selected} ${selected && parentStyles ? parentStyles.selected : ''} ${styles.edge} ${inModal && styles.inModal} ${parentClass} ${className} ${hasPubs ? styles.hasPubs : ''} ${hasCTs ? styles.hasCTs : ''} ${!!pathViewStyles && pathViewStyles.predicateInterior} ${isInferred && styles.isInferred}`}
        data-tooltip-id={`${formattedEdge.predicate}${uid}`}
        onClick={(e)=> {e.stopPropagation(); handleEdgeClick(edgeIDs, path, fullPathKey);}}
        {...hoverHandlers}
        >
        <div className={`${parentStyles && parentStyles.nameShape} ${styles.nameShape}`}>
          <PathArrow/>
          <InferredBorder className={styles.border}/>
        </div>
        <Tooltip
          id={`${formattedEdge.predicate}${uid}`}
          place={`${inModal ? 'left' : 'top' }`}
          >
          {
            <div className={styles.predicatesList}>
              {
                edgesToDisplay.sort((a, b)=> a.predicate.localeCompare(b.predicate)).map((edge) => {
                  if(!edge || !resultSet)
                    return null;
                  // not optimal to create 2 new empty sets on each render, but it prevents having to write an additional evidence counting function
                  const edgeEvidence = getEvidenceFromEdge(resultSet, edge, new Set<string>(), new Set<string>());
                  return (
                    <div className={styles.tooltipPredicateContainer}>
                      <p
                        key={`${edge.predicate}`}
                        className={`${styles.tooltipPredicate} ${inModal ? styles.inModal : ''}`}
                        onClick={(e)=> {
                          e.stopPropagation();
                          handleEdgeClick([edge.id], path, fullPathKey);
                        }}
                        >
                        <Highlighter
                          highlightClassName="highlight"
                          searchWords={activeEntityFilters}
                          autoEscape={true}
                          textToHighlight={edge.predicate}
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
                      {
                        (edgeEvidence.pubs.size > 0 || edgeEvidence.cts.size > 0) &&
                        <div className={styles.tooltipEvidenceCounts}>
                          {
                            (edgeEvidence.pubs.size > 0) && 
                            <span className={styles.count}><PubIcon/>{edgeEvidence.pubs.size} Publication{edgeEvidence.pubs.size > 1 && "s"}</span>
                          }
                          {
                            (edgeEvidence.cts.size > 0) && 
                            <span className={styles.count}><CTIcon/>{edgeEvidence.cts.size} Clinical Trial{edgeEvidence.cts.size > 1 && "s"}</span>
                          }
                        </div>
                      }
                    </div>
                  );
                })
              }
            </div>
          }
        </Tooltip>
        <span
          className={`${styles.pred} pred ${hasMore ? styles.hasMore : ''}`}
          >
          <span className={styles.predLabel}>
            <Highlighter
              highlightClassName="highlight"
              searchWords={activeEntityFilters}
              autoEscape={true}
              textToHighlight={formattedEdge.predicate}
            />
            {
              !!formattedEdge?.compressed_edges && formattedEdge.compressed_edges.length > 0 &&
              <span className={styles.more}>+{formattedEdge.compressed_edges.length}</span>
            }
          </span>
          {
            (hasPubs || hasCTs) &&
            <div className={styles.badges}>
              {
                hasPubs && <PubIcon/>
              }
              {
                hasCTs && <CTIcon/>
              }
            </div>
          }
          {
            isInferred && !inModal &&
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
      </span>
      {
        isInferred && !inModal &&
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
          parentPathKey={parentPathKey}
        />
      }
    </>
  )
}

export default Predicate;
