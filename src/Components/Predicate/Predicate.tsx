import { useState, FC, MouseEvent } from 'react';
import styles from './Predicate.module.scss';
import ExternalLink from '../../Icons/Buttons/External Link.svg?react';
import PubIcon from '../../Icons/Status/HasPub.svg?react';
import CTIcon from '../../Icons/Status/HasCT.svg?react';
import Up from '../../Icons/Directional/Chevron/Chevron Up.svg?react';
import Highlighter from 'react-highlight-words';
import { checkEdgesForClinicalTrials, checkEdgesForPubs, getCompressedEdge, hasSupport } from '../../Utilities/utilities';
import Tooltip from '../Tooltip/Tooltip';
import SupportPathGroup from '../SupportPathGroup/SupportPathGroup';
import { Filter, Path, PathFilterState, ResultEdge, ResultNode } from '../../Types/results';
import { getResultSetById } from '../../Redux/resultsSlice';
import { useSelector } from 'react-redux';
import { cloneDeep } from 'lodash';

interface PredicateProps {
  activeEntityFilters: string[];
  activeFilters: Filter[];
  className?: string;
  handleActivateEvidence: (path: Path) => void;
  handleEdgeClick: (edgeIDs: string[], path: Path) => void;
  handleNodeClick: (name: ResultNode) => void;
  edge: ResultEdge;
  edgeIDs: string[];
  inModal?: boolean | null;
  parentClass?: string;
  parentStyles?: {[key: string]: string;} | null;
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
  parentStyles,
  pathFilterState,
  path, 
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

  const handleSupportExpansion = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsSupportExpanded(prev=>!prev);
  }

  const pushAndReturn = (arr: any[], element: any) => {
    let newArr = cloneDeep(arr);
    newArr.push(element);
    return newArr;
  }
  
  const edgesToDisplay = (!!formattedEdge?.compressed_edges) 
  ? pushAndReturn(formattedEdge.compressed_edges, formattedEdge)
  : [formattedEdge];

  return (
    <>
      <span
        className={`${selected ? styles.selected : ''} ${parentClass} ${className} ${hasPubs ? styles.hasPubs : ''} ${hasCTs ? styles.hasCTs : ''} ${!!pathViewStyles && pathViewStyles.predicateInterior} ${isInferred && pathViewStyles && pathViewStyles.isInferred}`}
        onClick={(e)=> {e.stopPropagation(); handleEdgeClick(edgeIDs, path);}}
        >
        <Tooltip
          id={`${formattedEdge.predicate}${uid}`}
          place={`${inModal ? 'left' : 'top' }`}
          >
          {
            <div className={styles.predicatesList}>
              {
                edgesToDisplay.sort((a, b)=> a.predicate.localeCompare(b.predicate)).map((edge) => {
                  if(!edge)
                    return null;
                  return (
                    <p
                      key={`${edge.predicate}`}
                      className={`${styles.tooltipPredicate} ${inModal ? styles.inModal : ''}`}
                      onClick={(e)=> {
                        e.stopPropagation();
                        handleEdgeClick([edge.id], path);
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
                  );
                })
              }
            </div>
          }
        </Tooltip>
        <div className={`${parentStyles && parentStyles.nameShape}`}></div>
        <span
          className={`${styles.pred} pred ${hasMore ? styles.hasMore : ''}`}
          >
          <span data-tooltip-id={`${formattedEdge.predicate}${uid}`} className={styles.predLabel}>
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
          <div className={styles.badges}>
            {
              hasPubs && <PubIcon/>
            }
            {
              hasCTs && <CTIcon/>
            }
          </div>
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
        />
      }
    </>
  )
}

export default Predicate;
