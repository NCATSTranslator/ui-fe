import { FC, ReactNode } from 'react';
import styles from './ViewSkeleton.module.scss';

interface ViewSkeletonProps {
  statusMessage?: ReactNode;
}

const ViewSkeleton: FC<ViewSkeletonProps> = ({ statusMessage }) => {
  return (
    <div className={styles.viewSkeleton}>
      <div className={styles.bar} style={{ width: '120px', height: '12px' }} />
      <div className={styles.bar} style={{ width: '240px', height: '24px' }} />
      <div className={styles.bar} style={{ width: '100%', height: '40px', marginTop: '16px' }} />
      <div className={styles.bar} style={{ width: '100%', height: '120px', marginTop: '8px' }} />
      {statusMessage && <div className={styles.status}>{statusMessage}</div>}
    </div>
  );
};

export default ViewSkeleton;
