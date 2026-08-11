import { FC, useCallback } from 'react';
import styles from './CanvasToolbar.module.scss';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import OutsideClickHandler from '@/features/Core/components/OutsideClickHandler/OutsideClickHandler';
import SettingsIcon from '@/assets/icons/navigation/Settings.svg?react';
import useCanvasSettingsActions from '@/features/Canvas/hooks/useCanvasSettingsActions';
import useDropdownMenuA11y from './useDropdownMenuA11y';

const CanvasSettingsMenu: FC = () => {
  const { open, close, toggle, triggerRef, menuRef, triggerA11yProps, menuA11yProps } = useDropdownMenuA11y();
  const { exportCanvas, requestDeleteActiveCanvas, hasActiveCanvas } = useCanvasSettingsActions();

  const handleExport = useCallback(() => {
    close();
    exportCanvas();
  }, [close, exportCanvas]);

  const handleDelete = useCallback(() => {
    close();
    requestDeleteActiveCanvas();
  }, [close, requestDeleteActiveCanvas]);

  return (
    <OutsideClickHandler className={styles.settingsMenuWrapper} onOutsideClick={close}>
      <button
        ref={triggerRef}
        type="button"
        className={joinClasses(styles.toolButton, open && styles.active)}
        onClick={toggle}
        aria-label="Canvas settings"
        title="Canvas settings"
        {...triggerA11yProps}
      >
        <SettingsIcon />
      </button>
      {open && (
        <div ref={menuRef} className={styles.settingsMenu} {...menuA11yProps}>
          <button
            type="button"
            role="menuitem"
            className={styles.settingsMenuItem}
            onClick={handleExport}
            disabled={!hasActiveCanvas}
          >
            Export Canvas
          </button>
          <button
            type="button"
            role="menuitem"
            className={joinClasses(styles.settingsMenuItem, styles.settingsMenuItemDanger)}
            onClick={handleDelete}
            disabled={!hasActiveCanvas}
          >
            Delete Canvas
          </button>
        </div>
      )}
    </OutsideClickHandler>
  );
};

export default CanvasSettingsMenu;
