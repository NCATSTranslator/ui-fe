import { FC, useState, useEffect, Dispatch, SetStateAction } from "react";
import { Filter, GroupedTags, Tag } from "../../Types/results";
import styles from './FacetGroup.module.scss';
import AnimateHeight from "react-animate-height";
import Tooltip from '../Tooltip/Tooltip';
import Checkbox from '../FormFields/Checkbox';
import Include from '../../Icons/include.svg?react';
import Exclude from '../../Icons/exclude.svg?react';
import ExternalLink from '../../Icons/external-link.svg?react';
import { formatBiolinkEntity } from '../../Utilities/utilities';
import { isFacet, isEvidenceFilter } from '../../Utilities/filterFunctions';
import Alert from '../../Icons/Alerts/Info.svg?react';
import ChevDown from "../../Icons/Directional/Property_1_Down.svg?react"
import { cloneDeep } from "lodash";

const getRoleHeading = (): JSX.Element => {
  return (
    <div className={styles.labelContainer}>
      <div className={styles.labelHeading}>
        <div className={styles.label} data-tooltip-id="chebi-role-tooltip" >
          <p className={styles.subTwo}>ChEBI Role Classification</p>
          <Alert/>
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

const getChemicalTypeHeading = (): JSX.Element => {
  return(
    <div className={styles.labelContainer}>
      <div className={styles.labelHeading}>
        <div className={styles.label} data-tooltip-id="chemical-type-tooltip" >
          <p className={styles.subTwo}>Chemical Categories</p>
          <Alert/>
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

const getNodeTypeHeading = (): JSX.Element => {
  return(
    <div className={styles.labelContainer}>
      <div className={styles.labelHeading}>
        <div className={styles.label} data-tooltip-id="biolink-tooltip-2" >
          <p className={styles.subTwo}>Node Type</p>
          <Alert/>
          <Tooltip id="biolink-tooltip-2">
            <span className={styles.fdaSpan}>Click <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9372416/" target="_blank" rel='noreferrer' className={styles.tooltipLink}>here</a> to learn more about the Biolink Model.</span>
          </Tooltip>
        </div>
        <ChevDown className={styles.expansionSVG}/>
      </div>
    </div>
  )
}
const getNodeTypeCaption = (): JSX.Element => {
  return(
    <p className={styles.caption}>Show only results that include a node with a particular type (Drug, Chemical Entity, Small Molecule, etc.)</p>
  )
}

const getAraHeading = (): JSX.Element => {
  return(
    <div className={styles.labelContainer}>
      <div className={styles.labelHeading}>
        <div className={styles.label} >
          <p className={styles.subTwo}>Reasoning Agent</p>
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


const getDrugIndicationsHeading = (): JSX.Element => {
  return(
    <div className={styles.labelContainer}>
      <div className={styles.labelHeading}>
        <div className={styles.label} >
          <p className={styles.subTwo}>Drug Indications</p>
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

const getPathTypeHeadings = (): JSX.Element => {
  return(
    <div className={styles.labelContainer}>
      <div className={styles.labelHeading}>
        <div className={styles.label} >
          <p className={styles.subTwo}>Relationship Type</p>
        </div>
        <ChevDown className={styles.expansionSVG}/>
      </div>
    </div>
  )
}
const getPathTypeCaption = (): JSX.Element => {
  return(
    <p className={styles.caption}>Filter direct relationships (establed from evident from external sources) and/or inferred relationships (deduced from patterns in Translator's knowledge graphs).</p>
  )
}

const getTagHeadingMarkup = (tagType: string): JSX.Element | null => {
  let headingToReturn;
  switch(tagType) {
    case 'chemicalType':
      headingToReturn = getChemicalTypeHeading();
      break;
    case 'nodeType':
      headingToReturn = getNodeTypeHeading();
      break;
    case 'role':
      headingToReturn = getRoleHeading();
      break;
    case 'ara':
      headingToReturn = getAraHeading();
      break;
    case 'di':
      headingToReturn = getDrugIndicationsHeading();
      break;
    case 'pt':
      headingToReturn = getPathTypeHeadings();
      break;
    default:
      headingToReturn = null;
  }
  return headingToReturn;
}

const getTagCaptionMarkup = (tagType: string): JSX.Element | null => {
  let captionToReturn;
  switch(tagType) {
    case 'chemicalType':
      captionToReturn = getChemicalTypeCaption();
      break;
    case 'nodeType':
      captionToReturn = getNodeTypeCaption();
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
  groupedTags: GroupedTags;
  availableTags: {[key: string]: Tag};
  onFilter: (arg0: Tag) => void;
}

const FacetGroup: FC<FacetGroupProps> = ({ tagType, activeFilters, groupedTags, availableTags, onFilter }) => {

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
    if (type === 'nodeType') {
      tagName = formatBiolinkEntity(object.name);
    } else {
      tagName = object.name;
    }
    let positiveChecked = (activeFilters.some(filter => isFacet(filter) && filter.type === tagKey && !filter.negated)) ? true: false;
    let negativeChecked = (activeFilters.some(filter => isFacet(filter) && filter.type === tagKey && filter.negated)) ? true: false;
  
    return (
      // availableTags[tagKey] && availableTags[tagKey].count &&
      <div className={`${styles.facetContainer} ${positiveChecked ? styles.containerPositiveChecked : ""} ${negativeChecked ? styles.containerNegativeChecked : ""}`} key={tagKey}>
        <Checkbox
          handleClick={() => handleFacetChange(tagKey, tagObjectState, setTagObjectFunc, false, tagName)}
          checked={positiveChecked}
          className={`${styles.checkbox} ${styles.positive}`}
          checkedClassName={positiveChecked ? styles.positiveChecked : ""}
          icon={<Include/>}
          >
          <span className={styles.tagName}>
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
  
  const displayFacets = (type: string, activeFilters: Filter[], groupedTags: GroupedTags, tagObject: Tag, 
    tagObjectSetter: Dispatch<SetStateAction<Tag>>, availableTags: {[key: string]: Tag}) => {

    const typeIndexMapping = activeFilters.reduce<Record<string, number>>((acc, filter, index) => {
      acc[filter.type] = index;
      return acc;
    }, {});
    const sortedFacets = Object.entries(groupedTags[type]).sort((a, b) => {
      const indexA = typeIndexMapping[a[0]] !== undefined ? typeIndexMapping[a[0]] : Infinity;
      const indexB = typeIndexMapping[b[0]] !== undefined ? typeIndexMapping[b[0]] : Infinity;
  
      // Prioritize items found in activeFilters
      if (indexA !== Infinity && indexB === Infinity) {
        return -1; // A is in activeFilters, B is not, A comes first
      } else if (indexB !== Infinity && indexA === Infinity) {
        return 1; // B is in activeFilters, A is not, B comes first
      } else if (indexA === Infinity && indexB === Infinity) {
        // Neither A nor B is in activeFilters, sort alphabetically by name
        const nameA = a[1].name.toLowerCase();
        const nameB = b[1].name.toLowerCase();
        return nameA.localeCompare(nameB);
      }
      // If both are in activeFilters, retain their order (assuming activeFilters is pre-sorted or order doesn't matter)
      return 0;
    });
  
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
  
  const typeHeadingMarkup = getTagHeadingMarkup(tagType);
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
    <div className={styles.facetGroup}>
      {
        // if there are tags within this group, display the heading
        Object.keys(groupedTags[tagType]).length > 0 && typeHeadingMarkup !== null &&
        <button 
          className={`${styles.facetButton} ${isExpanded ? styles.isExpanded : ''}`}
          onClick={()=>setIsExpanded(prev=>!prev)}
        >
          {
            typeHeadingMarkup
          }
        </button>
      } 
      <AnimateHeight
        className={`${styles.facetPanel}`}
        duration={500}
        height={height}
      >
        {
          typeCaptionMarkup
        }
        {
          displayFacets(tagType, activeFilters, groupedTags, tagObject, setTagObject, availableTags)
        }
      </AnimateHeight>
    </div>
  );
}

export default FacetGroup;