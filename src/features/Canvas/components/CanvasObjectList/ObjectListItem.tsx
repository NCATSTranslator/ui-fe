import { MouseEvent, ReactNode, useId } from 'react';
import Highlighter from 'react-highlight-words';
import styles from './CanvasObjectList.module.scss';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import type { CanvasSearchMatch } from '@/features/Canvas/utils/canvasFunctions';
import { formatCanvasSearchMatchTooltip } from '@/features/Canvas/utils/canvasFunctions';
import CanvasNodeActionMenu from '@/features/Canvas/components/CanvasNodeActionMenu/CanvasNodeActionMenu';
import CogIcon from '@/assets/icons/navigation/Settings.svg?react';

export interface ObjectListItemProps<TAction extends string> {
  itemId: string;
  displayName: string;
  searchTerm?: string;
  externalSearchMatches?: CanvasSearchMatch[];
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
  searchTerm,
  externalSearchMatches = [],
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
  const matchTooltipId = useId();
  const hasExternalSearchMatches = externalSearchMatches.length > 0;

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
          {searchTerm ? (
            <>
              <Highlighter
                className={styles.nodeName}
                highlightClassName="highlight"
                searchWords={[searchTerm]}
                autoEscape={true}
                textToHighlight={displayName}
              />
              {hasExternalSearchMatches && (
                <>
                  <Tooltip id={matchTooltipId} place="top">
                    <span>{formatCanvasSearchMatchTooltip(externalSearchMatches)}</span>
                  </Tooltip>
                  <span
                    data-tooltip-id={matchTooltipId}
                    className={joinClasses(styles.nameMatch, styles.nameMatchIndicator)}
                  >
                    <Highlighter
                      highlightClassName="highlight"
                      searchWords={['*']}
                      autoEscape={true}
                      textToHighlight=" *"
                    />
                  </span>
                </>
              )}
            </>
          ) : (
            displayName
          )}
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
