import { FC, useState, useEffect, Dispatch, SetStateAction, useMemo } from "react";
import { Filter, GroupedFilters } from "../../Types/results";
import styles from './FacetGroup.module.scss';
import AnimateHeight from "react-animate-height";
import ExternalLink from '../../Icons/Buttons/External Link.svg?react';
import { pivotSort } from '../../Utilities/sortingFunctions';
import FacetHeading from "../FacetHeading/FacetHeading";
import * as filtering from "../../Utilities/filterFunctions";
import FacetTag from "../FacetTag/FacetTag";

const getRoleCaption = (): JSX.Element => {
  return (
    <p className={styles.caption}>Show only results that match a particular chemical role.</p>
  )
}
const getChemicalTypeCaption = (): JSX.Element => {
  return(
    <p className={styles.caption}>Filter on different categories of chemicals.</p>
  )
}
const getObjectTypeCaption = (): JSX.Element => {
  return(
    <p className={styles.caption}>Show only results that include an object of a particular type (Drug, Chemical Entity, Small Molecule, etc.)</p>
  )
}
const getAraCaption = (): JSX.Element => {
  return(
    <p className={styles.caption}>Filter on specific reasoning agents used to calculate the results.</p>
  )
}
const getDrugIndicationsCaption = (): JSX.Element => {
  return(
    <p className={styles.caption}>Filter on if the drug is indicated for the given disease.</p>
  )
}
const getPathTypeCaption = (): JSX.Element => {
  return(
    <p className={styles.caption}>Filter by path type (lookup or inferred) and/or by number of connections.</p>
  )
}
const getOtcCaption = (): JSX.Element => {
  return(
    <p className={styles.caption}>Show only results that meet the selected availability.</p>
  )
}

const getTagHeadingMarkup = (tagFamily: string, activeFilters: Filter[]): JSX.Element | null => {
  let headingToReturn;
  switch(tagFamily) {
    case 'cc':
      headingToReturn =
        <FacetHeading tagFamily={tagFamily} activeFilters={activeFilters} title="Chemical Categories">
          <p className={styles.tooltipParagraph}>Drug is a substance intended for use in the diagnosis, cure, mitigation, treatment, or the prevention of a disease.</p>
          <p className={styles.tooltipParagraph}>Phase 1-3 Drugs are chemicals that are part of a clinical trial and do not yet have FDA approval.</p>
          <p className={styles.tooltipParagraph}>Other includes all other chemicals.</p>
        </FacetHeading>;
      break;
    case 'pc':
      headingToReturn =
        <FacetHeading tagFamily={tagFamily} activeFilters={activeFilters} title="Object Type">
          <span className={styles.fdaSpan}>Click <a onClick={(e)=>{e.stopPropagation();}} href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9372416/" target="_blank" rel='noreferrer' className={styles.tooltipLink}> here <ExternalLink/></a> to learn more about the Biolink Model.</span>
        </FacetHeading>;
      break;
    case 'role':
      headingToReturn =
        <FacetHeading tagFamily={tagFamily} activeFilters={activeFilters} title="Chemical Classification">
          <span className={styles.roleSpan}>The Chemical Entities of Biological Interest Role Classification (ChEBI role ontology, <a onClick={(e)=>{e.stopPropagation();}} href="https://www.ebi.ac.uk/chebi/chebiOntology.do?chebiId=CHEBI:50906&treeView=true#vizualisation" target="_blank" rel="noreferrer" className={styles.tooltipLink}>click to learn more <ExternalLink/></a>) is a chemical classification that categorizes chemicals according to their biological role, chemical role or application.</span>
        </FacetHeading>;
      break;
    case 'ara':
      headingToReturn = <FacetHeading tagFamily={tagFamily} activeFilters={activeFilters} title="Reasoning Agent" />;
      break;
    case 'di':
      headingToReturn = <FacetHeading tagFamily={tagFamily} activeFilters={activeFilters} title="Drug Indications" />;
      break;
    case 'pt':
      headingToReturn = <FacetHeading tagFamily={tagFamily} activeFilters={activeFilters} title="Path Type" />;
      break;
    case 'otc':
      headingToReturn = <FacetHeading tagFamily={tagFamily} activeFilters={activeFilters} title="Availability" />;
      break;
    default:
      headingToReturn = null;
  }
  return headingToReturn;
}

const getTagCaptionMarkup = (tagFamily: string): JSX.Element | null => {
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
    default:
      captionToReturn = null;
  }
  return captionToReturn;
}

const getSortedFacets = (
  family: string,
  activeFilters: Filter[],
  facetCompare: ((a: [string, Filter], b: [string, Filter]) => number) | undefined,
  groupedFilters: GroupedFilters) => {

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

  let sortedFacets = Object.entries(groupedFilters[family]).sort(defaultCompare);

  // When there is a custom facet compare for this facet family, we want to sort selected and
  // unselected facets independently while preserving that selected facets come first
  if (facetCompare) {
    const pivot = Object.keys(selectedFacetSet).length
    sortedFacets = pivotSort(sortedFacets, pivot, facetCompare);
  }

  return sortedFacets;
}

type FacetGroupProps = {
  filterFamily: string;
  activeFilters: Filter[];
  facetCompare: ((a: [string, Filter], b: [string, Filter]) => number) | undefined;
  groupedFilters: GroupedFilters;
  onFilter: (arg0: Filter) => void;
}

const FacetGroup: FC<FacetGroupProps> = ({ filterFamily, activeFilters, facetCompare, groupedFilters, onFilter }) => {

  const familyHeadingMarkup = getTagHeadingMarkup(filterFamily, activeFilters);
  const familyCaptionMarkup = getTagCaptionMarkup(filterFamily);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [height, setHeight] = useState<number | string>(0);

  // Ensures that selected facets come first
  let sortedFacets = useMemo(() => getSortedFacets(filterFamily, activeFilters, facetCompare, groupedFilters), [filterFamily, activeFilters, facetCompare, groupedFilters]);

  useEffect(() => {
    if(isExpanded === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [isExpanded])

  return (
    (Object.keys(groupedFilters[filterFamily]).length > 0 && familyHeadingMarkup !== null )
      ?
        <div className={styles.facetGroup}>
            <button
              className={`${styles.facetButton} ${isExpanded ? styles.isExpanded : ''}`}
              onClick={()=>setIsExpanded(prev=>!prev)}
            >
              {
                familyHeadingMarkup
              }
            </button>
          <AnimateHeight
            className={`${styles.facetPanel}`}
            duration={500}
            height={height}
          >
            {
              familyCaptionMarkup
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
          </AnimateHeight>
        </div>
      :
        <></>
  );
}

export default FacetGroup;
