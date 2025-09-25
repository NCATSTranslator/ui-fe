import { useState, useEffect, useMemo, FC, SetStateAction, Dispatch } from 'react';
import styles from './ResultsFilter.module.scss';
import { Filter, FilterType, GroupedFilters, FilterFamily } from '@/features/ResultFiltering/types/filters';
import { cloneDeep } from 'lodash';
import FacetGroup from '@/features/ResultFiltering/components/FacetGroup/FacetGroup';
import EntitySearch from '@/features/ResultFiltering/components/EntitySearch/EntitySearch';
import Button from '@/features/Core/components/Button/Button';
import FilterIcon from '@/assets/icons/navigation/Filter.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import * as filtering from '@/features/ResultFiltering/utils/filterFunctions';

interface ResultsFilterProps {
  activeFilters: Filter[];
  availableFilters: {[key: string]: Filter};
  isPathfinder?: boolean;
  onFilter: (arg0: Filter) => void;
  onClearAll: () => void;
  setExpanded?: Dispatch<SetStateAction<boolean>>;
}

const ResultsFilter: FC<ResultsFilterProps> = ({
  activeFilters,
  availableFilters,
  isPathfinder = false,
  onFilter,
  onClearAll,
  setExpanded = () => {} }) => {

  // returns a new object with each tag grouped by its type
  const groupFilters = (filters: {[key: string]: Filter}, type: FilterType): GroupedFilters => {
    const newGroupedFilters: GroupedFilters = {};
    for (let family of filtering.getFamiliesByType(type)) {
      newGroupedFilters[family] = {};
    }

    for (let [id, description] of Object.entries(cloneDeep(filters))) {
      if (filtering.getTagType(id) === type) {
        const family = filtering.getTagFamily(id);
        if (newGroupedFilters[family]) {
          newGroupedFilters[family]![id] = description;
        }
      }
    }

    return newGroupedFilters;
  }

  const groupHasFilters = (filterGroup: GroupedFilters): boolean => {
    for (let categoryFilters of Object.values(filterGroup)) {
      if (categoryFilters && Object.keys(categoryFilters).length > 0) return true;
    }

    return false;
  }

  const resultFilters = useMemo(() => groupFilters(availableFilters, filtering.CONSTANTS.RESULT), [availableFilters]);
  const pathFilters = useMemo(() => groupFilters(availableFilters, filtering.CONSTANTS.PATH), [availableFilters]);

  onClearAll = (!onClearAll) ? () => console.log("No clear all function specified in ResultsFilter.") : onClearAll;
  const filterCompare: {[key: string]: (a: [string, Filter], b: [string, Filter]) => number} = {
    // add custom filterCompare functions for a given family here, like so:
    // pt: (a: [string, Filter], b: [string, Filter]) => -(a[1].name.localeCompare(b[1].name))
  };

  return (
    <div className={`${styles.resultsFilter}`}>
      <div className={styles.top}>
        <div className={styles.right}>
          <button onClick={()=>onClearAll()} className={styles.clearAll}>Clear All</button>
        </div>
      </div>
      <div className={styles.bottom}>
        <EntitySearch
          activeFilters={activeFilters}
          className={styles.entitySearch}
          onFilter={onFilter}
        />
        <div>
          {
            groupHasFilters(resultFilters) && !isPathfinder &&
            <>
              <h5 className={styles.typeHeading}> Results </h5>
              {
                Object.keys(resultFilters).map((filterFamily) => {
                  return (
                    <FacetGroup
                      key={filterFamily}
                      filterFamily={filterFamily as FilterFamily}
                      activeFilters={activeFilters}
                      facetCompare={filterCompare[filterFamily]}
                      groupedFilters={resultFilters}
                      onFilter={onFilter}
                    />
                  )
                })
              }
            </>
          }
        </div>
        <div>
          {
            groupHasFilters(pathFilters) &&
            <>
              <h5 className={styles.typeHeading}> Paths </h5>
              {
                Object.keys(pathFilters).map((tagFamily) => {
                  return (
                    <FacetGroup
                      key={tagFamily}
                      filterFamily={tagFamily as FilterFamily}
                      activeFilters={activeFilters}
                      facetCompare={filterCompare[tagFamily]}
                      groupedFilters={pathFilters}
                      onFilter={onFilter}
                    />
                  )
                })
              }
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default ResultsFilter;
