import { FC } from 'react';
import styles from './PaginationSummary.module.scss';

interface PaginationSummaryProps {
  itemOffset: number;
  endOffset: number;
  totalCount: number;
  label: string;
  className?: string;
}

const PaginationSummary: FC<PaginationSummaryProps> = ({
  itemOffset,
  endOffset,
  totalCount,
  label,
  className,
}) => (
  <p className={`${styles.evidenceCount} ${className ?? ''}`}>
    {totalCount > 0
      ? `Showing ${itemOffset + 1}-${endOffset} of ${totalCount} ${label}`
      : `Showing 0 of 0 ${label}`
    }
  </p>
);

export default PaginationSummary;
