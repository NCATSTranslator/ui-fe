import { FC, ReactNode } from 'react';
import SkeletonBar from '@/features/Core/components/SkeletonBar/SkeletonBar';
import styles from './ViewSkeleton.module.scss';

interface ViewSkeletonProps {
  statusMessage?: ReactNode;
}

const ViewSkeleton: FC<ViewSkeletonProps> = ({ statusMessage }) => {
  return (
    <div className={styles.viewSkeleton}>
      <SkeletonBar width="120px" height="12px" />
      <SkeletonBar width="240px" height="24px" />
      {/* eslint-disable-next-line no-restricted-syntax */}
      <SkeletonBar width="100%" height="40px" style={{ marginTop: '16px' }} />
      {/* eslint-disable-next-line no-restricted-syntax */}
      <SkeletonBar width="100%" height="120px" style={{ marginTop: '8px' }} />
      {statusMessage && <div className={styles.status}>{statusMessage}</div>}
    </div>
  );
};

export default ViewSkeleton;
