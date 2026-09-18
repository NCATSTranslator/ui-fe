import { FC, useCallback } from 'react';
import styles from './CanvasToolbar.module.scss';
import { LayoutType } from 'translator-graph-view';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import OutsideClickHandler from '@/features/Core/components/OutsideClickHandler/OutsideClickHandler';
import SettingsIcon from '@/assets/icons/navigation/Settings.svg?react';
import Button from '@/features/Core/components/Button/Button';
import useCanvasSettingsActions from '@/features/Canvas/hooks/useCanvasSettingsActions';
import useDropdownMenuA11y from './useDropdownMenuA11y';

const layouts: { key: LayoutType; label: string }[] = [
  { key: 'hierarchicalLR', label: 'Horizontal' },
  { key: 'hierarchical', label: 'Vertical' },
  { key: 'force', label: 'Force' },
  { key: 'custom', label: 'Custom' },
];

interface CanvasSettingsMenuProps {
  layout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
}

const CanvasSettingsMenu: FC<CanvasSettingsMenuProps> = ({ layout, onLayoutChange }) => {
  const { open, close, toggle, triggerRef, menuRef, triggerA11yProps, menuA11yProps } = useDropdownMenuA11y();
  const {
    exportCanvasCSV,
    exportCanvasImage,
    canExportImage,
    requestDeleteActiveCanvas,
    hasActiveCanvas,
  } = useCanvasSettingsActions();

  const handleLayoutChange = useCallback((nextLayout: LayoutType) => {
    close();
    onLayoutChange(nextLayout);
  }, [close, onLayoutChange]);

  const handleExportCSV = useCallback(() => {
    close();
    exportCanvasCSV();
  }, [close, exportCanvasCSV]);

  const handleExportImage = useCallback(() => {
    close();
    void exportCanvasImage();
  }, [close, exportCanvasImage]);

  const handleDelete = useCallback(() => {
    close();
    requestDeleteActiveCanvas();
  }, [close, requestDeleteActiveCanvas]);

  return (
    <OutsideClickHandler className={styles.settingsMenuWrapper} onOutsideClick={close}>
      <Button
        ref={triggerRef}
        type="button"
        className={joinClasses(styles.toolButton, open && styles.active)}
        handleClick={toggle}
        ariaLabel="Canvas settings"
        title="Canvas settings"
        {...triggerA11yProps}
        iconOnly
        variant="secondary"
        iconLeft={<SettingsIcon />}
      />
      {open && (
        <div ref={menuRef} className={styles.settingsMenu} {...menuA11yProps}>
          <div className={styles.settingsMenuLabel} role="presentation">
            Layout
          </div>
          {layouts.map(({ key, label }) => {
            const isActive = layout === key;
            return (
              <button
                key={key}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                className={joinClasses(styles.settingsMenuItem, isActive && styles.settingsMenuItemActive)}
                onClick={() => handleLayoutChange(key)}
              >
                {label}
              </button>
            );
          })}
          <div className={styles.settingsMenuDivider} role="separator" />
          <div className={styles.settingsMenuLabel} role="presentation">
            Export
          </div>
          <button
            type="button"
            role="menuitem"
            className={styles.settingsMenuItem}
            onClick={handleExportCSV}
            disabled={!hasActiveCanvas}
          >
            CSV
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.settingsMenuItem}
            onClick={handleExportImage}
            disabled={!canExportImage}
          >
            PNG Image
          </button>
          <div className={styles.settingsMenuDivider} role="separator" />
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
