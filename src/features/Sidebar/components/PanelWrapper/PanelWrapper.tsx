import { FC, ReactNode } from 'react';
import styles from './PanelWrapper.module.scss';

interface PanelWrapperProps {
  children: ReactNode;
  title: string;
}

const PanelWrapper: FC<PanelWrapperProps> = ({ children, title }) => {
  return (
    <div className={styles.panelWrapper}>
      <h6 className={styles.title}>{title}</h6>
      {children}
    </div>
  );
};

export default PanelWrapper;