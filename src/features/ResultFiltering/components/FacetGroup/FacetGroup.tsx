import { FC, useMemo } from "react";
import { Filter, GroupedFilters, FilterFamily } from "@/features/ResultFiltering/types/filters";
import styles from './FacetGroup.module.scss';
import FacetTag from "@/features/ResultFiltering/components/FacetTag/FacetTag";
import TextInput from "@/features/Core/components/TextInput/TextInput";
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import NoFacetsMarkup from "@/features/ResultFiltering/components/NoFacetsMarkup/NoFacetsMarkup";
import { useSimpleSearch } from '@/features/Core/hooks/simpleSearchHook';
import { getSortedFacets, getTagCaptionMarkup, isSearchableFacetFamily } from "@/features/ResultFiltering/utils/facetGroupUtils";

type FacetGroupProps = {
  filterFamily: FilterFamily;
  activeFilters: Filter[];
  facetCompare: ((a: [string, Filter], b: [string, Filter]) => number) | undefined;
  groupedFilters: GroupedFilters;
  onFilter: (arg0: Filter) => void;
}

const FacetGroup: FC<FacetGroupProps> = ({ filterFamily, activeFilters, facetCompare, groupedFilters, onFilter }) => {
  const { searchTerm: facetSearchTerm, handleSearch: handleFacetSearch } = useSimpleSearch();
  const familyCaptionMarkup = getTagCaptionMarkup(filterFamily);
  const isSearchable = isSearchableFacetFamily(filterFamily);

  // Ensures that selected facets come first
  const sortedFacets = useMemo(() => getSortedFacets(filterFamily, activeFilters, facetCompare, groupedFilters, facetSearchTerm), [filterFamily, activeFilters, facetCompare, groupedFilters, facetSearchTerm]);

  return (
    <div className={styles.facetGroup}>
      {
        familyCaptionMarkup
      }
      {
        isSearchable &&
        <TextInput
          iconLeft={<SearchIcon/>}
          placeholder="Search"
          handleChange={handleFacetSearch}
          className={styles.facetSearchInput}
        />
      }
      {
        <div className={`${styles.section} ${sortedFacets.length > 5 ? "scrollable" : ""}`}>
          {
            sortedFacets.length === 0 
            ? 
              <NoFacetsMarkup filterFamily={filterFamily} facetSearchTerm={facetSearchTerm} />
            :
              sortedFacets.map((tag: [string, Filter]) => {
                return(
                  <FacetTag
                    key={tag[1].id}
                    activeFilters={activeFilters}
                    family={filterFamily}
                    onFilter={onFilter}
                    filterObject={tag}
                  />
                )
              })
            }
        </div>
      }
    </div>
  );
}

export default FacetGroup;
