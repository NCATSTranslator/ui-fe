import React, {useState, useEffect} from 'react';
import styles from './ResultsFilter.module.scss';
import Checkbox from '../FormFields/Checkbox';
import SimpleRange from '../Range/SimpleRange';
import EntitySearch from '../EntitySearch/EntitySearch';
import Tooltip from '../Tooltip/Tooltip';
import {ReactComponent as Alert} from '../../Icons/Alerts/Info.svg';
import { capitalizeAllWords, formatBiolinkEntity } from '../../Utilities/utilities';

const ResultsFilter = ({activeFilters, onFilter, onClearAll, onClearTag, availableTags}) => {

  const facetShowMoreIncrement = 5;

  const [evidenceObject, setEvidenceObject] = useState({tag:'evi', value: 1});
  const [tagObject, setTagObject] = useState({tag:'tag', value: ''});
  const [groupedTags, setGroupedTags] = useState({});
  const [countsToShow, setCountsToShow] = useState(null);

  onClearAll = (!onClearAll) ? () => console.log("No clear all function specified in ResultsFilter.") : onClearAll;

  useEffect(() => {
    // when availableTags prop changes, group the tags according to their type
    let newGroupedTags = groupAvailableTags(availableTags)
    setGroupedTags(newGroupedTags);

    let newCountsToShow = {};
    Object.keys(newGroupedTags).forEach((key) => {
      newCountsToShow[key] = facetShowMoreIncrement;
    })

    setCountsToShow(newCountsToShow);

  }, [availableTags]);

  const handleEvidenceActive = () => {
    onFilter(evidenceObject);
  }

  const handleFacetChange = (facetID, objectToUpdate, setterFunction, label = '') => {
    if(objectToUpdate.value === facetID)
      return;

    let newObj = global.structuredClone(objectToUpdate);
    newObj.value = facetID;
    newObj.label = label;
    setterFunction(objectToUpdate);
    onFilter(newObj);
  }

  // returns a new object with each tag grouped by its type
  const groupAvailableTags = (tags) => {
    let clonedTags = global.structuredClone(tags);
    let atcTags = Object.fromEntries(Object.entries(clonedTags).filter(([key]) => key.includes('ATC')));
    let resultTypeTags = Object.fromEntries(Object.entries(clonedTags).filter(([key]) => key.includes('rc:')));
    let nodeTypeTags = Object.fromEntries(Object.entries(clonedTags).filter(([key]) => key.includes('pc:')));
    let fdaTags = Object.fromEntries(Object.entries(clonedTags).filter(([key]) => key.includes('fda')));
    const newGroupedTags = {
      fda: fdaTags,
      resultType: resultTypeTags,
      nodeType: nodeTypeTags,
      atc: atcTags
    }
    return newGroupedTags;
  }

  const getAtcHeading = () => {
    return (
      <div className={styles.labelContainer} >
        <div className={styles.label} data-tooltip-id="atc-tooltip" >
          <p className={styles.subTwo}>ATC Classification</p>
          <Alert/>
          <Tooltip id="atc-tooltip">
              <span className={styles.atcSpan}>The Anatomical Therapeutic Classification (ATC, <a href="https://www.whocc.no/atc_ddd_index/" target="_blank" rel="noreferrer" className={styles.tooltipLink}>click to learn more</a>) is a drug classification that categorizes active substances of drugs according to the organ or system where their therapeutic effect occurs.</span>
          </Tooltip>
        </div>
        <p className={styles.caption}>Filter on organ or system where drug's theraputic effect occurs.</p>
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
          <div className={styles.label} data-tooltip-id="biolink-tooltip" >
            <p className={styles.subTwo}>Result Type</p>
            <Alert/>
            <Tooltip id="biolink-tooltip">
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
        <div className={styles.label} data-tooltip-id="biolink-tooltip" >
          <p className={styles.subTwo}>Node Type</p>
          <Alert/>
          <Tooltip id="biolink-tooltip">
                <span className={styles.fdaSpan}>Click <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9372416/" target="_blank" rel='noreferrer' className={styles.tooltipLink}>here</a> to learn more about the Biolink Model.</span>
            </Tooltip>
          </div>
          <p className={styles.caption}>Show only results that include a node with a particular type (Drug, Chemical Entity, Small Molecule, etc.)</p>
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
      case 'atc':
        headingToReturn = getAtcHeading();
        break;
      default:
        headingToReturn = '';
    }
    return headingToReturn;
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

  const displayFacets = (type) => {
    return (
      <div className={styles.section}>
        { // Sort each set of tags, then map them to return each facet
          Object.entries(groupedTags[type]).sort((a,b)=> { return (a[1].name > b[1].name ? 1 : -1)}).slice(0, countsToShow[type]).map((tag, j) => {
            let tagKey = tag[0];
            let object = tag[1];
            let tagName = '';
            if (type === 'resultType' || type == 'nodeType') {
              tagName = formatBiolinkEntity(object.name);
            } else {
              tagName = object.name;
            }

            return (
              availableTags[tagKey] && availableTags[tagKey].count &&
              <div className={styles.facetContainer} key={j}>
                <Checkbox
                  handleClick={() => handleFacetChange(tagKey, tagObject, setTagObject, tagName)}
                  checked={activeFilters.some(e => e.tag === 'tag' && e.value === tagKey)}
                  className={styles.checkbox}
                  >
                  {tagName} <span className={styles.facetCount}>({(object.count) ? object.count : 0})</span>
                </Checkbox>
              </div>
            )
          })
        }
        <div className={styles.showButtonsContainer}>
          {
            Object.keys(groupedTags[type]).length > countsToShow[type] &&
            <button onClick={()=>{showMoreFacets(type)}} className={styles.showButton}>Show More</button>
          }
          {
            countsToShow[type] > facetShowMoreIncrement &&
            <button onClick={()=>{showFewerFacets(type)}} className={styles.showButton}>Show Less</button>
          }
        </div>
      </div>
    )
  }

  return (
    <div className={styles.resultsFilter}>
      <div className={styles.bottom}>
        <p className={styles.heading}>Filters</p>
        <EntitySearch
          activeFilters={activeFilters}
          onFilter={onFilter}
        />
        <div className={styles.labelContainer} >
          <p className={styles.subTwo}>Evidence</p>
        </div>
          <Checkbox
            handleClick={handleEvidenceActive}
            className={styles.evidenceCheckbox}
            checked={activeFilters.some(e => e.tag === evidenceObject.tag)}>
              Minimum Number of Evidence
          </Checkbox>
          <SimpleRange
            label="Evidence Associated"
            hideLabel
            min="1"
            max="99"
            onChange={e => handleFacetChange(e, evidenceObject, setEvidenceObject)}
            initialValue={1}
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
