import { ReactNode } from 'react';
import { SortField, SortDirection } from '@/features/Projects/types/projects.d';
import styles from './SortableHeader.module.scss';
import ArrowDownIcon from '@/assets/icons/directional/Arrows/Arrow Down.svg?react';

interface SortableHeaderProps {
  field: SortField;
  children: ReactNode;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

const SortableHeader = ({ 
  field, 
  children, 
  sortField, 
  sortDirection, 
  onSort 
}: SortableHeaderProps) => (
  <div 
    className={`${styles.sortableHeader} ${sortField === field ? styles.activeSort : ''}`}
    onClick={() => onSort(field)}
  >
    {children}
    {sortField === field && (
      <ArrowDownIcon 
        className={`${styles.sortArrow} ${sortDirection === 'asc' ? styles.asc : styles.desc}`} 
      />
    )}
  </div>
);

export default SortableHeader; 