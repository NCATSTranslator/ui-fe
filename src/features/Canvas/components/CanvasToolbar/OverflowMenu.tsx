import { FC, useState } from 'react';
import styles from './CanvasToolbar.module.scss';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import OutsideClickHandler from '@/features/Core/components/OutsideClickHandler/OutsideClickHandler';
import OverflowIcon from '@/assets/icons/buttons/Dot Menu/Vertical Dot Menu.svg?react';

const OverflowMenu: FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <OutsideClickHandler className={styles.overflowWrapper} onOutsideClick={() => setOpen(false)}>
      <button
        className={joinClasses(styles.toolButton, open && styles.active)}
        onClick={() => setOpen(prev => !prev)}
        aria-label="More options"
        title="More options"
      >
        <OverflowIcon />
      </button>
      {open && (
        <div className={styles.overflowMenu}>
          <button className={styles.overflowItem} onClick={() => setOpen(false)} disabled>
            Export Canvas
          </button>
          <button className={styles.overflowItem} onClick={() => setOpen(false)} disabled>
            Duplicate Canvas
          </button>
        </div>
      )}
    </OutsideClickHandler>
  );
};

export default OverflowMenu;
