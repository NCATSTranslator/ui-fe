import styles from './SelectedFilterTag.module.scss';
import { FC } from "react";
import { Filter } from "@/features/ResultFiltering/types/filters";
import { getFilterLabel, isEntityFilter, isTagFilter } from "@/features/ResultFiltering/utils/filterFunctions";
import ExcludeIcon from "@/assets/icons/buttons/View & Exclude/Exclude.svg?react";
import CloseIcon from "@/assets/icons/buttons/Close/Close.svg?react";

interface SelectedFilterTagProps {
  filter: Filter;
  handleFilter: (filter: Filter) => void;
  inSidebar?: boolean;
  key: string;
}

const SelectedFilterTag: FC<SelectedFilterTagProps> = ({ 
  filter,
  handleFilter,
  inSidebar = false, 
  key }) => {

  let filterDisplay;
  if (isEntityFilter(filter)) {
    filterDisplay = <div>Text Filter: <span>"{filter.value}"</span></div>;
  } else if (isTagFilter(filter)) {
    const filterLabel = getFilterLabel(filter);
    filterDisplay = <div>{filterLabel}:<span> {filter.value}</span></div>;
  }

  return(
    inSidebar 
    ?
      <span key={key} className={`${styles.filterTag} ${filter?.negated ? styles.negated : ''}`}>
        {!!filter?.negated && <ExcludeIcon className={styles.excludeIcon}/>}
        { filterDisplay }
        <span className={styles.close} onClick={()=>{handleFilter(filter)}}><CloseIcon/></span>
      </span>
    :
      <span key={key} className={`${styles.filterTag} ${filter?.negated ? styles.negated : ''}`}>
        {!!filter?.negated && <ExcludeIcon className={styles.excludeIcon}/>}
        { filterDisplay }
        <span className={styles.close} onClick={()=>{handleFilter(filter)}}><CloseIcon/></span>
      </span>
  )
}

export default SelectedFilterTag;