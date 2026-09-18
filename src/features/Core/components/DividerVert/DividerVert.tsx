import { FC } from 'react';
import styles from './DividerVert.module.scss';
import { joinClasses } from '@/features/Core/utils/classHelpers';

const DividerVert: FC<{ className?: string }> = ({ className }) => {
  return <div className={joinClasses(styles.dividerVert, className)} />;
};

export default DividerVert;