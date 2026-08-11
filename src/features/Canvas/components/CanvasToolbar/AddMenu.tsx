import { FC, useCallback } from 'react';
import styles from './CanvasToolbar.module.scss';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import OutsideClickHandler from '@/features/Core/components/OutsideClickHandler/OutsideClickHandler';
import AddIcon from '@/assets/icons/buttons/Add/Add.svg?react';
import useDropdownMenuA11y from './useDropdownMenuA11y';

interface AddMenuProps {
  onAddObject?: () => void;
  onAddAnnotation?: () => void;
}

const AddMenu: FC<AddMenuProps> = ({ onAddObject, onAddAnnotation }) => {
  const { open, close, toggle, triggerRef, menuRef, triggerA11yProps, menuA11yProps } = useDropdownMenuA11y();

  const handleAddObject = useCallback(() => {
    close();
    onAddObject?.();
  }, [close, onAddObject]);

  const handleAddAnnotation = useCallback(() => {
    close();
    onAddAnnotation?.();
  }, [close, onAddAnnotation]);

  return (
    <OutsideClickHandler className={styles.addMenuWrapper} onOutsideClick={close}>
      <button
        ref={triggerRef}
        type="button"
        className={joinClasses(styles.addButton, open && styles.active)}
        onClick={toggle}
        aria-label="Add to canvas"
        title="Add to canvas"
        {...triggerA11yProps}
      >
        <AddIcon />
      </button>
      {open && (
        <div ref={menuRef} className={styles.addMenu} {...menuA11yProps}>
          <button
            type="button"
            role="menuitem"
            className={styles.addMenuItem}
            onClick={handleAddObject}
          >
            Object
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.addMenuItem}
            onClick={handleAddAnnotation}
          >
            Annotation
          </button>
        </div>
      )}
    </OutsideClickHandler>
  );
};

export default AddMenu;
