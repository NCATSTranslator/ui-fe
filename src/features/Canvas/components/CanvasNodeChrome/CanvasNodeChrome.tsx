import { createContext, useContext, type FC, type MouseEvent, type ReactNode } from 'react';
import type { GraphNodeChrome } from 'translator-graph-view';
import HorizontalDotMenuIcon from '@/assets/icons/buttons/Dot Menu/Horizontal Dot Menu.svg?react';
import AddIcon from '@/assets/icons/buttons/Add/Add.svg?react';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import { getNodeIcon } from '@/features/Core/utils/entityLinks';
import ObjectListSearchName from '@/features/Canvas/components/CanvasObjectList/ObjectListSearchName';
import type { CanvasSearchMatch } from '@/features/Canvas/utils/canvasFunctions';
import styles from './CanvasNodeChrome.module.scss';

type CanvasNodeChromeActions = {
  onQueryMenu: (nodeId: string, position: { x: number; y: number }) => void;
};

/**
 * Graph node chrome (the "+" query button) cannot receive callbacks from
 * translator-graph-view, so CanvasPane must wrap the graph in this provider.
 * Object-list chips may still pass `onQueryMenu` directly.
 */
export const CanvasNodeChromeActionsContext = createContext<CanvasNodeChromeActions | null>(null);

interface NodeChromeButtonProps {
  onClick?: (event: MouseEvent) => void;
  label: string;
  children: ReactNode;
}

const NodeChromeButton: FC<NodeChromeButtonProps> = ({ onClick, label, children }) => (
  <button
    type="button"
    className={styles.chromeButton}
    onClick={onClick}
    aria-label={label}
  >
    {children}
  </button>
);

export const NodeMenuChromeButton: FC<{ onMenu?: (event?: MouseEvent) => void }> = ({ onMenu }) => (
  <NodeChromeButton onClick={onMenu} label="Open node menu">
    <HorizontalDotMenuIcon />
  </NodeChromeButton>
);

export const NodeQueryChromeButton: FC<{
  nodeId: string;
  onQueryMenu?: (nodeId: string, position: { x: number; y: number }) => void;
}> = ({ nodeId, onQueryMenu }) => {
  const chromeActions = useContext(CanvasNodeChromeActionsContext);
  // Graph chrome relies on CanvasNodeChromeActionsContext; list chips may pass onQueryMenu.
  const handleQueryMenu = onQueryMenu ?? chromeActions?.onQueryMenu;
  return (
    <NodeChromeButton
      label="New query"
      onClick={(event) => {
        handleQueryMenu?.(nodeId, { x: event.clientX, y: event.clientY });
      }}
    >
      <AddIcon />
    </NodeChromeButton>
  );
};

export const NodeChromeSlot: FC<{
  position: 'topLeft' | 'bottomRight';
  children: ReactNode;
}> = ({ position, children }) => (
  <div
    className={joinClasses(
      styles.chrome,
      position === 'topLeft' ? styles.chromeTopLeft : styles.chromeBottomRight,
    )}
    onClick={(event) => event.stopPropagation()}
    onMouseDown={(event) => event.stopPropagation()}
  >
    {children}
  </div>
);

interface CanvasNodeChipProps {
  nodeId: string;
  type: string;
  displayName: string;
  searchTerm?: string;
  externalSearchMatches?: CanvasSearchMatch[];
  title?: string;
  onClick: () => void;
  onHover: (id: string | null) => void;
  onMenu: (event?: MouseEvent) => void;
  onQueryMenu: (nodeId: string, position: { x: number; y: number }) => void;
}

export const CanvasNodeChip: FC<CanvasNodeChipProps> = ({
  nodeId,
  type,
  displayName,
  searchTerm,
  externalSearchMatches,
  title,
  onClick,
  onHover,
  onMenu,
  onQueryMenu,
}) => (
  <div
    className={styles.canvasNode}
    onMouseEnter={() => onHover(nodeId)}
    onMouseLeave={() => onHover(null)}
  >
    <button
      type="button"
      className={styles.canvasNodeBody}
      onClick={onClick}
      title={title}
    >
      <span className={styles.canvasNodeIcon}>
        {getNodeIcon(type)}
      </span>
      <span className={styles.canvasNodeLabel}>
        <ObjectListSearchName
          displayName={displayName}
          searchTerm={searchTerm}
          externalSearchMatches={externalSearchMatches}
        />
      </span>
    </button>
    <NodeChromeSlot position="topLeft">
      <NodeMenuChromeButton onMenu={onMenu} />
    </NodeChromeSlot>
    <NodeChromeSlot position="bottomRight">
      <NodeQueryChromeButton nodeId={nodeId} onQueryMenu={onQueryMenu} />
    </NodeChromeSlot>
  </div>
);

export const canvasNodeChrome: GraphNodeChrome = {
  topLeft: ({ onMenu }) => (
    onMenu ? <NodeMenuChromeButton onMenu={onMenu} /> : null
  ),
  bottomRight: ({ node }) => <NodeQueryChromeButton nodeId={node.id} />,
};
