import { useMemo, FC, useState } from 'react';
import styles from './ResultsFilter.module.scss';
import { Filter, FilterType, GroupedFilters, FilterFamily } from '@/features/ResultFiltering/types/filters';
import { cloneDeep } from 'lodash';
import FacetGroup from '@/features/ResultFiltering/components/FacetGroup/FacetGroup';
import EntitySearch from '@/features/ResultFiltering/components/EntitySearch/EntitySearch';
import * as filtering from '@/features/ResultFiltering/utils/filterFunctions';
import FacetHeading from '@/features/ResultFiltering/components/FacetHeading/FacetHeading';
import { getFilterLabel } from '@/features/ResultFiltering/utils/filterFunctions';
import SidebarTransitionButton from '@/features/Sidebar/components/SidebarTransitionButton/SidebarTransitionButton';
import InteriorPanelContainer from '@/features/Sidebar/components/InteriorPanelContainer/InteriorPanelContainer';

interface ResultsFilterProps {
  activeFilters: Filter[];
  availableFilters: {[key: string]: Filter};
  isPathfinder?: boolean;
  onFilter: (arg0: Filter) => void;
  onClearAll: () => void;
}

const ResultsFilter: FC<ResultsFilterProps> = ({
  activeFilters,
  availableFilters,
  isPathfinder = false,
  onFilter,
  onClearAll = () => console.log("No clear all function specified in ResultsFilter.")
}) => {

  const [activeFilterFamily, setActiveFilterFamily] = useState<FilterFamily | null>(null);

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

  const filterCompare: {[key: string]: (a: [string, Filter], b: [string, Filter]) => number} = {
    // add custom filterCompare functions for a given family here, like so:
    // pt: (a: [string, Filter], b: [string, Filter]) => -(a[1].name.localeCompare(b[1].name))
  };

  return (
    <div className={`${styles.resultsFilter}`}>
      {/* 
      TODO: Add clear all button back in
      <div className={styles.top}>
        <div className={styles.right}>
          <button onClick={()=>onClearAll()} className={styles.clearAll}>Clear All</button>
        </div>
      </div> 
      */}
      <div className={styles.bottom}>
        <SidebarTransitionButton
          handleClick={() => setActiveFilterFamily('txt')}
        >
          <FacetHeading
            activeFilters={activeFilters}
            tagFamily="txt"
            title={getFilterLabel("txt")}
          />
        </SidebarTransitionButton>
        <div>
          {
            groupHasFilters(resultFilters) && !isPathfinder &&
            <>
              <h5 className={styles.heading}>Results</h5>
              {
                Object.keys(resultFilters).map((filterFamily) => {
                  if(!resultFilters[filterFamily as FilterFamily] || !(Object.keys(resultFilters[filterFamily as FilterFamily]!).length > 0) ) 
                    return null;

                  return (
                    <SidebarTransitionButton
                      key={filterFamily}
                      handleClick={() => setActiveFilterFamily(filterFamily as FilterFamily)}
                    >
                      <FacetHeading
                        activeFilters={activeFilters}
                        tagFamily={filterFamily as FilterFamily}
                        title={getFilterLabel(filterFamily as FilterFamily)}
                      />
                    </SidebarTransitionButton>
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
              <h5 className={styles.heading}>Paths</h5>
              {
                Object.keys(pathFilters).map((filterFamily) => {
                  if(!pathFilters[filterFamily as FilterFamily] || !(Object.keys(pathFilters[filterFamily as FilterFamily]!).length > 0) ) 
                    return null;
                  return (
                    <SidebarTransitionButton
                      key={filterFamily}
                      handleClick={() => setActiveFilterFamily(filterFamily as FilterFamily)}
                      className={styles.facetButton}
                    >
                      <FacetHeading
                        activeFilters={activeFilters}
                        tagFamily={filterFamily as FilterFamily}
                        title={getFilterLabel(filterFamily as FilterFamily)}
                      />
                    </SidebarTransitionButton>
                  )
                })
              }
            </>
          }
        </div>
        {
          activeFilterFamily !== null && (
            <InteriorPanelContainer 
              handleBack={() => setActiveFilterFamily(null)}
              backButtonLabel={<FacetHeading
                activeFilters={activeFilters}
                tagFamily={activeFilterFamily as FilterFamily}
                title={getFilterLabel(activeFilterFamily as FilterFamily)}
                includeArrow={false}
              />}
            >
              {
                activeFilterFamily === 'txt'
                ?
                  <EntitySearch
                    activeFilters={activeFilters}
                    className={styles.entitySearch}
                    onFilter={onFilter}
                  />
                :
                  <FacetGroup
                    key={activeFilterFamily}
                    filterFamily={activeFilterFamily as FilterFamily}
                    activeFilters={activeFilters}
                    facetCompare={filterCompare[activeFilterFamily]}
                    groupedFilters={ resultFilters[activeFilterFamily] ? resultFilters : pathFilters}
                    onFilter={onFilter}
                  />
              }
            </InteriorPanelContainer>
          )
        }
      </div>
    </div>
  );
}

export default ResultsFilter;
