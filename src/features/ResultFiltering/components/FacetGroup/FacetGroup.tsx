import { FC, useState, useMemo, useEffect } from "react";
import { Filter, GroupedFilters, FilterFamily } from "@/features/ResultFiltering/types/filters";
import styles from './FacetGroup.module.scss';
import FacetTag from "@/features/ResultFiltering/components/FacetTag/FacetTag";
import TextInput from "@/features/Core/components/TextInput/TextInput";
import debounce from "lodash/debounce";
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import NoFacetsMarkup from "@/features/ResultFiltering/components/NoFacetsMarkup/NoFacetsMarkup";
import { getSortedFacets, getTagCaptionMarkup } from "@/features/ResultFiltering/utils/facetGroupUtils";

type FacetGroupProps = {
  filterFamily: FilterFamily;
  activeFilters: Filter[];
  facetCompare: ((a: [string, Filter], b: [string, Filter]) => number) | undefined;
  groupedFilters: GroupedFilters;
  onFilter: (arg0: Filter) => void;
}

const FacetGroup: FC<FacetGroupProps> = ({ filterFamily, activeFilters, facetCompare, groupedFilters, onFilter }) => {

  const familyCaptionMarkup = getTagCaptionMarkup(filterFamily);
  const [chemicalCategorySearchTerm, setChemicalCategorySearchTerm] = useState("");

  // Ensures that selected facets come first
  let sortedFacets = useMemo(() => getSortedFacets(filterFamily, activeFilters, facetCompare, groupedFilters, chemicalCategorySearchTerm), [filterFamily, activeFilters, facetCompare, groupedFilters, chemicalCategorySearchTerm]);

  const handleChemicalCategorySearch = useMemo(() =>debounce((value: string) => { setChemicalCategorySearchTerm(value) }, 500),[]);

  // Cancels the debounce function when the component unmounts
  useEffect(() => {
    return () => handleChemicalCategorySearch.cancel();
  }, [handleChemicalCategorySearch]);

  return (
    <div className={styles.facetGroup}>
      {
        familyCaptionMarkup
      }
      {
        filterFamily === "role" &&
        <TextInput
          iconLeft={<SearchIcon/>}
          placeholder="Search"
          handleChange={(val)=> handleChemicalCategorySearch(val)}
          className={styles.roleFilter}
        />
      }
      {
        <div className={`${styles.section} ${sortedFacets.length > 5 ? "scrollable" : ""}`}>
          {
            sortedFacets.length === 0 
            ? 
              <NoFacetsMarkup filterFamily={filterFamily} chemicalCategorySearchTerm={chemicalCategorySearchTerm} />
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
