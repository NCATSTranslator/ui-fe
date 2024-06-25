import { useMemo, FC } from 'react';
import styles from './ResultsFilter.module.scss';
import { Filter, Tag, GroupedTags } from '../../Types/results';
import { cloneDeep } from 'lodash';
import FacetGroup from '../FacetGroup/FacetGroup';
import EntitySearch from '../EntitySearch/EntitySearch';

interface ResultsFilterProps {
  onClearAll: () => void;
  onClearTag: () => void;
  onFilter: (arg0: Tag) => void;
  activeFilters: Filter[];
  availableTags: {[key: string]: Tag};
}

const ResultsFilter: FC<ResultsFilterProps> = ({activeFilters, onFilter, onClearAll, onClearTag, availableTags}) => {

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



  return (
    <div className={styles.resultsFilter}>
      <div className={styles.bottom}>
        <p className={styles.heading}>Filters</p>
        <EntitySearch
          onFilter={onFilter}
        />
        <div>
          {
            groupedTags &&
            Object.keys(groupedTags).map((tagType) => {
              return (
                <FacetGroup
                  tagType={tagType}
                  activeFilters={activeFilters}
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
