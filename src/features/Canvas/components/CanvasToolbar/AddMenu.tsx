import { FC, useState } from 'react';
import styles from './CanvasToolbar.module.scss';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import Button from '@/features/Core/components/Button/Button';
import OutsideClickHandler from '@/features/Core/components/OutsideClickHandler/OutsideClickHandler';
import AddIcon from '@/assets/icons/buttons/Add/Add.svg?react';

interface AddMenuProps {
  onAddObject?: () => void;
  onAddAnnotation?: () => void;
}

const AddMenu: FC<AddMenuProps> = ({ onAddObject, onAddAnnotation }) => {
  const [open, setOpen] = useState(false);
  return (
    <OutsideClickHandler className={styles.addMenuWrapper} onOutsideClick={() => setOpen(false)}>
      <Button
        className={joinClasses(styles.addButton, open && styles.active)}
        iconOnly
        handleClick={() => setOpen(prev => !prev)}
        aria-label="Add to canvas"
        title="Add to canvas"
        iconLeft={<AddIcon />}
      />
      {open && (
        <div className={styles.addMenu}>
          <button
            className={styles.addMenuItem}
            onClick={() => { setOpen(false); onAddObject?.(); }}
          >
            Object
          </button>
          <button
            className={styles.addMenuItem}
            onClick={() => { setOpen(false); onAddAnnotation?.(); }}
          >
            Annotation
          </button>
        </div>
      )}
    </OutsideClickHandler>
  );
};

export default AddMenu;
