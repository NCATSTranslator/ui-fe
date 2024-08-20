import { useState, useEffect, useMemo, FC } from 'react';
import styles from './ResultsFilter.module.scss';
import { Filter, Tag, GroupedTags } from '../../Types/results';
import { cloneDeep } from 'lodash';
import FacetGroup from '../FacetGroup/FacetGroup';
import EntitySearch from '../EntitySearch/EntitySearch';
import Button from '../Core/Button';
import FilterIcon from '../../Icons/Navigation/Filter.svg?react';
import CloseIcon from '../../Icons/Buttons/Close/Close.svg?react';
import * as filtering from '../../Utilities/filterFunctions';

interface ResultsFilterProps {
  activeFilters: Filter[];
  onFilter: (arg0: Tag) => void;
  onClearAll: () => void;
  expanded?: boolean;
  setExpanded?: (arg0:boolean) => void
  availableTags: {[key: string]: Tag};
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
  const groupTags = (tags: {[key: string]: Tag}, type: string): GroupedTags => {
    const newGroupedTags: GroupedTags = {};
    for (let family of filtering.getFamiliesByType(type)) {
      newGroupedTags[family] = {};
    }

    for (let [id, description] of Object.entries(cloneDeep(tags))) {
      if (filtering.getTagType(id) === type) {
        const family = filtering.getTagFamily(id);
        newGroupedTags[family][id] = description;
      }
    }

    return newGroupedTags;
  }

  const groupHasTags = (tagGroup: GroupedTags): boolean => {
    for (let categoryTags of Object.values(tagGroup)) {
      if (Object.keys(categoryTags).length > 0) return true;
    }

    return false;
  }

  const resultTags = useMemo(() => groupTags(availableTags, filtering.CONSTANTS.RESULT),
                             [availableTags]);
  const pathTags = useMemo(() => groupTags(availableTags, filtering.CONSTANTS.PATH),
                           [availableTags]);

  onClearAll = (!onClearAll) ? () => console.log("No clear all function specified in ResultsFilter.") : onClearAll;
  const filterCompare: {[key: string]: (a: [string, Tag], b: [string, Tag]) => number} = {
    pt: (a: [string, Tag], b: [string, Tag]) => -(a[1].name.localeCompare(b[1].name))
  };

  useEffect(() => { setIsExpanded(expanded); },
            [expanded]);

  return (
    <div className={`${styles.resultsFilter} ${isExpanded ? styles.expanded : styles.collapsed}`}>
      <div className={styles.top}>
        <p className={styles.heading} onClick={toggleIsExpanded} ><FilterIcon/><span>Filters</span></p>
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
            groupHasTags(resultTags) &&
            <>
              <h5 className={styles.typeHeading}> Result Filters </h5>
              {
                Object.keys(resultTags).map((tagFamily) => {
                  return (
                    <FacetGroup
                      tagFamily={tagFamily}
                      activeFilters={activeFilters}
                      facetCompare={filterCompare[tagFamily]}
                      groupedTags={resultTags}
                      availableTags={availableTags}
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
            groupHasTags(pathTags) &&
            <>
              <h5 className={styles.typeHeading}> Path Filters </h5>
              {
                Object.keys(pathTags).map((tagFamily) => {
                  return (
                    <FacetGroup
                      tagFamily={tagFamily}
                      activeFilters={activeFilters}
                      facetCompare={filterCompare[tagFamily]}
                      groupedTags={pathTags}
                      availableTags={availableTags}
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
