import { useMemo, FC, ReactNode, useState } from 'react';
import styles from './ResultsFilter.module.scss';
import { Filter, FilterType, GroupedFilters, FilterFamily } from '@/features/ResultFiltering/types/filters';
import { cloneDeep } from 'lodash';
import FacetGroup from '@/features/ResultFiltering/components/FacetGroup/FacetGroup';
import EntitySearch from '@/features/ResultFiltering/components/EntitySearch/EntitySearch';
import * as filtering from '@/features/ResultFiltering/utils/filterFunctions';
import Button from '@/features/Core/components/Button/Button';
import FacetHeading from '@/features/ResultFiltering/components/FacetHeading/FacetHeading';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import { getFilterLabel } from '@/features/ResultFiltering/utils/filterFunctions';
import ChevLeft from "@/assets/icons/directional/Chevron/Chevron Left.svg?react";

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
  onClearAll
}) => {

  const [activeFilterFamily, setActiveFilterFamily] = useState<FilterFamily | null>(null);
  const handleSetActiveFilterFamily = (family: FilterFamily | null) => {
    setActiveFilterFamily(family);
  }

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

  const getTagHeadingMarkup = (tagFamily: FilterFamily, activeFilters: Filter[]): ReactNode | null => {
    let headingToReturn;
    const title = getFilterLabel(tagFamily);
    const commonProps = {
      activeFilters: activeFilters,
      tagFamily: tagFamily,
      title: title,
    }
    switch(tagFamily) {
      case 'cc':
        headingToReturn =
          <FacetHeading {...commonProps}>
            <p className={styles.tooltipParagraph}>Drug is a substance intended for use in the diagnosis, cure, mitigation, treatment, or the prevention of a disease.</p>
            <p className={styles.tooltipParagraph}>Phase 1-3 Drugs are chemicals that are part of a clinical trial and do not yet have FDA approval.</p>
            <p className={styles.tooltipParagraph}>Other includes all other chemicals.</p>
          </FacetHeading>;
        break;
      case 'pc':
        headingToReturn =
          <FacetHeading {...commonProps}>
            <span className={styles.fdaSpan}>Click <a onClick={(e)=>{e.stopPropagation();}} href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9372416/" target="_blank" rel='noreferrer' className={styles.tooltipLink}> here <ExternalLink/></a> to learn more about the Biolink Model.</span>
          </FacetHeading>;
        break;
      case 'role':
        headingToReturn =
          <FacetHeading {...commonProps}>
            <span className={styles.roleSpan}>The Chemical Entities of Biological Interest Role Classification (ChEBI role ontology, <a onClick={(e)=>{e.stopPropagation();}} href="https://www.ebi.ac.uk/chebi/chebiOntology.do?chebiId=CHEBI:50906&treeView=true#vizualisation" target="_blank" rel="noreferrer" className={styles.tooltipLink}>click to learn more <ExternalLink/></a>) is a chemical classification that categorizes chemicals according to their biological role, chemical role or application.</span>
          </FacetHeading>;
        break;
      default:
        headingToReturn = <FacetHeading {...commonProps} />
    }
    return headingToReturn;
  }

  return (
    <div className={`${styles.resultsFilter}`}>
      {/* <div className={styles.top}>
        <div className={styles.right}>
          <button onClick={()=>onClearAll()} className={styles.clearAll}>Clear All</button>
        </div>
      </div> */}
      <div className={styles.bottom}>
        <Button
          handleClick={()=>handleSetActiveFilterFamily('txt')}
          className={styles.facetButton}
        >
          {getTagHeadingMarkup('txt', activeFilters)}
        </Button>
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
                    <Button
                      key={filterFamily}
                      handleClick={()=>handleSetActiveFilterFamily(filterFamily as FilterFamily)}
                      className={styles.facetButton}
                    >
                      {getTagHeadingMarkup(filterFamily as FilterFamily, activeFilters)}
                    </Button>
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
                    <Button
                      key={filterFamily}
                      handleClick={()=>handleSetActiveFilterFamily(filterFamily as FilterFamily)}
                      className={styles.facetButton}
                    >
                      {getTagHeadingMarkup(filterFamily as FilterFamily, activeFilters)}
                    </Button>
                  )
                })
              }
            </>
          }
        </div>
        {
          activeFilterFamily !== null && (
            <div className={styles.activeFilterFamily}>
              <div className={styles.top}>
                <Button
                  handleClick={()=>handleSetActiveFilterFamily(null)}
                  className={`${styles.facetButton} ${styles.backButton}`}
                  iconLeft={<ChevLeft />}
                >
                  {getFilterLabel(activeFilterFamily as FilterFamily)}
                </Button>
              </div>
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
            </div>
          )
        }
      </div>
    </div>
  );
}

export default ResultsFilter;
