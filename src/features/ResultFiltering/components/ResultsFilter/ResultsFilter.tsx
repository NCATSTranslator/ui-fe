import { useMemo, FC, useState } from 'react';
import styles from './ResultsFilter.module.scss';
import { Filter, FilterFamily } from '@/features/ResultFiltering/types/filters';
import FacetGroup from '@/features/ResultFiltering/components/FacetGroup/FacetGroup';
import EntitySearch from '@/features/ResultFiltering/components/EntitySearch/EntitySearch';
import FacetHeading from '@/features/ResultFiltering/components/FacetHeading/FacetHeading';
import { getFilterLabel, groupFilters, groupHasFilters, FILTERING_CONSTANTS } from '@/features/ResultFiltering/utils/filterFunctions';
import SidebarTransitionButton from '@/features/Sidebar/components/SidebarTransitionButton/SidebarTransitionButton';
import InteriorPanelContainer from '@/features/Sidebar/components/InteriorPanelContainer/InteriorPanelContainer';

interface ResultsFilterProps {
  activeFilters: Filter[];
  availableFilters: {[key: string]: Filter};
  isPathfinder?: boolean;
  onFilter: (arg0: Filter) => void;
  onClearAll: () => void;
}

const filterCompare: {[key: string]: (a: [string, Filter], b: [string, Filter]) => number} = {
  // add custom filterCompare functions for a given family here, like so:
  // pt: (a: [string, Filter], b: [string, Filter]) => -(a[1].name.localeCompare(b[1].name))
};

const ResultsFilter: FC<ResultsFilterProps> = ({
  activeFilters,
  availableFilters,
  isPathfinder = false,
  onFilter,
  onClearAll = () => console.log("No clear all function specified in ResultsFilter.")
}) => {

  const [activeFilterFamily, setActiveFilterFamily] = useState<FilterFamily | null>(null);

  const resultFilters = useMemo(() => groupFilters(availableFilters, FILTERING_CONSTANTS.RESULT), [availableFilters]);
  const pathFilters = useMemo(() => groupFilters(availableFilters, FILTERING_CONSTANTS.PATH), [availableFilters]);

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
              <SidebarTransitionButton
                handleClick={() => setActiveFilterFamily('sv')}
              >
                <FacetHeading
                  activeFilters={activeFilters}
                  tagFamily="sv"
                  title={getFilterLabel("sv")}
                />
              </SidebarTransitionButton>
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
