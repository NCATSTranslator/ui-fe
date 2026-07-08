import { FC } from 'react';
import styles from './CanvasEmptyState.module.scss';

const CanvasEmptyState: FC = () => {
  return (
    <div className={styles.emptyState}>
      <p>Add an <strong>object</strong> or view a <strong>query</strong> to get started</p>
    </div>
  );
};

export default CanvasEmptyState;
