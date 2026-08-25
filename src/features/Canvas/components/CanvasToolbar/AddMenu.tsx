import { FC, useCallback } from 'react';
import styles from './CanvasToolbar.module.scss';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import OutsideClickHandler from '@/features/Core/components/OutsideClickHandler/OutsideClickHandler';
import AddIcon from '@/assets/icons/buttons/Add/Add.svg?react';
import useDropdownMenuA11y from './useDropdownMenuA11y';
import Button from '@/features/Core/components/Button/Button';

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
      <Button
        className={joinClasses(styles.addButton, open && styles.active)}
        iconLeft={<AddIcon />}
        handleClick={toggle}
        ariaLabel="Add to canvas"
        title="Add to canvas"
        ref={triggerRef}
        {...triggerA11yProps}
        iconOnly
      />
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
