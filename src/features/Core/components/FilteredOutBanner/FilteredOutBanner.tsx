import { FC } from 'react';
import styles from './FilteredOutBanner.module.scss';
import Button from '@/features/Core/components/Button/Button';
import { joinClasses } from '@/features/Common/utils/utilities';

interface FilteredOutBannerProps {
  message: string;
  onClearFilters: () => void;
  className?: string;
}

const FilteredOutBanner: FC<FilteredOutBannerProps> = ({ message, onClearFilters, className }) => {
  return (
    <div className={joinClasses(styles.filteredBanner, className)} role="status">
      <span>{message}</span>
      <Button handleClick={onClearFilters} variant="textOnly" smallFont>
        Clear filters
      </Button>
    </div>
  );
};

export default FilteredOutBanner;
