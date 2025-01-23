import styles from './SelectedFilterTag.module.scss';
import { FC } from "react";
import { Filter } from "../../Types/results";
import { getFilterLabel, isEntityFilter, isTagFilter } from "../../Utilities/filterFunctions";
import ExcludeIcon from '../../Icons/Buttons/View & Exclude/Exclude.svg?react';
import CloseIcon from '../../Icons/Buttons/Close/Close.svg?react'

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
    filterDisplay = <div>Text Filter: <span>{filter.value}</span></div>;
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