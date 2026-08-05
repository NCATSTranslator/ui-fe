import { MouseEvent, ReactNode } from 'react';
import styles from './CanvasObjectList.module.scss';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import CanvasNodeActionMenu from '@/features/Canvas/components/CanvasNodeActionMenu/CanvasNodeActionMenu';
import CogIcon from '@/assets/icons/navigation/Settings.svg?react';

export interface ObjectListItemProps<TAction extends string> {
  itemId: string;
  displayName: string;
  isEmptyName?: boolean;
  meta: ReactNode;
  menuId: string | null;
  ariaLabel: string;
  actions: readonly { action: TAction; label: string }[];
  onItemClick: () => void;
  onHover: (id: string | null) => void;
  onMenuToggle: (id: string, e: MouseEvent) => void;
  onMenuAction: (action: TAction) => void;
}

const ObjectListItem = <TAction extends string>({
  itemId,
  displayName,
  isEmptyName = false,
  meta,
  menuId,
  ariaLabel,
  actions,
  onItemClick,
  onHover,
  onMenuToggle,
  onMenuAction,
}: ObjectListItemProps<TAction>) => {
  const isMenuOpen = menuId === itemId;

  return (
    <div
      className={styles.nodeItem}
      onMouseEnter={() => onHover(itemId)}
      onMouseLeave={() => onHover(null)}
    >
      <button
        type="button"
        className={styles.nodeItemContent}
        onClick={onItemClick}
      >
        <span className={joinClasses(styles.nodeName, isEmptyName && styles.placeholderName)}>
          {displayName}
        </span>
        <span className={styles.nodeMeta}>{meta}</span>
      </button>
      <div className={styles.nodeMenuWrapper}>
        <button
          type="button"
          className={joinClasses(styles.nodeMenuButton, isMenuOpen && styles.active)}
          onClick={e => onMenuToggle(itemId, e)}
          aria-label={ariaLabel}
        >
          <CogIcon />
        </button>
        {isMenuOpen && (
          <CanvasNodeActionMenu<TAction>
            actions={actions}
            onAction={onMenuAction}
            className={styles.nodeMenu}
            itemClassName={styles.nodeMenuItem}
          />
        )}
      </div>
    </div>
  );
};

export default ObjectListItem;
