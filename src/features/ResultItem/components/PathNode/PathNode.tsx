import { FC, memo } from 'react';
import Highlighter from 'react-highlight-words';
import PathArrow from '@/assets/icons/connectors/PathArrow.svg?react';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import NodeTooltipContent from '@/features/Core/components/Tooltips/NodeTooltipContent';
import { nodeToTooltipProps } from '@/features/Core/components/Tooltips/tooltipMappers';
import { getNodeIcon } from '@/features/Core/utils/entityLinks';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import { ResultNode } from '@/features/ResultList/types/results.d';
import { useCanvasContextMenu } from '@/features/Canvas/components/CanvasContextMenu/CanvasContextMenu';
import { useResultEntityDraggable } from '@/features/DragAndDrop/hooks/useResultEntityDraggable';
import dragStyles from '@/features/DragAndDrop/styles/resultEntityDraggable.module.scss';

export interface PathNodeProps {
  activeEntityFilters: string[];
  className?: string;
  hoverHandlers?: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
  inModal?: boolean;
  isEven?: boolean;
  isHighlighted?: boolean;
  node: ResultNode;
  onNodeClick: (node: ResultNode) => void;
  parentStyles: {[key: string]: string;};
  pathViewStyles?: {[key: string]: string;} | null;
  pk: string;
  uid: string;
}

/**
 * Renders a single node slot within a path. Split out from PathObject so the
 * canvas draggable is only registered for slots that actually hold a node.
 */
const PathNode: FC<PathNodeProps> = ({
  activeEntityFilters,
  className = "",
  hoverHandlers,
  inModal = false,
  isEven = false,
  isHighlighted = false,
  node,
  onNodeClick,
  parentStyles,
  pathViewStyles = null,
  pk,
  uid,
}) => {
  const { openMenu, canvasEnabled } = useCanvasContextMenu();

  const {
    attributes: nodeDragAttributes,
    listeners: nodeDragListeners,
    setNodeRef: setNodeDragRef,
    isDragging: isNodeDragging,
    canDrag: canDragNode,
  } = useResultEntityDraggable({ type: 'node', data: { id: node.id, pk } });

  const nodeTooltipProps = nodeToTooltipProps(node);
  const nodeNameString = nodeTooltipProps.nameString || node.id || 'Unknown';

  const nodeClass = joinClasses(
    parentStyles.nameContainer,
    parentStyles.pathObject,
    className,
    pathViewStyles && pathViewStyles.nameContainer,
    inModal && parentStyles.inModal,
    isEven && parentStyles.isEven,
    isHighlighted && parentStyles.highlighted,
    canDragNode && dragStyles.draggable,
    isNodeDragging && dragStyles.dragging,
  );

  return (
    <span
      ref={setNodeDragRef}
      className={nodeClass}
      data-tooltip-id={`${uid}`}
      data-node-id={node.id}
      onClick={(e)=> {e.stopPropagation(); onNodeClick(node);}}
      onContextMenu={canvasEnabled
        ? (e) => { e.preventDefault(); e.stopPropagation(); openMenu({ type: 'node', id: node.id, pk, position: { x: e.clientX, y: e.clientY } }); }
        : undefined}
      {...hoverHandlers}
      {...nodeDragListeners}
      {...nodeDragAttributes}
      >
      <div className={`${parentStyles.nameShape} ${pathViewStyles && pathViewStyles.nameShape}`}>
        <div className={`${parentStyles.background} ${pathViewStyles && pathViewStyles.background}`}></div>
      </div>
      <span className={`${!!pathViewStyles && pathViewStyles.nameInterior} ${parentStyles.name}`} >
        {getNodeIcon(node.types[0])}
        <span className={parentStyles.text}>
          <Highlighter
            highlightClassName="highlight"
            searchWords={activeEntityFilters}
            autoEscape={true}
            textToHighlight={nodeNameString}
          />
        </span>
      </span>
      <PathArrow className={`${!!pathViewStyles && pathViewStyles.icon} ${parentStyles.icon}`}/>
      <Tooltip id={`${uid}`}>
        <NodeTooltipContent {...nodeTooltipProps} nameString={nodeNameString} />
      </Tooltip>
    </span>
  );
};

export default memo(PathNode);
