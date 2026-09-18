import { FC, ReactNode } from 'react';
import styles from './CanvasObjectList.module.scss';
import OutsideClickHandler from '@/features/Core/components/OutsideClickHandler/OutsideClickHandler';

interface ObjectListBodyProps {
  menuId: string | null;
  onCloseMenu: () => void;
  children: ReactNode;
}

const ObjectListBody: FC<ObjectListBodyProps> = ({ menuId, onCloseMenu, children }) => (
  <OutsideClickHandler
    className={styles.listBodyClickTarget}
    onOutsideClick={() => { if (menuId) onCloseMenu(); }}
  >
    <div className={styles.nodeList}>
      {children}
    </div>
  </OutsideClickHandler>
);

export default ObjectListBody;
