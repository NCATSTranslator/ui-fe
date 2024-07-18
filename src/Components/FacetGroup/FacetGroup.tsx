import { FC, useState, useEffect, Dispatch, SetStateAction } from "react";
import { Filter, GroupedTags, Tag } from "../../Types/results";
import styles from './FacetGroup.module.scss';
import AnimateHeight from "react-animate-height";
import Tooltip from '../Tooltip/Tooltip';
import Checkbox from '../FormFields/Checkbox';
import Include from '../../Icons/Buttons/View & Exclude/View.svg?react';
import Exclude from '../../Icons/Buttons/View & Exclude/Exclude.svg?react';
import ExternalLink from '../../Icons/Buttons/External Link.svg?react';
import Alert from '../../Icons/Status/Alerts/Info.svg?react';
import { formatBiolinkEntity } from '../../Utilities/utilities';
import { isFacet, isEvidenceFilter, hasFilterFamily } from '../../Utilities/filterFunctions';
import { pivotSort } from '../../Utilities/sortingFunctions';
import ChevDown from "../../Icons/Directional/Chevron/Chevron Down.svg?react"
import { cloneDeep } from "lodash";

const getRoleHeading = (tagType: string, activeFilters: Filter[]): JSX.Element => {
  const hasActiveFacet = activeFilters.some((val)=> val.type.includes(tagType))
  return (
    <div className={styles.labelContainer}>
      <div className={styles.labelHeading}>
        <div className={styles.label}>
          <span data-tooltip-id="chebi-role-tooltip">
            <p className={`${styles.subTwo} ${hasActiveFacet ? styles.underline : ''}`}>ChEBI Role Classification</p>
            <Alert/>
          </span>
          <Tooltip id="chebi-role-tooltip">
            <span className={styles.roleSpan}>The Chemical Entities of Biological Interest Role Classification (ChEBI role ontology, <a href="https://www.ebi.ac.uk/chebi/chebiOntology.do?chebiId=CHEBI:50906&treeView=true#vizualisation" target="_blank" rel="noreferrer" className={styles.tooltipLink}>click to learn more</a>) is a chemical classification that categorizes chemicals according to their biological role, chemical role or application.</span>
          </Tooltip>
        </div>
        <ChevDown className={styles.expansionSVG}/>
      </div>
    </div>
  )
}
const getRoleCaption = (): JSX.Element => {
  return (
    <p className={styles.caption}>Show only results that match a particular chemical role.</p>
  )
}

const getChemicalTypeHeading = (tagType: string, activeFilters: Filter[]): JSX.Element => {
  const hasActiveFacet = activeFilters.some((val)=> val.type.includes(tagType))
  return(
    <div className={styles.labelContainer}>
      <div className={styles.labelHeading}>
        <div className={styles.label}>
          <span data-tooltip-id="chemical-type-tooltip">
            <p className={`${styles.subTwo} ${hasActiveFacet ? styles.underline : ''}`}>Chemical Categories</p>
            <Alert/>
          </span>
          <Tooltip id="chemical-type-tooltip">
            <p className={styles.tooltipParagraph}>Drug is a substance intended for use in the diagnosis, cure, mitigation, treatment, or the prevention of a disease.</p>
            <p className={styles.tooltipParagraph}>Phase 1-3 Drugs are chemicals that are part of a clinical trial and do not yet have FDA approval.</p>
            <p className={styles.tooltipParagraph}>Other includes all other chemicals.</p>
          </Tooltip>
        </div>
        <ChevDown className={styles.expansionSVG}/>
      </div>
    </div>
  )
}
const getChemicalTypeCaption = (): JSX.Element => {
  return(
    <p className={styles.caption}>Filter on different categories of chemicals.</p>
  )
}

const getObjectTypeHeading = (tagType: string, activeFilters: Filter[]): JSX.Element => {
  const hasActiveFacet = activeFilters.some((val)=> val.type.includes(tagType))
  return(
    <div className={styles.labelContainer}>
      <div className={styles.labelHeading}>
        <div className={styles.label}>
          <span data-tooltip-id="biolink-tooltip-2">
            <p className={`${styles.subTwo} ${hasActiveFacet ? styles.underline : ''}`}>Object Type</p>
            <Alert/>
          </span>
          <Tooltip id="biolink-tooltip-2">
            <span className={styles.fdaSpan}>Click <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9372416/" target="_blank" rel='noreferrer' className={styles.tooltipLink}>here</a> to learn more about the Biolink Model.</span>
          </Tooltip>
        </div>
        <ChevDown className={styles.expansionSVG}/>
      </div>
    </div>
  )
}
const getObjectTypeCaption = (): JSX.Element => {
  return(
    <p className={styles.caption}>Show only results that include an object of a particular type (Drug, Chemical Entity, Small Molecule, etc.)</p>
  )
}

