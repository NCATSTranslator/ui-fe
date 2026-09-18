import { FC, ReactNode } from 'react';
import styles from './FilteredOutWrapper.module.scss';
import FilteredOutBanner from '@/features/Core/components/FilteredOutBanner/FilteredOutBanner';
import { joinClasses } from '@/features/Core/utils/classHelpers';

interface FilteredOutWrapperProps {
  isFilteredOut: boolean;
  message: string;
  onClearFilters: () => void;
  children: ReactNode;
  /** Applied to the inner (dimmable) content div */
  className?: string;
}

/**
 * Renders a "filtered out" banner above its children and dims the children when
 * `isFilteredOut` is true.
 */
const FilteredOutWrapper: FC<FilteredOutWrapperProps> = ({ isFilteredOut, message, onClearFilters, children, className }) => {
  return (
    <>
      {isFilteredOut && <FilteredOutBanner message={message} onClearFilters={onClearFilters} />}
      <div
        className={joinClasses(className, isFilteredOut && styles.filteredOut)}
        aria-hidden={isFilteredOut || undefined}
      >
        {children}
      </div>
    </>
  );
};

export default FilteredOutWrapper;
