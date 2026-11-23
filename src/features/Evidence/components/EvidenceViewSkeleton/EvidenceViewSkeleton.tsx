import { FC } from 'react';
import SkeletonBar from '@/features/Core/components/SkeletonBar/SkeletonBar';
import styles from './EvidenceViewSkeleton.module.scss';
import ViewTopBar from '@/features/Navigation/components/ViewTopBar/ViewTopBar';

const SkeletonSection: FC<{ rows: number }> = ({ rows }) => (
  <div className={styles.section}>
    <SkeletonBar width="160px" height="20px" />
    {Array.from({ length: rows }, (_, i) => (
      <SkeletonBar key={i} width="100%" height="55px" />
    ))}
  </div>
);

const EvidenceViewSkeleton: FC = () => {
  return (
    <div className={styles.container}>
      <ViewTopBar/>
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
      <div className={styles.grid}>
        <div className={styles.column}>
          <SkeletonSection rows={3} />
          <SkeletonSection rows={3} />
        </div>
        <div className={styles.column}>
          <SkeletonSection rows={2} />
          <SkeletonSection rows={3} />
        </div>
      </div>
    </div>
  );
};

export default EvidenceViewSkeleton;
