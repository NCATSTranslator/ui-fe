import styles from './PathObject.module.scss';
import { FC, RefObject, useCallback, useContext, useId } from 'react';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import NodeTooltipContent from '@/features/Core/components/Tooltips/NodeTooltipContent';
import { nodeToTooltipProps } from '@/features/Core/components/Tooltips/tooltipMappers';
import PathArrow from '@/assets/icons/connectors/PathArrow.svg?react';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import { getDefaultEdge, getDefaultNode } from '@/features/Core/utils/resultHelpers';
import { getNodeIcon } from '@/features/Core/utils/entityLinks';
import Highlighter from 'react-highlight-words';
import Predicate from '@/features/ResultItem/components/Predicate/Predicate';
import { Path, ResultEdge, ResultNode } from '@/features/ResultList/types/results.d';
import { isResultNode, isResultEdge } from '@/features/ResultList/types/checkers';
import { useSelector } from 'react-redux';
import { getEdgeById, getNodeById, getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { useResultItemId, useSeenStatus } from '@/features/ResultItem/hooks/resultHooks';
import { useHoverPathObject } from '@/features/Evidence/hooks/evidenceHooks';
import { HoverContext } from '@/features/ResultItem/components/PathView/PathView';
import { isNodeIndex } from '@/features/ResultList/utils/resultsInteractionFunctions';
import { useResultListContext } from '@/features/ResultList/context/ResultListContext';

export interface PathObjectProps {
  activeEntityFilters: string[];
  className?: string;
  handleEdgeClick?: (edgeIDs: string[], path: Path) => void;
  id: string | string[];
  index: number;
  inModal?: boolean;
  isEven?: boolean;
  parentPathKey: string;
  path: Path;
  pathViewStyles?: {[key: string]: string;} | null;
  pk: string;
  selected?: boolean;
  selectedEdgeRef?: RefObject<HTMLElement | null>;
}

const PathObject: FC<PathObjectProps> = ({
  activeEntityFilters,
  className = "",
  handleEdgeClick,
  id,
  index,
  inModal = false,
  isEven = false,
  parentPathKey,
  path,
  pathViewStyles = null,
  pk,
  selected,
  selectedEdgeRef}) => {

  const { resultId, resultsNavigate } = useResultListContext();
  const itemResultId = useResultItemId();
  const effectiveResultId = resultId ?? itemResultId;
  const resultSet = useSelector(getResultSetById(pk));

  // ID of the main element (in the case of a compressed edge)
  const itemID = (Array.isArray(id)) ? id[0] : id;
  const isNodeSlot = isNodeIndex(index);
  const pathObject = isNodeSlot ? getNodeById(resultSet, itemID) : getEdgeById(resultSet, itemID);

  const node = (pathObject && isNodeSlot) ? getDefaultNode(pathObject as ResultNode) : null;
  let edge: ResultEdge | null = null;
  if (pathObject && !isNodeSlot) {
    edge = getDefaultEdge(pathObject as ResultEdge);
    if (!edge.predicate) edge.predicate = 'Unknown relationship';
  }

  if (pathObject && isNodeSlot && !isResultNode(pathObject, true)) {
    console.warn(`PathObject node "${itemID}" rendering with defaults after strict check failure.`);
  }
  if (pathObject && !isNodeSlot && !isResultEdge(pathObject, true)) {
    console.warn(`PathObject edge "${itemID}" rendering with defaults after strict check failure.`);
  }

  const { isEdgeSeen } = useSeenStatus(pk);
  const isSeen = !!edge && isEdgeSeen(edge.id);
  const uid = useId();
  const nodeTooltipProps = node ? nodeToTooltipProps(node) : null;
  const nodeNameString = nodeTooltipProps?.nameString || node?.id || 'Unknown';
  const hoverContext = useContext(HoverContext);
  if (!hoverContext) {
    throw new Error("PathObject must be rendered inside PathView's HoverContext provider");
  }
  const { hoveredItem, setHoveredItem } = hoverContext;
  const isHighlighted = hoveredItem?.id === itemID;
  const { getHoverHandlers } = useHoverPathObject(setHoveredItem);
  const hoverHandlers = edge ? getHoverHandlers(true, itemID, index) : getHoverHandlers(false, itemID, index);

  const nodeClass = joinClasses(
    styles.nameContainer,
    styles.pathObject,
    className,
    pathViewStyles && pathViewStyles.nameContainer,
    inModal && styles.inModal,
    isEven && styles.isEven,
    isHighlighted && styles.highlighted
  );

  const handleNodeClick = useCallback((targetNode: ResultNode) => {
    if (effectiveResultId) {
      resultsNavigate(`/results/${effectiveResultId}/node/${targetNode.id}`);
    } else if(Array.isArray(targetNode.provenance) && targetNode.provenance[0].length > 0 && targetNode.provenance[0].includes("http")) {
      window.open(targetNode.provenance[0], '_blank');
    } else {
      console.warn('Could not navigate to node, resultId is not set and no provenance is available');
    }
  }, [effectiveResultId, resultsNavigate]);

  if (!pathObject) {
    console.warn(`Could not generate PathObject, missing ${isNodeSlot ? 'node' : 'edge'} with id: ${itemID}`);
    const placeholderClass = joinClasses(
      isNodeSlot ? styles.nameContainer : styles.predicateContainer,
      styles.pathObject,
      styles.placeholder,
      className,
      pathViewStyles && pathViewStyles.nameContainer,
      inModal && styles.inModal,
      isEven && styles.isEven
    );
    return (
      <span className={placeholderClass} data-missing-id={itemID}>
        <div className={`${styles.nameShape} ${pathViewStyles && pathViewStyles.nameShape}`}>
          <div className={`${styles.background} ${pathViewStyles && pathViewStyles.background}`}></div>
        </div>
        <span className={`${!!pathViewStyles && pathViewStyles.nameInterior} ${styles.name}`}>
          <span className={styles.text}>{itemID || 'Unknown'}</span>
        </span>
        <PathArrow className={`${!!pathViewStyles && pathViewStyles.icon} ${styles.icon}`}/>
      </span>
    );
  }

  if (node) {
    return (
      <span
        className={nodeClass}
        data-tooltip-id={`${uid}`}
        data-node-id={node.id}
        onClick={(e)=> {e.stopPropagation(); handleNodeClick(node);}}
        {...hoverHandlers}
        >
        <div className={`${styles.nameShape} ${pathViewStyles && pathViewStyles.nameShape}`}>
          <div className={`${styles.background} ${pathViewStyles && pathViewStyles.background}`}></div>
        </div>
        <span className={`${!!pathViewStyles && pathViewStyles.nameInterior} ${styles.name}`} >
          {getNodeIcon(node.types[0])}
          <span className={styles.text}>
            <Highlighter
              highlightClassName="highlight"
              searchWords={activeEntityFilters}
              autoEscape={true}
              textToHighlight={nodeNameString}
            />
          </span>
        </span>
        <PathArrow className={`${!!pathViewStyles && pathViewStyles.icon} ${styles.icon}`}/>
        <Tooltip id={`${uid}`}>
          {nodeTooltipProps && <NodeTooltipContent {...nodeTooltipProps} nameString={nodeNameString} />}
        </Tooltip>
      </span>
    );
  }

  if (edge) {
    return (
      <Predicate
        path={path}
        parentPathKey={parentPathKey}
        edge={edge}
        edgeIds={(Array.isArray(id)) ? id : [id]}
        selected={selected}
        activeEntityFilters={activeEntityFilters}
        uid={uid}
        handleEdgeClick={handleEdgeClick}
        hoverHandlers={hoverHandlers}
        parentClass={styles.predicateContainer}
        inModal={inModal}
        isEven={isEven}
        isHighlighted={isHighlighted}
        isSeen={isSeen}
        className={className}
        pathViewStyles={pathViewStyles}
        parentStyles={styles}
        pk={pk}
        selectedEdgeRef={selectedEdgeRef}
      />
    );
  }

  return null;
}

export default PathObject;
