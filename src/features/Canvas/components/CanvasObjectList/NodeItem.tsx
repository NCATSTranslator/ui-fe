import { FC, MouseEvent } from 'react';
import type { CanvasNode } from '@/features/Canvas/types/canvas';
import {
  formatCanvasSearchMatchTooltip,
  getCanvasNodeDisplayName,
  getCanvasNodePrimaryCategory,
  getCanvasNodeSearchMatchesOutsideDisplayName,
} from '@/features/Canvas/utils/canvasFunctions';
import { formatBiolinkNode } from '@/features/Core/utils/stringFormatters';
import { CanvasNodeChip } from '@/features/Canvas/components/CanvasNodeChrome/CanvasNodeChrome';

export interface NodeItemProps {
  node: CanvasNode;
  searchTerm?: string;
  onNodeClick: (node: CanvasNode) => void;
  onHoverNode: (nodeId: string | null) => void;
  onMenu: (nodeId: string, position: { x: number; y: number }) => void;
}

const NodeItem: FC<NodeItemProps> = ({
  node,
  searchTerm,
  onNodeClick,
  onHoverNode,
  onMenu,
}) => {
  const rawName = getCanvasNodeDisplayName(node);
  const primaryCategory = getCanvasNodePrimaryCategory(node) ?? null;
  const displayName = formatBiolinkNode(rawName, primaryCategory, null);
  const externalSearchMatches = searchTerm
    ? getCanvasNodeSearchMatchesOutsideDisplayName(node, searchTerm)
    : [];
  const title = externalSearchMatches.length > 0
    ? formatCanvasSearchMatchTooltip(externalSearchMatches)
    : rawName;

  const handleMenu = (event?: MouseEvent) => {
    if (!event) return;
    event.stopPropagation();
    onMenu(node.id, { x: event.clientX, y: event.clientY });
  };

  return (
    <CanvasNodeChip
      nodeId={node.id}
      type={primaryCategory ?? ''}
      displayName={displayName}
      searchTerm={searchTerm}
      externalSearchMatches={externalSearchMatches}
      title={title}
      onClick={() => onNodeClick(node)}
      onHover={onHoverNode}
      onMenu={handleMenu}
    />
  );
};

export default NodeItem;
