import { FC } from 'react';
import type { HoverGeometry } from 'translator-graph-view';
import styles from './CanvasNodeHoverMenu.module.scss';

interface CanvasNodeHoverMenuProps {
  nodeId: string;
  geometry: HoverGeometry;
  onRemove: (nodeId: string) => void;
  onNewQuery: (nodeId: string) => void;
  onInformation: (nodeId: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const CanvasNodeHoverMenu: FC<CanvasNodeHoverMenuProps> = ({
  nodeId,
  geometry,
  onRemove,
  onNewQuery,
  onInformation,
  onMouseEnter,
  onMouseLeave,
}) => {
  const { anchor } = geometry;

  return (
    <div
      className={styles.hoverMenu}
      // eslint-disable-next-line no-restricted-syntax
      style={{ left: `${anchor.x}px`, top: `${anchor.y}px` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button type="button" onClick={() => onInformation(nodeId)}>
        Info
      </button>
      <button type="button" onClick={() => onNewQuery(nodeId)}>
        Query
      </button>
      <button type="button" onClick={() => onRemove(nodeId)}>
        Remove
      </button>
    </div>
  );
};

export default CanvasNodeHoverMenu;
