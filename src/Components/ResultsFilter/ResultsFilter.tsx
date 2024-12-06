import { useState, useEffect, useMemo, FC } from 'react';
import styles from './ResultsFilter.module.scss';
import { Filter, GroupedFilters } from '../../Types/results';
import { cloneDeep } from 'lodash';
import FacetGroup from '../FacetGroup/FacetGroup';
import EntitySearch from '../EntitySearch/EntitySearch';
import Button from '../Core/Button';
import FilterIcon from '../../Icons/Navigation/Filter.svg?react';
import CloseIcon from '../../Icons/Buttons/Close/Close.svg?react';
import * as filtering from '../../Utilities/filterFunctions';

interface ResultsFilterProps {
  activeFilters: Filter[];
  onFilter: (arg0: Filter) => void;
  onClearAll: () => void;
  expanded?: boolean;
  isPathfinder?: boolean;
  setExpanded?: (arg0:boolean) => void
  availableFilters: {[key: string]: Filter};
}

const ResultsFilter: FC<ResultsFilterProps> = ({activeFilters, onFilter, onClearAll, expanded = false, isPathfinder = false, setExpanded = (arg0: boolean)=>{}, availableFilters}) => {

  const [isExpanded, setIsExpanded] = useState(expanded);
  const toggleIsExpanded = () => {
    setIsExpanded(prev => {
      setExpanded(!prev);
      return !prev;
    });
  }

  // returns a new object with each tag grouped by its type
  const groupFilters = (filters: {[key: string]: Filter}, type: string): GroupedFilters => {
    const newGroupedFilters: GroupedFilters = {};
    for (let family of filtering.getFamiliesByType(type)) {
      newGroupedFilters[family] = {};
    }

    for (let [id, description] of Object.entries(cloneDeep(filters))) {
      if (filtering.getTagType(id) === type) {
        const family = filtering.getTagFamily(id);
        newGroupedFilters[family][id] = description;
      }
    }

    return newGroupedFilters;
  }

  const groupHasFilters = (filterGroup: GroupedFilters): boolean => {
    for (let categoryFilters of Object.values(filterGroup)) {
      if (Object.keys(categoryFilters).length > 0) return true;
    }

    return false;
  }

  const resultFilters = useMemo(() => groupFilters(availableFilters, filtering.CONSTANTS.RESULT), [availableFilters]);
  const pathFilters = useMemo(() => groupFilters(availableFilters, filtering.CONSTANTS.PATH), [availableFilters]);

  onClearAll = (!onClearAll) ? () => console.log("No clear all function specified in ResultsFilter.") : onClearAll;
  const filterCompare: {[key: string]: (a: [string, Filter], b: [string, Filter]) => number} = {
    pt: (a: [string, Filter], b: [string, Filter]) => -(a[1].name.localeCompare(b[1].name))
  };

  useEffect(() => { 
    setIsExpanded(expanded); 
  }, [expanded]);

  return (
    <div className={`${styles.resultsFilter} ${isExpanded ? styles.expanded : styles.collapsed}`} onClick={()=>(!isExpanded) ? toggleIsExpanded() : ()=>{}}>
      <div className={styles.top}>
        <p className={styles.heading} onClick={()=>(isExpanded) ? toggleIsExpanded() : ()=>{}} ><FilterIcon/><span>Filters</span></p>
        <div className={styles.right}>
          <button onClick={()=>onClearAll()} className={styles.clearAll}>Clear All</button>
          <Button className={styles.closeButton} iconOnly><CloseIcon onClick={toggleIsExpanded}/></Button>
        </div>
      </div>
      <div className={styles.bottom}>
        <EntitySearch
          onFilter={onFilter}
          className={styles.entitySearch}
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
                      filterFamily={filterFamily}
                      activeFilters={activeFilters}
                      facetCompare={filterCompare[filterFamily]}
                      groupedFilters={resultFilters}
                      availableFilters={availableFilters}
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
                      filterFamily={tagFamily}
                      activeFilters={activeFilters}
                      facetCompare={filterCompare[tagFamily]}
                      groupedFilters={pathFilters}
                      availableFilters={availableFilters}
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
