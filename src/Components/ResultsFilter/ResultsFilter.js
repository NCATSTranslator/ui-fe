import React, {useState, useEffect, useRef} from 'react';
import styles from './ResultsFilter.module.scss';
import Checkbox from '../FormFields/Checkbox';
import SimpleRange from '../Range/SimpleRange';
// import TwoThumbRange from '../Range/TwoThumbRange';
import EntitySearch from '../EntitySearch/EntitySearch';
import Tooltip from '../Tooltip/Tooltip';
import {ReactComponent as Alert} from '../../Icons/Alerts/Info.svg';
import { capitalizeAllWords } from '../../Utilities/utilities';

const ResultsFilter = ({activeFilters, onFilter, onClearAll, onClearTag, availableTags}) => {
  
  // eslint-disable-next-line
  const [minEvidence, setMinEvidence] = useState(1); 
  const [evidenceObject, setEvidenceObject] = useState({tag:'evi', value: minEvidence});
  const [activeTag, setActiveTag] = useState(''); 
  const [tagObject, setTagObject] = useState({tag:'tag', value: ''});
  const ATCHeadingAdded = useRef(false);
  
  const [formattedTags, setFormattedTags] = useState({tag:'tag', value: ''});

  const [fdaTooltipActive, setFdaTooltipActive] = useState(false);
  const [atcTooltipActive, setAtcTooltipActive] = useState(false);

  onClearAll = (!onClearAll) ? () => console.log("No clear all function specified in ResultsFilter.") : onClearAll; 

  const handleEvidenceActive = () => {
    onFilter(evidenceObject);
  }

  const handleFacetChange = (value, objectToUpdate, setterFunction, label = '') => {
    if(objectToUpdate.value === value)
      return;
    
    let newObj = global.structuredClone(objectToUpdate);
    newObj.value = value;
    newObj.label = label;
    setterFunction(objectToUpdate);
    onFilter(newObj);
  }

  useEffect(() => {
    console.log(availableTags)
    console.log(Object.keys(availableTags))
  }, [availableTags]);

  const AtcHeading = () => {
    return (
      <div className={styles.fdaContainer} onMouseEnter={()=>{setAtcTooltipActive(true)}} onMouseLeave={()=>{setAtcTooltipActive(false)}} >
        <p className={styles.subTwo}>ATC Classification</p>
        <Alert/>
        <Tooltip 
          left
          above
          delay={350}
          active={atcTooltipActive} 
          onClose={() => setAtcTooltipActive(false)}
          text={<span className={styles.atcSpan}>The Anatomical Therapeutic Classification (ATC, <a href="https://www.whocc.no/atc_ddd_index/" target="_blank" className={styles.atcLink}>https://www.whocc.no/atc_ddd_index/</a>) is a drug classification that categorizes active substances of drugs according to the organ or system where their therapeutic effect occurs.</span>}
          >
        </Tooltip>
      </div>
    )
  }

  const FdaHeading = () => {
    return(      
      <div className={styles.fdaContainer} onMouseEnter={()=>{setFdaTooltipActive(true)}} onMouseLeave={()=>{setFdaTooltipActive(false)}} >
        <p className={styles.subTwo}>FDA Status</p>
        <Alert/>
        <Tooltip 
          left
          above
          delay={350}
          active={fdaTooltipActive} 
          onClose={() => setFdaTooltipActive(false)}
          text='Please note that an “Approved” status does not mean that the FDA has approved these drugs to treat the disease(s) you specified in your search, but rather that they have been approved to treat a specific disease or condition.'
          >
        </Tooltip>
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
        <p className={styles.subTwo}>Evidence</p>
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
            availableTags &&
            Object.keys(availableTags).sort().map((tag, i) => {
              let addFdaHeading = false;
              let addAtcHeading = false;
              let tagName = capitalizeAllWords(availableTags[tag].name);
              if(tag.includes('fda')) {
                addFdaHeading = true;
              }
              if(tag.includes('ATC') 
                && 
                (Object.keys(availableTags).sort()[i-1] === undefined || !Object.keys(availableTags).sort()[i-1].includes('ATC'))) {
                addAtcHeading = true;
              }

              return(
                <div className={styles.facetContainer}>
                  {
                    addAtcHeading &&
                    <AtcHeading/>
                  }
                  {
                    addFdaHeading && 
                    <FdaHeading/>
                  }
                  <Checkbox 
                    handleClick={() => handleFacetChange(tag, tagObject, setTagObject, tagName)}
                    checked={activeFilters.some(e => e.tag === 'tag' && e.value === tag)}
                    >
                    {tagName}
                  </Checkbox>
                </div>
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