const getAraHeading = (tagType: string, activeFilters: Filter[]): JSX.Element => {
  const hasActiveFacet = activeFilters.some((val)=> val.type.includes(tagType))
  return(
    <div className={styles.labelContainer}>
      <div className={styles.labelHeading}>
        <div className={styles.label} >
          <p className={`${styles.subTwo} ${hasActiveFacet ? styles.underline : ''}`}>Reasoning Agent</p>
        </div>
        <ChevDown className={styles.expansionSVG}/>
      </div>
    </div>
  )
}
const getAraCaption = (): JSX.Element => {
  return(
    <p className={styles.caption}>Filter on specific reasoning agents used to calculate the results.</p>
  )
}


const getDrugIndicationsHeading = (tagType: string, activeFilters: Filter[]): JSX.Element => {
  const hasActiveFacet = activeFilters.some((val)=> val.type.includes(tagType))
  return(
    <div className={styles.labelContainer}>
      <div className={styles.labelHeading}>
        <div className={styles.label} >
          <p className={`${styles.subTwo} ${hasActiveFacet ? styles.underline : ''}`}>Drug Indications</p>
        </div>
        <ChevDown className={styles.expansionSVG}/>
      </div>
    </div>
  )
}
const getDrugIndicationsCaption = (): JSX.Element => {
  return(
    <p className={styles.caption}>Filter on if the drug is indicated for the given disease.</p>
  )
}

const getPathTypeHeadings = (tagType: string, activeFilters: Filter[]): JSX.Element => {
  const hasActiveFacet = activeFilters.some((val)=> val.type.includes(tagType))
  return(
    <div className={styles.labelContainer}>
      <div className={styles.labelHeading}>
        <div className={styles.label} >
          <p className={`${styles.subTwo} ${hasActiveFacet ? styles.underline : ''}`}>Path Type</p>
        </div>
        <ChevDown className={styles.expansionSVG}/>
      </div>
    </div>
  )
}
const getPathTypeCaption = (): JSX.Element => {
  return(
    <p className={styles.caption}>Filter by path type (lookup or inferred) and/or by number of connections.</p>
  )
}

const getTagHeadingMarkup = (tagType: string, activeFilters: Filter[]): JSX.Element | null => {
  let headingToReturn;
  switch(tagType) {
    case 'cc':
      headingToReturn = getChemicalTypeHeading(tagType, activeFilters);
      break;
    case 'pc':
      headingToReturn = getObjectTypeHeading(tagType, activeFilters);
      break;
    case 'role':
      headingToReturn = getRoleHeading(tagType, activeFilters);
      break;
    case 'ara':
      headingToReturn = getAraHeading(tagType, activeFilters);
      break;
    case 'di':
      headingToReturn = getDrugIndicationsHeading(tagType, activeFilters);
      break;
    case 'pt':
      headingToReturn = getPathTypeHeadings(tagType, activeFilters);
      break;
    default:
      headingToReturn = null;
  }
  return headingToReturn;
}

