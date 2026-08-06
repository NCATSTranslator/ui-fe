import { FC, MouseEvent } from 'react';
import styles from './CanvasObjectList.module.scss';
import type { Canvas, CanvasNode } from '@/features/Canvas/types/canvas';
import { getCanvasNodeDisplayName, getNodeEdgeCount, getCanvasNodeSearchMatchesOutsideDisplayName } from '@/features/Canvas/utils/canvasFunctions';
import { formatBiolinkEntity } from '@/features/Core/utils/stringFormatters';
import ObjectListItem from './ObjectListItem';
import {
  OBJECT_LIST_NODE_ACTIONS,
  type CanvasNodeAction,
} from '@/features/Canvas/constants/canvasNodeActions';

export interface NodeItemProps {
  node: CanvasNode;
  canvas: Canvas;
  searchTerm?: string;
  nodeMenuId: string | null;
  onNodeClick: (node: CanvasNode) => void;
  onHoverNode: (nodeId: string | null) => void;
  onMenuToggle: (nodeId: string, e: MouseEvent) => void;
  onMenuAction: (action: CanvasNodeAction, node: CanvasNode) => void;
}

const NodeItem: FC<NodeItemProps> = ({
  node,
  canvas,
  searchTerm,
  nodeMenuId,
  onNodeClick,
  onHoverNode,
  onMenuToggle,
  onMenuAction,
}) => {
  const edgeCount = getNodeEdgeCount(canvas, node.id);
  const typeLabel = node.types[0] ? formatBiolinkEntity(node.types[0]) : '';
  const displayName = getCanvasNodeDisplayName(node);
  const externalSearchMatches = searchTerm
    ? getCanvasNodeSearchMatchesOutsideDisplayName(node, searchTerm)
    : [];

  return (
    <ObjectListItem<CanvasNodeAction>
      itemId={node.id}
      displayName={displayName}
      searchTerm={searchTerm}
      externalSearchMatches={externalSearchMatches}
      meta={(
        <>
          {typeLabel && <span className={styles.typeChip}>{typeLabel}</span>}
          {edgeCount > 0 && (
            <span className={styles.edgeCount}>
              {edgeCount} {edgeCount === 1 ? 'relationship' : 'relationships'}
            </span>
          )}
        </>
      )}
      menuId={nodeMenuId}
      ariaLabel={`Actions for ${displayName}`}
      actions={OBJECT_LIST_NODE_ACTIONS}
      onItemClick={() => onNodeClick(node)}
      onHover={onHoverNode}
      onMenuToggle={onMenuToggle}
      onMenuAction={action => onMenuAction(action, node)}
    />
  );
};

export default NodeItem;
