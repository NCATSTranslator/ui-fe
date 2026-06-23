import { ReactNode } from 'react';
import { pivotSort } from '@/features/Core/utils/sortingFunctions';
import * as filtering from "@/features/ResultFiltering/utils/filterFunctions";
import styles from '@/features/ResultFiltering/components/FacetGroup/FacetGroup.module.scss';
import { Filter, FilterFamily, GroupedFilters } from '@/features/ResultFiltering/types/filters';

// Tag captions for each facet group
const tagCaptions: Record<string, string> = {
  cc: "Filter on different categories of chemicals.",
  pc: "Include or exclude paths from results that contain a particular type of object",
  role: "Include or exclude results according to their biological or chemical role or application",
  ara: "Include or exclude reasoning agents used to return results",
  di: "Include or exclude results based on whether they have been tested in clinical trials for treatment of the indicated disease",
  pt: "Include or exclude paths from results that contain a set number of connections",
  otc: "Include or exclude results in various development stages and with desired availability",
  tdl: "Include or exclude results that are part of the selected target development level",
  sv: "Include or exclude results based on whether they have bookmarks or notes added to them",
  ev: "Include or exclude paths from results based on the types of evidence supporting the path",
};

/*
 * Returns the caption for the facet group based on the tag family
 * @param {string} tagFamily - The tag family of the facet group
 * @returns {ReactNode | null} The caption for the facet group
 */
export const getTagCaptionMarkup = (tagFamily: string): ReactNode | null => {
  const caption = tagCaptions[tagFamily];
  return caption ? <p className={styles.caption}>{caption}</p> : null;
};

// Helper functions for sorting the facets
const isOther = (name: string): boolean => name.toLowerCase() === 'other';
const compareNames = (nameA: string, nameB: string): number => {
  if (isOther(nameA) && isOther(nameB)) return 0;
  if (isOther(nameA)) return 1;
  if (isOther(nameB)) return -1;
  return nameA.localeCompare(nameB);
};
const defaultCompare = (a: [string, Filter], b: [string, Filter]) => {
  const nameA = a[1].name.toLowerCase();
  const nameB = b[1].name.toLowerCase();

  return compareNames(nameA, nameB);
};

/*
 * Returns the sorted facets for the facet group based on the tag family
 * @param {FilterFamily} family - The tag family of the facet group
 * @param {Filter[]} activeFilters - The active filters for the facet group
 * @param {((a: [string, Filter], b: [string, Filter]) => number) | undefined} facetCompare - The compare function for the facet group
 * @param {GroupedFilters} groupedFilters - The grouped filters for the facet group
 * @param {string} searchTerm - The search term for the facet group
 * @returns {[string, Filter][]} The sorted facets for the facet group
 */
export const getSortedFacets = (
  family: FilterFamily,
  activeFilters: Filter[],
  facetCompare: ((a: [string, Filter], b: [string, Filter]) => number) | undefined,
  groupedFilters: GroupedFilters,
  searchTerm: string): [string, Filter][] => {

  const selectedFacetSet = activeFilters.reduce<Record<string, null>>((acc, filter) => {
    if (filtering.hasFilterFamily(filter, family) && !!filter.id) {
      acc[filter.id] = null;
    }

    return acc;
  }, {});

  const familyFilters = groupedFilters[family];
  if (!familyFilters) {
    return [];
  }

  let sortedFacets = Object.entries(familyFilters).sort(defaultCompare);

  // When there is a custom facet compare for this facet family, we want to sort selected and
  // unselected facets independently while preserving that selected facets come first
  if (facetCompare) {
    const pivot = Object.keys(selectedFacetSet).length
    sortedFacets = pivotSort(sortedFacets, pivot, facetCompare);
  }

  if(!!searchTerm)
    return sortedFacets.filter(facet => facet[1].name.toLowerCase().includes(searchTerm.toLowerCase()));
  else
    return sortedFacets;
}