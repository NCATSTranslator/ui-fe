import { memo, useCallback, useMemo, type FC, type MouseEvent } from 'react';
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
  onNodeClick: (nodeId: string) => void;
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
  const { displayName, externalSearchMatches, primaryCategory, title } = useMemo(() => {
    const rawName = getCanvasNodeDisplayName(node);
    const category = getCanvasNodePrimaryCategory(node) ?? null;
    const matches = searchTerm
      ? getCanvasNodeSearchMatchesOutsideDisplayName(node, searchTerm)
      : [];
    return {
      displayName: formatBiolinkNode(rawName, category, null),
      externalSearchMatches: matches,
      primaryCategory: category,
      title: matches.length > 0 ? formatCanvasSearchMatchTooltip(matches) : rawName,
    };
  }, [node, searchTerm]);

  const handleClick = useCallback(() => onNodeClick(node.id), [onNodeClick, node.id]);

  const handleMenu = useCallback((event?: MouseEvent) => {
    if (!event) return;
    event.stopPropagation();
    onMenu(node.id, { x: event.clientX, y: event.clientY });
  }, [onMenu, node.id]);

  return (
    <CanvasNodeChip
      nodeId={node.id}
      type={primaryCategory ?? ''}
      displayName={displayName}
      searchTerm={searchTerm}
      externalSearchMatches={externalSearchMatches}
      title={title}
      onClick={handleClick}
      onHover={onHoverNode}
      onMenu={handleMenu}
    />
  );
};

export default memo(NodeItem);
