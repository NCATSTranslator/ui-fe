import { useState, useEffect, useMemo, FC } from 'react';
import styles from './ResultsFilter.module.scss';
import { Filter, Tag, GroupedTags } from '../../Types/results';
import { cloneDeep } from 'lodash';
import FacetGroup from '../FacetGroup/FacetGroup';
import EntitySearch from '../EntitySearch/EntitySearch';
import Button from '../Core/Button';
import FilterIcon from '../../Icons/Navigation/Filter.svg?react';
import CloseIcon from '../../Icons/Buttons/Close/Close.svg?react';

interface ResultsFilterProps {
  onClearAll: () => void;
  onClearTag: () => void;
  onFilter: (arg0: Tag) => void;
  activeFilters: Filter[];
  availableTags: {[key: string]: Tag};
  expanded?: boolean;
  setExpanded?: (arg0:boolean) => void
}

const ResultsFilter: FC<ResultsFilterProps> = ({activeFilters, onFilter, onClearAll, expanded = false, setExpanded = (arg0: boolean)=>{}, availableTags}) => {

  const [isExpanded, setIsExpanded] = useState(expanded);
  const toggleIsExpanded = () => {
    setIsExpanded(prev => {
      setExpanded(!prev);
      return !prev;
    });
  }

  // returns a new object with each tag grouped by its type
  const groupAvailableTags = (tags: {[key: string]: Tag}): GroupedTags => {
    let clonedTags = cloneDeep(tags);
    let roleTags = Object.fromEntries(Object.entries(clonedTags).filter(([key]) => key.includes('role:')));
    let chemicalTypeTags = Object.fromEntries(Object.entries(clonedTags).filter(([key]) => key.includes('cc:')));
    let nodeTypeTags = Object.fromEntries(Object.entries(clonedTags).filter(([key]) => key.includes('pc:')));
    let araTags = Object.fromEntries(Object.entries(clonedTags).filter(([key]) => key.includes('ara:')));
    let diTags = Object.fromEntries(Object.entries(clonedTags).filter(([key]) => key.includes('di:')));
    let pathTypeTags = Object.fromEntries(Object.entries(clonedTags).filter(([key]) => key.includes('pt:')));
    // The ordering of newGroupedTags determines the order of the facets in the UI
    const newGroupedTags: GroupedTags = {
      cc: chemicalTypeTags,
      di: diTags,
      pc: nodeTypeTags,
      pt: pathTypeTags,
      role: roleTags,
      ara: araTags
    };

    return newGroupedTags;
  }

  const groupedTags = useMemo(() => groupAvailableTags(availableTags), [availableTags]);

  onClearAll = (!onClearAll) ? () => console.log("No clear all function specified in ResultsFilter.") : onClearAll;
  const facetCompares: {[key: string]: (a: [string, Tag], b: [string, Tag]) => number} = {
    pt: (a: [string, Tag], b: [string, Tag]) => -(a[1].name.localeCompare(b[1].name))
  };

  useEffect(() => {
    setIsExpanded(expanded);
  }, [expanded]);

  return (
    <div className={`${styles.resultsFilter} ${isExpanded ? styles.expanded : styles.collapsed}`}>
      <div className={styles.top}>
        <p className={styles.heading} onClick={toggleIsExpanded} ><FilterIcon/><span>Filters</span></p>
        <Button className={styles.closeButton} iconOnly><CloseIcon onClick={toggleIsExpanded}/></Button>
      </div>
      <div className={styles.bottom}>
        <EntitySearch
          onFilter={onFilter}
          className={styles.entitySearch}
        />
        <div>
          {
            groupedTags &&
            Object.keys(groupedTags).map((tagType) => {
              return (
                <FacetGroup
                  tagType={tagType}
                  activeFilters={activeFilters}
                  facetCompare={facetCompares[tagType]}
                  groupedTags={groupedTags}
                  availableTags={availableTags}
                  onFilter={onFilter}
                />
              )
            })
          }
        </div>
        <button onClick={()=>onClearAll()} className={styles.clearAll}>Clear All</button>
      </div>
    </div>
  );
}

export default ResultsFilter;
