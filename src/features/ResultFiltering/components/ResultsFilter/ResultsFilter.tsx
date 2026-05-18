import { useMemo, FC, useState, useCallback } from 'react';
import styles from './ResultsFilter.module.scss';
import { Filter, FilterFamily, GroupedFilters } from '@/features/ResultFiltering/types/filters';
import FacetGroup from '@/features/ResultFiltering/components/FacetGroup/FacetGroup';
import EntitySearch from '@/features/ResultFiltering/components/EntitySearch/EntitySearch';
import FacetHeading from '@/features/ResultFiltering/components/FacetHeading/FacetHeading';
import { getFilterLabel, groupFilters, groupHasFilters, FILTERING_CONSTANTS, handleClearGroup, groupHasActiveFilters } from '@/features/ResultFiltering/utils/filterFunctions';
import SidebarTransitionButton from '@/features/Sidebar/components/SidebarTransitionButton/SidebarTransitionButton';
import InteriorPanelContainer from '@/features/Sidebar/components/InteriorPanelContainer/InteriorPanelContainer';
import Button from '@/features/Core/components/Button/Button';

interface ResultsFilterProps {
  activeFilters: Filter[];
  availableFilters: {[key: string]: Filter};
  isPathfinder?: boolean;
  onFilter: (arg0: Filter) => void;
  onSetFilters: (filters: Filter[]) => void;
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
  onSetFilters,
}) => {

  const [activeFilterFamily, setActiveFilterFamily] = useState<FilterFamily | null>(null);
  const resultFilters = useMemo(() => groupFilters(availableFilters, FILTERING_CONSTANTS.RESULT), [availableFilters]);
  const resultFiltersActive = useMemo(() => groupHasActiveFilters(resultFilters, activeFilters), [resultFilters, activeFilters]);
  const pathFilters = useMemo(() => groupFilters(availableFilters, FILTERING_CONSTANTS.PATH), [availableFilters]);
  const pathFiltersActive = useMemo(() => groupHasActiveFilters(pathFilters, activeFilters), [pathFilters, activeFilters]);

  const clearGroup = useCallback((group: GroupedFilters) => {
    handleClearGroup(group, activeFilters, onSetFilters);
  }, [activeFilters, onSetFilters]);

  return (
    <div className={`${styles.resultsFilter}`}>
      <div className={styles.bottom}>
        <FacetHeading
          activeFilters={activeFilters}
          tagFamily="str"
          title={getFilterLabel("str")}
          includeArrow={false}
          className={styles.entitySearchHeading}
          onSetFilters={onSetFilters}
        />
        <EntitySearch
          activeFilters={activeFilters}
          className={styles.entitySearch}
          onFilter={onFilter}
        />
        <div>
          {
            groupHasFilters(resultFilters) && !isPathfinder &&
            <>
              <h5 className={styles.heading}>
                Results
                {
                  resultFiltersActive &&
                  <Button className={styles.clearButton} variant="textOnly" handleClick={() => clearGroup(resultFilters)} smallFont>Clear</Button>
                }
              </h5>
              <SidebarTransitionButton
                handleClick={() => setActiveFilterFamily('sv')}
              >
                <FacetHeading
                  activeFilters={activeFilters}
                  tagFamily="sv"
                  title={getFilterLabel("sv")}
                  onSetFilters={onSetFilters}
                />
              </SidebarTransitionButton>
              {
                Object.keys(resultFilters).map((filterFamily) => {
                  const family = resultFilters[filterFamily as FilterFamily];
                  if(!family || Object.keys(family).length <= 0) 
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
                        onSetFilters={onSetFilters}
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
              <h5 className={styles.heading}>
                Paths
                {
                  pathFiltersActive &&
                  <Button className={styles.clearButton} variant="textOnly" handleClick={() => clearGroup(pathFilters)} smallFont>Clear</Button>
                }
              </h5>
              {
                Object.keys(pathFilters).map((filterFamily) => {
                  const family = pathFilters[filterFamily as FilterFamily];
                  if(!family || Object.keys(family).length <= 0) 
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
                        onSetFilters={onSetFilters}
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
                onSetFilters={onSetFilters}
              />}
            >
              {
                activeFilterFamily === 'str'
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
