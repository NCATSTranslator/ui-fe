import { FC } from 'react';
import SkeletonBar from '@/features/Core/components/SkeletonBar/SkeletonBar';
import styles from './ResultDetailViewSkeleton.module.scss';

const ResultDetailViewSkeleton: FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.tableHeader}>
        <SkeletonBar width="40px" height="10px" />
        <div />
        <SkeletonBar width="60px" height="10px" />
        <SkeletonBar width="40px" height="10px" />
        <SkeletonBar width="40px" height="10px" />
      </div>
      <div className={styles.header}>
        <div className={styles.top}>
          <SkeletonBar width="70%" height="20px" />
          <SkeletonBar width="100%" height="32px" />
          <SkeletonBar width="80px" height="14px" />
          <SkeletonBar width="60px" height="14px" />
          <SkeletonBar width="50px" height="14px" />
        </div>
        <div className={styles.tags}>
          <SkeletonBar width="72px" height="24px" borderRadius="12px" />
          <SkeletonBar width="96px" height="24px" borderRadius="12px" />
          <SkeletonBar width="64px" height="24px" borderRadius="12px" />
        </div>
        <SkeletonBar width="90%" height="14px" />
      </div>
      <div className={styles.tabBar}>
        <SkeletonBar width="48px" height="40px" />
        <SkeletonBar width="48px" height="40px" />
      </div>
      <div className={styles.tabContent}>
        <SkeletonBar width="100%" height="48px" className={styles.tabContentItem} />
        <SkeletonBar width="100%" height="48px" className={styles.tabContentItem} />
        <SkeletonBar width="100%" height="48px" className={styles.tabContentItem} />
      </div>
    </div>
  );
};

export default ResultDetailViewSkeleton;
