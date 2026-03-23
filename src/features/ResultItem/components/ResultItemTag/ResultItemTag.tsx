import { FC, useCallback } from "react";
import styles from './ResultItemTag.module.scss';
import { Filter } from "@/features/ResultFiltering/types/filters";
import { joinClasses } from "@/features/Common/utils/utilities";
import * as filtering from '@/features/ResultFiltering/utils/filterFunctions';

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

  if (!(filtering.getTagFamily(fid) === filtering.CONSTANTS.FAMILIES.ROLE)) return null;
  const tag = availableFilters[fid];
  const isActive = (activeFilters.some((filter)=> filter.id === fid && filter.value === tag.name));
  if(!tag) {
    console.warn('No tag found for', fid);
    return null;
  }

  const handleClick = useCallback(() => {
    handleTagClick(fid, tag, handleFilter);
  }, [tag, handleFilter, handleTagClick]);

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