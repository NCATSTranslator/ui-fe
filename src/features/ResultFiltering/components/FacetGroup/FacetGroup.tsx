import { FC, useState, useMemo, ReactNode } from "react";
import { Filter, GroupedFilters, FilterFamily } from "@/features/ResultFiltering/types/filters";
import styles from './FacetGroup.module.scss';
import { pivotSort } from '@/features/Common/utils/sortingFunctions';
import * as filtering from "@/features/ResultFiltering/utils/filterFunctions";
import FacetTag from "@/features/ResultFiltering/components/FacetTag/FacetTag";
import TextInput from "@/features/Core/components/TextInput/TextInput";
import { debounce } from "lodash";
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';

const getRoleCaption = (): ReactNode => {
  return (
    <p className={styles.caption}>Include or exclude results according to their biological or chemical role or application</p>
  )
}
const getChemicalTypeCaption = (): ReactNode => {
  return(
    <p className={styles.caption}>Filter on different categories of chemicals.</p>
  )
}
const getObjectTypeCaption = (): ReactNode => {
  return(
    <p className={styles.caption}>Include or exclude paths from results that contain a particular type of object</p>
  )
}
const getAraCaption = (): ReactNode => {
  return(
    <p className={styles.caption}>Include or exclude reasoning agents used to return results</p>
  )
}
const getDrugIndicationsCaption = (): ReactNode => {
  return(
    <p className={styles.caption}>Include or exclude results based on whether they have been tested in clinical trials for treatment of the indicated disease</p>
  )
}
const getPathTypeCaption = (): ReactNode => {
  return(
    <p className={styles.caption}>Include or exclude paths from results that contain a set number of connections</p>
  )
}
const getOtcCaption = (): ReactNode => {
  return(
    <p className={styles.caption}>Include or exclude results in various development stages and with desired availability</p>
  )
}

const getTdlCaption = (): ReactNode => {
  return(
    <p className={styles.caption}>Include or exclude results that are part of the selected target development level</p>
  )
}

const getBookmarkNotesCaption = (): ReactNode => {
  return(
    <p className={styles.caption}>Include or exclude results based on whether they have bookmarks or notes added to them</p>
  )
}

const getPathEvidenceCaption = (): ReactNode => {
  return(
    <p className={styles.caption}>Include or exclude paths from results based on the types of evidence supporting the path</p>
  )
}

const getTagCaptionMarkup = (tagFamily: string): ReactNode | null => {
  let captionToReturn;
  switch(tagFamily) {
    case 'cc':
      captionToReturn = getChemicalTypeCaption();
      break;
    case 'pc':
      captionToReturn = getObjectTypeCaption();
      break;
    case 'role':
      captionToReturn = getRoleCaption();
      break;
    case 'ara':
      captionToReturn = getAraCaption();
      break;
    case 'di':
      captionToReturn = getDrugIndicationsCaption();
      break;
    case 'pt':
      captionToReturn = getPathTypeCaption();
      break;
    case 'otc':
      captionToReturn = getOtcCaption();
      break;
    case 'tdl':
      captionToReturn = getTdlCaption();
      break;
    case 'sv':
      captionToReturn = getBookmarkNotesCaption();
      break;
    case 'ev':
      captionToReturn = getPathEvidenceCaption();
      break;
    default:
      captionToReturn = null;
  }
  return captionToReturn;
}

const getSortedFacets = (
  family: FilterFamily,
  activeFilters: Filter[],
  facetCompare: ((a: [string, Filter], b: [string, Filter]) => number) | undefined,
  groupedFilters: GroupedFilters,
  searchTerm: string) => {

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

  console.log('grouped filters: ', groupedFilters, Object.keys(groupedFilters[filterFamily]!).length > 0);
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
        <div className={`${styles.section} ${Object.keys(sortedFacets).length > 5 ? styles['role'] + ' scrollable' : ''}`}>
          {
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
