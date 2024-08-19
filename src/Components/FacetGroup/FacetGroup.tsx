import { FC, useState, useEffect, Dispatch, SetStateAction } from "react";
import { Filter, GroupedTags, Tag } from "../../Types/results";
import styles from './FacetGroup.module.scss';
import AnimateHeight from "react-animate-height";
import Checkbox from '../Core/Checkbox';
import Include from '../../Icons/Buttons/Checkmark/Circle Checkmark.svg?react';
import Exclude from '../../Icons/Buttons/View & Exclude/Exclude.svg?react';
import ExternalLink from '../../Icons/Buttons/External Link.svg?react';
import { formatBiolinkEntity } from '../../Utilities/utilities';
import { isFacet, hasFilterFamily } from '../../Utilities/filterFunctions';
import { pivotSort } from '../../Utilities/sortingFunctions';
import { cloneDeep } from "lodash";
import FacetHeading from "../FacetHeading/FacetHeading";

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
          <span className={styles.fdaSpan}>Click <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9372416/" target="_blank" rel='noreferrer' className={styles.tooltipLink}>here</a> to learn more about the Biolink Model.</span>
        </FacetHeading>;
      break;
    case 'role':
      headingToReturn =
        <FacetHeading tagFamily={tagFamily} activeFilters={activeFilters} title="ChEBI Role Classification">
          <span className={styles.roleSpan}>The Chemical Entities of Biological Interest Role Classification (ChEBI role ontology, <a href="https://www.ebi.ac.uk/chebi/chebiOntology.do?chebiId=CHEBI:50906&treeView=true#vizualisation" target="_blank" rel="noreferrer" className={styles.tooltipLink}>click to learn more</a>) is a chemical classification that categorizes chemicals according to their biological role, chemical role or application.</span>
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
    default:
      captionToReturn = null;
  }
  return captionToReturn;
}

const getRoleLinkout = (tagKey: string): string => {
  const id = tagKey.split(':').slice(1,).join('%3A');
  return `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${id}`;
}

type FacetGroupProps = {
  tagFamily: string;
  activeFilters: Filter[];
  facetCompare: ((a: [string, Tag], b: [string, Tag]) => number) | undefined;
  groupedTags: GroupedTags;
  availableTags: {[key: string]: Tag};
  onFilter: (arg0: Tag) => void;
}

