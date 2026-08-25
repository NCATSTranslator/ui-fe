import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import OutsideClickHandler from '@/features/Core/components/OutsideClickHandler/OutsideClickHandler';
import { clampFixedPosition } from '@/features/Core/utils/domHelpers';
import type { CanvasNodeAction } from '@/features/Canvas/constants/canvasNodeActions';
import CanvasNodeActionMenu from '@/features/Canvas/components/CanvasNodeActionMenu/CanvasNodeActionMenu';
import styles from './CanvasNodeContextMenu.module.scss';

export type CanvasNodeMenuSource = 'contextMenu' | 'objectList';

export interface CanvasNodeContextMenuTarget {
  nodeId: string;
  position: { x: number; y: number };
  source?: CanvasNodeMenuSource;
}

interface CanvasNodeContextMenuProps<T extends string = CanvasNodeAction> {
  target: CanvasNodeContextMenuTarget;
  actions: readonly { action: T; label: string }[];
  onClose: () => void;
  onAction: (action: T, nodeId: string) => void;
}

const CanvasNodeContextMenu = <T extends string = CanvasNodeAction>({
  target,
  actions,
  onClose,
  onAction,
}: CanvasNodeContextMenuProps<T>) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(target.position);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const { width, height } = menu.getBoundingClientRect();
    setPosition(clampFixedPosition(target.position.x, target.position.y, width, height));
  }, [target.position.x, target.position.y]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleScroll = () => onClose();
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  const runAction = useCallback((action: T) => {
    onAction(action, target.nodeId);
  }, [onAction, target.nodeId]);

  return createPortal(
    <OutsideClickHandler onOutsideClick={onClose}>
      <div
        ref={menuRef}
        className={styles.contextMenu}
        // eslint-disable-next-line no-restricted-syntax
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      >
        <CanvasNodeActionMenu
          actions={actions}
          onAction={runAction}
          menuRole="menu"
        />
      </div>
    </OutsideClickHandler>,
    document.body,
  );
};

export default CanvasNodeContextMenu;
