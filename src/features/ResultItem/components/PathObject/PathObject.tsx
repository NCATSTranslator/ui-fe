import styles from './PathObject.module.scss';
import { FC, RefObject, useContext, useId } from 'react';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import PathArrow from '@/assets/icons/connectors/PathArrow.svg?react';
import { formatBiolinkEntity, formatBiolinkNode, getIcon, joinClasses } from '@/features/Common/utils/utilities';
import Highlighter from 'react-highlight-words';
import Predicate from '@/features/ResultItem/components/Predicate/Predicate';
import { Path, PathFilterState, isResultNode, ResultNode, isResultEdge } from '@/features/ResultList/types/results.d';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { useSelector } from 'react-redux';
import { getEdgeById, getNodeById, getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { useSeenStatus } from '@/features/ResultItem/hooks/resultHooks';
import { useHoverPathObject } from '@/features/Evidence/hooks/evidenceHooks';
import { HoverContext } from '@/features/ResultItem/components/PathView/PathView';

export interface PathObjectProps {
  activeEntityFilters: string[];
  activeFilters: Filter[];
  className?: string;
  handleActivateEvidence?: (path: Path, pathKey: string) => void;
  handleEdgeClick: (edgeIDs: string[], path: Path, pathKey: string) => void;
  handleNodeClick: (name: ResultNode) => void;
  id: string | string[];
  index: number;
  inModal?: boolean;
  isEven?: boolean;
  parentPathKey: string;
  path: Path;
  pathFilterState: PathFilterState;
  pathViewStyles?: {[key: string]: string;} | null;
  pk: string;
  selected?: boolean;
  selectedPaths: Set<Path> | null;
  selectedEdgeRef?: RefObject<HTMLElement | null>;
  showHiddenPaths?: boolean;
}

const PathObject: FC<PathObjectProps> = ({ 
  activeEntityFilters,
  activeFilters,
  className = "",
  handleActivateEvidence = ()=>{},
  handleEdgeClick,
  handleNodeClick,
  id,
  index,
  inModal = false,
  isEven = false,
  pathFilterState,
  parentPathKey,
  path,
  pathViewStyles = null,
  pk,
  selected,
  selectedPaths,
  selectedEdgeRef,
  showHiddenPaths = true}) => {

  const resultSet = useSelector(getResultSetById(pk));

  // ID of the main element (in the case of a compressed edge)
  const itemID = (Array.isArray(id)) ? id[0] : id; 
  const pathObject = (index % 2 === 0) ? getNodeById(resultSet, itemID) : getEdgeById(resultSet, itemID);
  const isNode = isResultNode(pathObject);
  const isEdge = isResultEdge(pathObject);
  const { isEdgeSeen } = useSeenStatus(pk);
  const isSeen = isEdge && isEdgeSeen(pathObject.id);
  const type = isNode ? pathObject?.types[0].replace("biolink:", ""): '';
  const uid = useId();
  let nameString = '';
  let typeString = '';
  if(isNode) {
    nameString = formatBiolinkNode(pathObject.names[0], type, pathObject.species);
    typeString = formatBiolinkEntity(type);
  }
  const hoverContext = useContext(HoverContext);
  if (!hoverContext) throw new Error('useHoverPathObject must be used within a HoverProvider');
  const { hoveredItem, setHoveredItem } = hoverContext;
  const isHighlighted = hoveredItem?.id === itemID;
  const { getHoverHandlers } = useHoverPathObject(setHoveredItem);
  const hoverHandlers = (isEdge) ? getHoverHandlers(true, itemID, index) : getHoverHandlers(false, itemID, index);

  const provenance = (!!pathObject?.provenance && pathObject.provenance.length > 0) ? pathObject.provenance[0] : false;
  const description = (isNode && !!pathObject?.descriptions[0]) ? pathObject.descriptions[0] : '';

  if(!pathObject)
    return null;

  const nodeClass = joinClasses(
    styles.nameContainer,
    styles.pathObject,
    className,
    pathViewStyles && pathViewStyles.nameContainer,
    inModal && styles.inModal,
    isEven && styles.isEven,
    isHighlighted && styles.highlighted
  );

  return (
    <>
      {
        isNode 
          ?
            <span 
              className={nodeClass}
              data-tooltip-id={`${uid}`}
              data-node-id={pathObject.id}
              onClick={(e)=> {e.stopPropagation(); handleNodeClick(pathObject);}}
              {...hoverHandlers}
              >
              <div className={`${styles.nameShape} ${pathViewStyles && pathViewStyles.nameShape}`}>
                <div className={`${styles.background} ${pathViewStyles && pathViewStyles.background}`}></div>
              </div>
              <span className={`${!!pathViewStyles && pathViewStyles.nameInterior} ${styles.name}`} >
                {getIcon(pathObject?.types[0])}
                <span className={styles.text}>
                  <Highlighter
                    highlightClassName="highlight"
                    searchWords={activeEntityFilters}
                    autoEscape={true}
                    textToHighlight={nameString}
                  />
                </span>
              </span>
              <PathArrow className={`${!!pathViewStyles && pathViewStyles.icon} ${styles.icon}`}/>
              <Tooltip id={`${uid}`}>
                <div onClick={(e)=> e.stopPropagation()}>
                  <span><strong>{nameString}</strong> ({typeString})</span>
                  <span className={styles.description}>{description}</span>
                  {
                    provenance && typeof provenance === "string" &&
                    <a href={provenance} target="_blank" rel='noreferrer' className={styles.provenance}>
                      <ExternalLink/>
                      <span>{provenance}</span>
                    </a>
                  }
                </div>
              </Tooltip>
            </span>
          :
            isEdge 
              ?
                <Predicate
                  path={path}
                  parentPathKey={parentPathKey}
                  edge={pathObject}
                  edgeIds={(Array.isArray(id)) ? id : [id]}
                  selected={selected}
                  activeEntityFilters={activeEntityFilters}
                  activeFilters={activeFilters}
                  uid={uid}
                  handleActivateEvidence={handleActivateEvidence}
                  handleEdgeClick={handleEdgeClick}
                  handleNodeClick={handleNodeClick}
                  hoverHandlers={hoverHandlers}
                  parentClass={styles.predicateContainer}
                  inModal={inModal}
                  isEven={isEven}
                  isHighlighted={isHighlighted}
                  isSeen={isSeen}
                  className={className}
                  pathFilterState={pathFilterState}
                  pathViewStyles={pathViewStyles}
                  parentStyles={styles}
                  selectedPaths={selectedPaths}
                  pk={pk}
                  showHiddenPaths={showHiddenPaths}
                  selectedEdgeRef={selectedEdgeRef}
                />
              :
                null
      }
    </>
  )
}

export default PathObject;
