import { FC, useCallback, MouseEvent } from "react";
import styles from './ResultItemTag.module.scss';
import { Filter } from "@/features/ResultFiltering/types/filters";
import { joinClasses } from "@/features/Core/utils/classHelpers";
import { FILTERING_CONSTANTS, getTagFamily } from '@/features/ResultFiltering/utils/filterFunctions';

interface ResultItemTagProps {
  activeFilters: Filter[];
  availableFilters: { [key: string]: Filter };
  fid: string;
  handleFilter: (filter: Filter) => void;
  handleTagClick: (fid: string, tag: Filter, handleFilter: (filter: Filter) => void) => void;
}

const ResultItemTag: FC<ResultItemTagProps> = ({
  activeFilters,
  availableFilters,
  fid,
  handleFilter,
  handleTagClick,
}) => {

  const tag = availableFilters[fid];
  const isActive = (activeFilters.some((filter)=> filter.id === fid && filter.value === tag.name));

  const handleClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    handleTagClick(fid, tag, handleFilter);
  }, [fid, tag, handleFilter, handleTagClick]);

  if (getTagFamily(fid) !== FILTERING_CONSTANTS.FAMILIES.ROLE) return null;

  if(!tag) {
    console.warn('No tag found for', fid);
    return null;
  }

  return (
    <button
      key={fid}
      className={joinClasses(styles.resultItemTag, isActive ? styles.active : '')}
      onClick={handleClick}
    >
      {tag.name} ({tag.count})
    </button>
  );
};

export default ResultItemTag;