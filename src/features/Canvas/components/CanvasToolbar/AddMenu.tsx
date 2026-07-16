import { FC, useState } from 'react';
import styles from './CanvasToolbar.module.scss';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import OutsideClickHandler from '@/features/Core/components/OutsideClickHandler/OutsideClickHandler';
import CircleAddIcon from '@/assets/icons/buttons/Add/Circle Add.svg?react';

interface AddMenuProps {
  onAddObject?: () => void;
  onAddAnnotation?: () => void;
}

const AddMenu: FC<AddMenuProps> = ({ onAddObject, onAddAnnotation }) => {
  const [open, setOpen] = useState(false);
  return (
    <OutsideClickHandler className={styles.addMenuWrapper} onOutsideClick={() => setOpen(false)}>
      <button
        className={joinClasses(styles.addButton, open && styles.active)}
        onClick={() => setOpen(prev => !prev)}
        aria-label="Add to canvas"
        title="Add to canvas"
      >
        <CircleAddIcon />
        <span>Add</span>
      </button>
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
