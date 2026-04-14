import styles from './PathObject.module.scss';
import { FC, RefObject, useCallback, useContext, useId } from 'react';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import NodeTooltipContent from '@/features/Core/components/Tooltips/NodeTooltipContent';
import { nodeToTooltipProps } from '@/features/Core/components/Tooltips/tooltipMappers';
import PathArrow from '@/assets/icons/connectors/PathArrow.svg?react';
import { getNodeIcon, joinClasses } from '@/features/Common/utils/utilities';
import Highlighter from 'react-highlight-words';
import Predicate from '@/features/ResultItem/components/Predicate/Predicate';
import { Path, PathFilterState, isResultNode, isResultEdge, ResultNode } from '@/features/ResultList/types/results.d';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { useSelector } from 'react-redux';
import { getEdgeById, getNodeById, getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { useSeenStatus } from '@/features/ResultItem/hooks/resultHooks';
import { useHoverPathObject } from '@/features/Evidence/hooks/evidenceHooks';
import { HoverContext } from '@/features/ResultItem/components/PathView/PathView';
import { isNodeIndex } from '@/features/ResultList/utils/resultsInteractionFunctions';
import { useResultListContext } from '@/features/ResultList/context/ResultListContext';

export interface PathObjectProps {
  activeEntityFilters: string[];
  activeFilters: Filter[];
  className?: string;
  handleEdgeClick?: (edgeIDs: string[], path: Path) => void;
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
  handleEdgeClick,
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

  const { resultId, resultsNavigate } = useResultListContext();
  const resultSet = useSelector(getResultSetById(pk));

  // ID of the main element (in the case of a compressed edge)
  const itemID = (Array.isArray(id)) ? id[0] : id;
  const pathObject = (isNodeIndex(index)) ? getNodeById(resultSet, itemID) : getEdgeById(resultSet, itemID);
  const isNode = isResultNode(pathObject, false);
  const isEdge = isResultEdge(pathObject, false);
  const { isEdgeSeen } = useSeenStatus(pk);
  const isSeen = isEdge && isEdgeSeen(pathObject.id);
  const uid = useId();
  const nodeTooltipProps = isNode && pathObject ? nodeToTooltipProps(pathObject) : null;
  const hoverContext = useContext(HoverContext);
  if (!hoverContext) {
    throw new Error("PathObject must be rendered inside PathView's HoverContext provider");
  }
  const { hoveredItem, setHoveredItem } = hoverContext;
  const isHighlighted = hoveredItem?.id === itemID;
  const { getHoverHandlers } = useHoverPathObject(setHoveredItem);
  const hoverHandlers = (isEdge) ? getHoverHandlers(true, itemID, index) : getHoverHandlers(false, itemID, index);

  const nodeClass = joinClasses(
    styles.nameContainer,
    styles.pathObject,
    className,
    pathViewStyles && pathViewStyles.nameContainer,
    inModal && styles.inModal,
    isEven && styles.isEven,
    isHighlighted && styles.highlighted
  );

  const handleNodeClick = useCallback((node: ResultNode) => {
    if (resultId) {
      resultsNavigate(`/results/${resultId}/node/${node.id}`);
    } else if(Array.isArray(node.provenance) && node.provenance[0].length > 0 && node.provenance[0].includes("http")) {
      window.open(node.provenance[0], '_blank');
    } else {
      console.warn('Could not navigate to node, resultId is not set and no provenance is available');
    }
  }, [resultId, resultsNavigate]);

  if (!pathObject) {
    console.warn(`Could not generate PathObject, pathObject is ${String(pathObject)}`);
    return null;
  }
  if (!isNode && !isEdge) {
    console.warn('Could not generate PathObject, pathObject does not match any known type:');
    console.warn(pathObject);
    return null;
  }

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
                {getNodeIcon(pathObject?.types[0])}
                <span className={styles.text}>
                  <Highlighter
                    highlightClassName="highlight"
                    searchWords={activeEntityFilters}
                    autoEscape={true}
                    textToHighlight={nodeTooltipProps?.nameString ?? ''}
                  />
                </span>
              </span>
              <PathArrow className={`${!!pathViewStyles && pathViewStyles.icon} ${styles.icon}`}/>
              <Tooltip id={`${uid}`}>
                {nodeTooltipProps && <NodeTooltipContent {...nodeTooltipProps} />}
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
                  handleEdgeClick={handleEdgeClick}
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
