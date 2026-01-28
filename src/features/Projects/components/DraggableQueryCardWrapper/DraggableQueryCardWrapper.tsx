import { ReactNode } from "react";
import styles from './DraggableQueryCardWrapper.module.scss';

const DraggableQueryCardWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className={styles.draggableQueryCardWrapper}>
      {children}
    </div>
  );
};

export default DraggableQueryCardWrapper;