import { FC } from 'react';
import SkeletonBar from '@/features/Core/components/SkeletonBar/SkeletonBar';
import styles from './ResultDetailViewSkeleton.module.scss';
import ViewTopBar from '@/features/Navigation/components/ViewTopBar/ViewTopBar';

interface ResultDetailViewSkeletonProps {
  /** Reserves room for the bookmark and notes buttons shown to the left of the tabs. */
  showInteractables?: boolean;
}

const ResultDetailViewSkeleton: FC<ResultDetailViewSkeletonProps> = ({ showInteractables = false }) => {
  return (
    <div className={styles.container}>
      <ViewTopBar/>
      <div className={styles.tableHeader}>
        <div />
        <SkeletonBar width="60px" height="10px" />
        <SkeletonBar width="40px" height="10px" />
      </div>
      <div className={styles.header}>
        <div className={styles.top}>
          <SkeletonBar width="70%" height="20px" />
          <SkeletonBar width="80px" height="14px" />
          <SkeletonBar width="60px" height="14px" />
        </div>
        <div className={styles.tags}>
          <SkeletonBar width="72px" height="24px" borderRadius="12px" />
          <SkeletonBar width="96px" height="24px" borderRadius="12px" />
          <SkeletonBar width="64px" height="24px" borderRadius="12px" />
        </div>
        <SkeletonBar width="70%" height="72px" />
      </div>
      <div className={styles.tabBar}>
        {
          showInteractables &&
          <div className={styles.interactables}>
            <SkeletonBar width="24px" height="24px" />
            <SkeletonBar width="24px" height="24px" />
          </div>
        }
        <div className={styles.tabList}>
          <SkeletonBar width="72px" height="20px" />
          <SkeletonBar width="44px" height="20px" />
        </div>
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