const getTagCaptionMarkup = (tagType: string): JSX.Element | null => {
  let captionToReturn;
  switch(tagType) {
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

interface FacetGroupProps {
  tagType: string;
  activeFilters: Filter[];
  facetCompare: ((a: [string, Tag], b: [string, Tag]) => number) | undefined;
  groupedTags: GroupedTags;
  availableTags: {[key: string]: Tag};
  onFilter: (arg0: Tag) => void;
}

const FacetGroup: FC<FacetGroupProps> = ({ tagType, activeFilters, facetCompare, groupedTags, availableTags, onFilter }) => {

  const [tagObject, setTagObject] = useState<Tag>({
    name: "",
    negated: false,
    type: "",
    value: ""
  });

  const handleFacetChange = (facetID: string, objectToUpdate: Tag, setterFunction: (tag: Tag)=>void, negated: boolean = false, label: string = '') => {
    if(objectToUpdate.type === facetID && !isEvidenceFilter(objectToUpdate)) {
      return;
    }

    let newObj = cloneDeep(objectToUpdate);
    newObj.type = facetID;
    newObj.value = label;
    newObj.negated = negated;
    setterFunction(objectToUpdate);
    onFilter(newObj);
  }

  const tagDisplay = (tag: [string, Tag], type: string, tagObjectState: Tag, setTagObjectFunc: (arg0:Tag)=>void, availableTags: {[key: string]: Tag}, activeFilters: Filter[]): JSX.Element => {
    let tagKey = tag[0];
    let object = tag[1];
    let tagName = '';
    if (type === 'pc') {
      tagName = formatBiolinkEntity(object.name);
    } else {
      tagName = object.name;
    }
    let positiveChecked = (activeFilters.some(filter => isFacet(filter) && filter.type === tagKey && !filter.negated)) ? true: false;
    let negativeChecked = (activeFilters.some(filter => isFacet(filter) && filter.type === tagKey && filter.negated)) ? true: false;

    return (
      // availableTags[tagKey] && availableTags[tagKey].count &&
      <div className={`facet-container ${styles.facetContainer} ${positiveChecked ? styles.containerPositiveChecked : ""} ${negativeChecked ? styles.containerNegativeChecked : ""}`} key={tagKey} data-facet-name={tagName}>
        <Checkbox
          handleClick={() => handleFacetChange(tagKey, tagObjectState, setTagObjectFunc, false, tagName)}
          checked={positiveChecked}
          className={`${styles.checkbox} ${styles.positive}`}
          checkedClassName={positiveChecked ? styles.positiveChecked : ""}
          icon={<Include/>}
          >
          <span className={styles.tagName} title={tagName}>
            {tagName}
          </span>
          <span className={styles.facetCount}>
            {
            (type === "role") &&
              <a href={getRoleLinkout(tagKey)} rel="noreferrer" target="_blank">
                <ExternalLink className={styles.extLinkIcon}/>
              </a>
            }
            ({(object.count) ? object.count : 0})
          </span>
        </Checkbox>
        <Checkbox
          handleClick={() => handleFacetChange(tagKey, tagObjectState, setTagObjectFunc, true, tagName)}
          checked={activeFilters.some(filter => isFacet(filter) && filter.type === tagKey && filter.negated)}
          className={`${styles.checkbox} ${styles.negative}`}
          checkedClassName={negativeChecked ? styles.negativeChecked : ""}
          icon={<Exclude/>}
        ></Checkbox>
      </div>
    )
  }

  const displayFacets = (type: string, activeFilters: Filter[], facetCompare: ((a: [string, Tag], b: [string, Tag]) => number) | undefined, groupedTags: GroupedTags, tagObject: Tag, tagObjectSetter: Dispatch<SetStateAction<Tag>>, availableTags: {[key: string]: Tag}) => {

    // The selected set of filters for the current facet family
    const selectedFacetSet = activeFilters.reduce<Record<string, null>>((acc, filter, index) => {
      if (hasFilterFamily(filter, type)) {
        acc[filter.type] = null;
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
    let sortedFacets = Object.entries(groupedTags[type]).sort(defaultCompare);

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
            return tagDisplay(tag, type, tagObject, tagObjectSetter, availableTags, activeFilters);
          })
        }
      </div>
    )
  }

  const typeHeadingMarkup = getTagHeadingMarkup(tagType, activeFilters);
  const typeCaptionMarkup = getTagCaptionMarkup(tagType);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [height, setHeight] = useState<number | string>(0);

  useEffect(() => {
    if(isExpanded === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [isExpanded])

  return (
    (Object.keys(groupedTags[tagType]).length > 0 && typeHeadingMarkup !== null )
      ?
        <div className={styles.facetGroup}>
            <button
              className={`${styles.facetButton} ${isExpanded ? styles.isExpanded : ''}`}
              onClick={()=>setIsExpanded(prev=>!prev)}
            >
              {
                typeHeadingMarkup
              }
            </button>
          <AnimateHeight
            className={`${styles.facetPanel}`}
            duration={500}
            height={height}
          >
            {
              typeCaptionMarkup
            }
            {
              displayFacets(tagType, activeFilters, facetCompare, groupedTags, tagObject, setTagObject, availableTags)
            }
          </AnimateHeight>
        </div>
      :
        <></>
  );
}

export default FacetGroup;
