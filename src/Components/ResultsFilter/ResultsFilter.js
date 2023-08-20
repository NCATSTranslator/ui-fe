import React, {useState, useMemo} from 'react';
import styles from './ResultsFilter.module.scss';
import Checkbox from '../FormFields/Checkbox';
import SimpleRange from '../Range/SimpleRange';
import EntitySearch from '../EntitySearch/EntitySearch';
import Tooltip from '../Tooltip/Tooltip';
import {ReactComponent as Alert} from '../../Icons/Alerts/Info.svg';
import {ReactComponent as ExternalLink} from '../../Icons/external-link.svg';
import { formatBiolinkEntity } from '../../Utilities/utilities';
import { isFacet, isEvidenceFilter } from '../../Utilities/filterFunctions';
import { cloneDeep } from 'lodash';

const ResultsFilter = ({activeFilters, onFilter, onClearAll, onClearTag, availableTags}) => {

  // returns a new object with each tag grouped by its type
  const groupAvailableTags = (tags) => {
    let clonedTags = cloneDeep(tags);
    let roleTags = Object.fromEntries(Object.entries(clonedTags).filter(([key]) => key.includes('role:')));
    let resultTypeTags = Object.fromEntries(Object.entries(clonedTags).filter(([key]) => key.includes('rc:')));
    let nodeTypeTags = Object.fromEntries(Object.entries(clonedTags).filter(([key]) => key.includes('pc:')));
    let fdaTags = Object.fromEntries(Object.entries(clonedTags).filter(([key]) => key.includes('fda:')));
    let araTags = Object.fromEntries(Object.entries(clonedTags).filter(([key]) => key.includes('ara:')));
    let diTags = Object.fromEntries(Object.entries(clonedTags).filter(([key]) => key.includes('di:')));
    // The ordering of newGroupedTags determines the order of the facets in the UI
    const newGroupedTags = {
      fda: fdaTags,
      resultType: resultTypeTags,
      nodeType: nodeTypeTags,
      role: roleTags,
      di: diTags,
      ara: araTags
    }
    return newGroupedTags;
  }

  const initCountsToShow = (groupedTags) => {
    let newCountsToShow = {};
    Object.keys(groupedTags).forEach((key) => {
      newCountsToShow[key] = facetShowMoreIncrement;
    })
    return newCountsToShow;
  }
  
  const facetShowMoreIncrement = 5;

  const [evidenceObject, setEvidenceObject] = useState({type:'evi:', value: 1});
  const [tagObject, setTagObject] = useState({type:'', value: ''});
  const groupedTags = useMemo(()=>groupAvailableTags(availableTags), [availableTags]);
  const initialCountsToShow = initCountsToShow(groupedTags);
  const [countsToShow, setCountsToShow] = useState(initialCountsToShow);

  onClearAll = (!onClearAll) ? () => console.log("No clear all function specified in ResultsFilter.") : onClearAll;

  const handleEvidenceActive = () => {
    onFilter(evidenceObject);
  }

  const handleFacetChange = (facetID, objectToUpdate, setterFunction, label = '') => {
    if(objectToUpdate.type === facetID && !isEvidenceFilter(objectToUpdate)) {
      return;
    }

    let newObj = global.structuredClone(objectToUpdate);
    newObj.type = facetID;
    newObj.value = label;
    setterFunction(objectToUpdate);
    onFilter(newObj);
  }

  const getRoleHeading = () => {
    return (
      <div className={styles.labelContainer} >
        <div className={styles.label} data-tooltip-id="chebi-role-tooltip" >
          <p className={styles.subTwo}>ChEBI Role Classification</p>
          <Alert/>
          <Tooltip id="chebi-role-tooltip">
            <span className={styles.roleSpan}>The Chemical Entities of Biological Interest Role Classification (ChEBI role ontology, <a href="https://www.ebi.ac.uk/chebi/chebiOntology.do?chebiId=CHEBI:50906&treeView=true#vizualisation" target="_blank" rel="noreferrer" className={styles.tooltipLink}>click to learn more</a>) is a chemical classification that categorizes chemicals according to their biological role, chemical role or application.</span>
          </Tooltip>
        </div>
        <p className={styles.caption}>Show only results that match a particular chemical role.</p>
      </div>
    )
  }

  const getFdaHeading = () => {
    return(
      <div className={styles.labelContainer} >
          <div className={styles.label} data-tooltip-id="fda-tooltip" >
            <p className={styles.subTwo}>FDA Status</p>
            <Alert/>
            <Tooltip id="fda-tooltip">
              <span className={styles.fdaSpan}>Please note that an “Approved” status does not mean that the FDA has approved these drugs to treat the disease(s) you specified in your search, but rather that they have been approved to treat a specific disease or condition.</span>
            </Tooltip>
          </div>
      </div>
    )
  }

  const getResultTypeHeading = () => {
    return(
      <div className={styles.labelContainer} >
          <div className={styles.label} data-tooltip-id="biolink-tooltip-1" >
            <p className={styles.subTwo}>Result Type</p>
            <Alert/>
            <Tooltip id="biolink-tooltip-1">
              <span className={styles.fdaSpan}>Click <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9372416/" target="_blank" rel='noreferrer' className={styles.tooltipLink}>here</a> to learn more about the Biolink Model.</span>
            </Tooltip>
          </div>
          <p className={styles.caption}>Show only results that begin with a particular type (Drug, Chemical Entity, Small Molecule, etc.)</p>
      </div>
    )
  }

  const getNodeTypeHeading = () => {
    return(
      <div className={styles.labelContainer} >
        <div className={styles.label} data-tooltip-id="biolink-tooltip-2" >
          <p className={styles.subTwo}>Node Type</p>
          <Alert/>
          <Tooltip id="biolink-tooltip-2">
            <span className={styles.fdaSpan}>Click <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9372416/" target="_blank" rel='noreferrer' className={styles.tooltipLink}>here</a> to learn more about the Biolink Model.</span>
          </Tooltip>
          </div>
          <p className={styles.caption}>Show only results that include a node with a particular type (Drug, Chemical Entity, Small Molecule, etc.)</p>
      </div>
    )
  }

  const getAraHeading = () => {
    return(
      <div className={styles.labelContainer} >
          <div className={styles.label} >
            <p className={styles.subTwo}>Reasoning Agent</p>
          </div>
          <p className={styles.caption}>Filter on specific reasoning agents used to calculate the results.</p>
      </div>
    )
  }

  const getDrugIndicationsHeading = () => {
    return(
      <div className={styles.labelContainer} >
          <div className={styles.label} >
            <p className={styles.subTwo}>Drug Indications</p>
          </div>
          <p className={styles.caption}>Filter on if the drug is indicated for the given disease.</p>
      </div>
    )
  }

  const getTagHeadingMarkup = (tagType) => {
    let headingToReturn;
    switch(tagType) {
      case 'fda':
        headingToReturn = getFdaHeading();
        break;
      case 'resultType':
        headingToReturn = getResultTypeHeading();
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
      default:
        headingToReturn = '';
    }
    return headingToReturn;
  }

  const getRoleLinkout = (tagKey) => {
    const id = tagKey.split(':').slice(1,).join('%3A');
    return `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${id}`;
  }

  const showMoreFacets = (type) => {
    let newCount = countsToShow[type];
    if(Object.keys(groupedTags[type]).length > countsToShow[type]) {
      newCount = (countsToShow[type] + facetShowMoreIncrement > Object.keys(groupedTags[type]).length)
        ? Object.keys(groupedTags[type]).length
        : countsToShow[type] + facetShowMoreIncrement;
    }

    let newCountsToShow = global.structuredClone(countsToShow);
    newCountsToShow[type] = newCount;
    setCountsToShow(newCountsToShow);
  }
  const showFewerFacets = (type) => {
    let newCount = countsToShow[type];
    if(countsToShow[type] - facetShowMoreIncrement < facetShowMoreIncrement)
      newCount = facetShowMoreIncrement;
    else
      newCount = countsToShow[type] - facetShowMoreIncrement;

    let newCountsToShow = global.structuredClone(countsToShow);
    newCountsToShow[type] = newCount;
    setCountsToShow(newCountsToShow);
  }

  const tagDisplay = (tag, type, tagObject, setTagObjectFunc, availableTags) => {
    let tagKey = tag[0];
    let object = tag[1];
    let tagName = '';
    if (type === 'resultType' || type === 'nodeType') {
      tagName = formatBiolinkEntity(object.name);
    } else {
      tagName = object.name;
    }

    return (
      availableTags[tagKey] && availableTags[tagKey].count &&
      <div className={styles.facetContainer} key={tagKey}>
        <Checkbox
          handleClick={() => handleFacetChange(tagKey, tagObject, setTagObjectFunc, tagName)}
          checked={activeFilters.some(filter => isFacet(filter) && filter.type === tagKey)}
          className={styles.checkbox}
          >
          {tagName} 
          {
            (type === "role") &&
              <a href={getRoleLinkout(tagKey)} rel="noreferrer" target="_blank">
                <ExternalLink className={styles.extLinkIcon}/>
              </a>
          }
          <span className={styles.facetCount}>({(object.count) ? object.count : 0})</span>
        </Checkbox>
      </div>
    )
  }

  const displayFacets = (type) => {
    return (
      <div className={`${styles.section} ${styles[type]}`}>
        { // Sort each set of tags, then map them to return each facet
          (type === "role") 
          ?
            Object.entries(groupedTags[type]).sort((a,b)=> { return (a[1].name > b[1].name ? 1 : -1)}).map((tag, j) => {
              return tagDisplay(tag, type, tagObject, setTagObject, availableTags);
            })
          :
            Object.entries(groupedTags[type]).sort((a,b)=> { return (a[1].name > b[1].name ? 1 : -1)}).slice(0, countsToShow[type]).map((tag, j) => {
              return tagDisplay(tag, type, tagObject, setTagObject, availableTags);
            })
        }
        {
          (type !== "role") &&
          <div className={styles.showButtonsContainer}>
            {
              Object.keys(groupedTags[type]).length > countsToShow[type] &&
              <button onClick={()=>{showMoreFacets(type)}} className={styles.showButton}>Show More</button>
            }
            {
              (Object.keys(groupedTags[type]).length > 0) && countsToShow[type] > facetShowMoreIncrement &&
              <button onClick={()=>{showFewerFacets(type)}} className={styles.showButton}>Show Less</button>
            }
          </div>
        }
      </div>
    )
  }

  return (
    <div className={styles.resultsFilter}>
      <div className={styles.bottom}>
        <p className={styles.heading}>Filters</p>
        <div className={styles.labelContainer} >
          <p className={styles.subTwo}>Evidence</p>
        </div>
          <Checkbox
            handleClick={handleEvidenceActive}
            className={styles.evidenceCheckbox}
            checked={activeFilters.some(filter => isEvidenceFilter(filter))}>
              Minimum Number of Evidence
          </Checkbox>
          <SimpleRange
            label="Evidence Associated"
            hideLabel
            min="1"
            max="99"
            onChange={e => handleFacetChange('evi:', evidenceObject, setEvidenceObject, e)}
            initialValue={1}
          />
        <EntitySearch
          activeFilters={activeFilters}
          onFilter={onFilter}
        />
        <div className={styles.tagsContainer}>
          {
            groupedTags &&
            Object.keys(groupedTags).map((tagType, i) => {
              let typeHeadingMarkup = getTagHeadingMarkup(tagType);
              return (
                <>
                  {
                    // if there are tags within this group, display the heading
                    Object.keys(groupedTags[tagType]).length > 0 &&
                    typeHeadingMarkup
                  }
                  {
                    displayFacets(tagType)
                  }
                </>
              )
            })
          }
        </div>
        <button onClick={()=>onClearAll()} className={styles.clearAll}>Clear All</button>
      </div>
    </div>
  );
}

export default ResultsFilter;
