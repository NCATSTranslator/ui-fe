import { FC } from 'react';
import SkeletonBar from '@/features/Core/components/SkeletonBar/SkeletonBar';
import styles from './EvidenceViewSkeleton.module.scss';

const EvidenceViewSkeleton: FC = () => {
  return (
    <div className={styles.container}>
      <SkeletonBar width="260px" height="28px" />
      <div className={styles.labelRow}>
        <SkeletonBar width="180px" height="16px" />
        <SkeletonBar width="100px" height="16px" />
      </div>
      <SkeletonBar
        width="100%"
        height="64px"
        className={styles.pathPlaceholder}
      />
      <div>
        <div className={styles.tabBar}>
          <SkeletonBar width="80px" height="40px" />
          <SkeletonBar width="90px" height="40px" />
          <SkeletonBar width="110px" height="40px" />
        </div>
        <div className={styles.tableRows}>
          <SkeletonBar width="100%" height="40px" />
          <SkeletonBar width="100%" height="55px" />
          <SkeletonBar width="100%" height="55px" />
          <SkeletonBar width="100%" height="55px" />
        </div>
      </div>
    </div>
  );
};

export default EvidenceViewSkeleton;