const FacetGroup: FC<FacetGroupProps> = ({ tagFamily, activeFilters, facetCompare, groupedTags, availableTags, onFilter }) => {

  const [tagObject, setTagObject] = useState<Tag>({
    name: "",
    negated: false,
    family: "",
    value: ""
  });

  const handleFacetChange = (facetFamily: string, objectToUpdate: Tag, setterFunction: (tag: Tag)=>void, negated: boolean = false, label: string = '') => {
    if (objectToUpdate.family === facetFamily) {
      return;
    }

    let newObj = cloneDeep(objectToUpdate);
    newObj.family = facetFamily;
    newObj.value = label;
    newObj.negated = negated;
    setterFunction(objectToUpdate);
    onFilter(newObj);
  }

  const tagDisplay = (tag: [string, Tag], family: string, tagObjectState: Tag, setTagObjectFunc: (arg0:Tag)=>void, availableTags: {[key: string]: Tag}, activeFilters: Filter[]): JSX.Element => {
    let tagKey = tag[0];
    let object = tag[1];
    let tagName = '';
    if (family === 'pc') {
      tagName = formatBiolinkEntity(object.name);
    } else {
      tagName = object.name;
    }
    let positiveChecked = (activeFilters.some(filter => isFacet(filter) && filter.family === tagKey && !filter.negated)) ? true: false;
    let negativeChecked = (activeFilters.some(filter => isFacet(filter) && filter.family === tagKey && filter.negated)) ? true: false;

    return (
      // availableTags[tagKey] && availableTags[tagKey].count &&
      <div className={`facet-container ${styles.facetContainer} ${positiveChecked ? styles.containerPositiveChecked : ""} ${negativeChecked ? styles.containerNegativeChecked : ""}`} key={tagKey} data-facet-name={tagName}>
        <Checkbox
          handleClick={() => handleFacetChange(tagKey, tagObjectState, setTagObjectFunc, false, tagName)}
          checked={positiveChecked}
          className={`${styles.checkbox} ${styles.positive}`}
          checkedClassName={positiveChecked ? styles.positiveChecked : ""}
          icon={<Include/>}
          labelLeft
          >
          <span className={styles.tagName} title={tagName}>
            {tagName}
          </span>
          <span className={styles.facetCount}>
            {(object.count) ? object.count : 0}
            {
            (family === "role") &&
              <a href={getRoleLinkout(tagKey)} rel="noreferrer" target="_blank">
                <ExternalLink className={styles.extLinkIcon}/>
              </a>
            }
          </span>
        </Checkbox>
        <Checkbox
          handleClick={() => handleFacetChange(tagKey, tagObjectState, setTagObjectFunc, true, tagName)}
          checked={activeFilters.some(filter => isFacet(filter) && filter.family === tagKey && filter.negated)}
          className={`${styles.checkbox} ${styles.negative}`}
          checkedClassName={negativeChecked ? styles.negativeChecked : ""}
          icon={<Exclude/>}
          labelLeft
        ></Checkbox>
      </div>
    )
  }

  const displayFacets = (family: string, activeFilters: Filter[], facetCompare: ((a: [string, Tag], b: [string, Tag]) => number) | undefined, groupedTags: GroupedTags, tagObject: Tag, tagObjectSetter: Dispatch<SetStateAction<Tag>>, availableTags: {[key: string]: Tag}) => {

    // The selected set of filters for the current facet family
    const selectedFacetSet = activeFilters.reduce<Record<string, null>>((acc, filter, index) => {
      if (hasFilterFamily(filter, family)) {
        acc[filter.family] = null;
      }

      return acc;
    }, {});

    const isOther = (name: string): boolean => name.toLowerCase() === 'other';
    const isSelected = (key: string, selectedFacetSet: {[key: string]: null}): boolean => {
      return selectedFacetSet[key] !== undefined;
    }

    const compareNames = (nameA: string, nameB: string): number => {
      if (isOther(nameA) && isOther(nameB)) return 0;
      if (isOther(nameA)) return 1;
      if (isOther(nameB)) return -1;
      return nameA.localeCompare(nameB);
    };

    const defaultCompare = (a: [string, Tag], b: [string, Tag]) => {
      const isFacetASelected = isSelected(a[0], selectedFacetSet);
      const isFacetBSelected = isSelected(b[0], selectedFacetSet);
      if (isFacetASelected && !isFacetBSelected) return -1;
      if (!isFacetASelected && isFacetBSelected) return 1;

      const nameA = a[1].name.toLowerCase();
      const nameB = b[1].name.toLowerCase();

      return compareNames(nameA, nameB);
    };

    // Ensures that selected facets come first
    let sortedFacets = Object.entries(groupedTags[family]).sort(defaultCompare);

    // When there is a custom facet compare for this facet family, we want to sort selected and
    // unselected facets independently while preserving that selected facets come first
    if (facetCompare) {
      const pivot = Object.keys(selectedFacetSet).length
      sortedFacets = pivotSort(sortedFacets, pivot, facetCompare);
    }

    return (
      <div className={`${styles.section} ${Object.keys(groupedTags).length > 5 ? styles['role'] + ' scrollable' : ''}`}>
        { // Sort each set of tags, then map them to return each facet
          sortedFacets.map((tag) => {
            return tagDisplay(tag, family, tagObject, tagObjectSetter, availableTags, activeFilters);
          })
        }
      </div>
    )
  }

  const familyHeadingMarkup = getTagHeadingMarkup(tagFamily, activeFilters);
  const familyCaptionMarkup = getTagCaptionMarkup(tagFamily);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [height, setHeight] = useState<number | string>(0);

  useEffect(() => {
    if(isExpanded === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [isExpanded])

  return (
    (Object.keys(groupedTags[tagFamily]).length > 0 && familyHeadingMarkup !== null )
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
              displayFacets(tagFamily, activeFilters, facetCompare, groupedTags, tagObject, setTagObject, availableTags)
            }
          </AnimateHeight>
        </div>
      :
        <></>
  );
}

export default FacetGroup;
