import styles from './PathObject.module.scss';
import { FC, RefObject, memo, useCallback, useEffect, useId, useMemo } from 'react';
import PathArrow from '@/assets/icons/connectors/PathArrow.svg?react';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import { getDefaultEdge, getDefaultNode } from '@/features/Core/utils/resultHelpers';
import PathNode from '@/features/ResultItem/components/PathNode/PathNode';
import Predicate from '@/features/ResultItem/components/Predicate/Predicate';
import { Path, ResultEdge, ResultNode } from '@/features/ResultList/types/results.d';
import { warnOnceOnEntityTypeMismatch } from '@/features/ResultList/utils/entityTypeWarnings';
import { useSelector } from 'react-redux';
import { getEdgeById, getNodeById, getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { useResultItemId, useSeenStatus } from '@/features/ResultItem/hooks/resultHooks';
import { useHoverHandlers, useIsEntityHovered } from '@/features/ResultItem/hooks/hoverHooks';
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
  // Memoized because getEdgeById deep clones "treats" edges, and because the
  // derived node/edge below are the props that let PathNode/Predicate stay memoized.
  const pathObject = useMemo(
    () => isNodeSlot ? getNodeById(resultSet, itemID) : getEdgeById(resultSet, itemID),
    [resultSet, isNodeSlot, itemID]
  );

  const node = useMemo(
    () => (pathObject && isNodeSlot) ? getDefaultNode(pathObject as ResultNode) : null,
    [pathObject, isNodeSlot]
  );
  const edge = useMemo<ResultEdge | null>(() => {
    if (!pathObject || isNodeSlot) return null;
    const defaultedEdge = getDefaultEdge(pathObject as ResultEdge);
    if (!defaultedEdge.predicate) defaultedEdge.predicate = 'Unknown relationship';
    return defaultedEdge;
  }, [pathObject, isNodeSlot]);

  // Deliberately an effect rather than inline: the strict checkers are expensive and
  // log heavily, so they must stay off the render path that hover interactions hit.
  useEffect(() => {
    warnOnceOnEntityTypeMismatch(isNodeSlot ? 'node' : 'edge', itemID, pathObject);
  }, [pathObject, isNodeSlot, itemID]);

  const { isEdgeSeen } = useSeenStatus(pk);
  const isSeen = !!edge && isEdgeSeen(edge.id);
  const uid = useId();
  // Subscribing to just this entity's highlight keeps a hover from re-rendering
  // every other path object on the page.
  const isHighlighted = useIsEntityHovered(itemID);
  const hoverHandlers = useHoverHandlers(!isNodeSlot, itemID);
  const edgeIds = useMemo(() => (Array.isArray(id) ? id : [id]), [id]);

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
      <PathNode
        activeEntityFilters={activeEntityFilters}
        className={className}
        hoverHandlers={hoverHandlers}
        inModal={inModal}
        isEven={isEven}
        isHighlighted={isHighlighted}
        node={node}
        onNodeClick={handleNodeClick}
        parentStyles={styles}
        pathViewStyles={pathViewStyles}
        pk={pk}
        uid={uid}
      />
    );
  }

  if (edge) {
    return (
      <Predicate
        path={path}
        parentPathKey={parentPathKey}
        edge={edge}
        edgeIds={edgeIds}
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

export default memo(PathObject);
