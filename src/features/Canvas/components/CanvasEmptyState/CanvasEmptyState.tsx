import { FC } from 'react';
import { Link } from 'react-router-dom';
import styles from './CanvasEmptyState.module.scss';

const CanvasEmptyState: FC = () => {
  return (
    <div className={styles.emptyState}>
      <p>Drag a <strong>result</strong>, <strong>path</strong>, <strong>object</strong>, or <strong>relationship</strong> from a <Link to="/query-history">query</Link> to get started</p>
    </div>
  );
};

export default CanvasEmptyState;
