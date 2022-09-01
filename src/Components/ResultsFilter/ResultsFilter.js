import React, {useState} from 'react';
import styles from './ResultsFilter.module.scss';
import Checkbox from '../FormFields/Checkbox';
import SimpleRange from '../Range/SimpleRange';
import TwoThumbRange from '../Range/TwoThumbRange';
import Tooltip from '../Tooltip/Tooltip';
import {ReactComponent as Alert} from '../../Icons/Alerts/Info.svg';
import { debounce } from 'lodash';

const ResultsFilter = ({activeFilters, onFilter, onHighlight, onClearAll}) => {
  
  // eslint-disable-next-line
  const [minEvidence, setMinEvidence] = useState(1); 
  const [evidenceObject, setEvidenceObject] = useState({tag:'evi', value: minEvidence});
  const dateRangeMin = 1840;
  const dateRangeMax = 2022;
  const dateRange = [dateRangeMin, dateRangeMax];
  const [dateRangeObject, setDateRangeObject] = useState({tag:'date', value: dateRange});
  const fdaObject = {tag:'fda', value: ''};

  const [fdaTooltipActive, setFdaTooltipActive] = useState(false);

  // const handleOnMouseEnter = debounce((type) => {
  //   setFdaTooltipActive(true)
  // }, 350)

  // const handleOnMouseLeave = (type) => {
  //   setFdaTooltipActive(false)
  //   handleOnMouseEnter.cancel()
  // }

  onHighlight = (!onHighlight) ? () => console.log("No highlight function specified in ResultsFilter.") : onHighlight; 
  onClearAll = (!onClearAll) ? () => console.log("No clear all function specified in ResultsFilter.") : onClearAll; 

  const handleEvidenceActive = () => {
    onFilter(evidenceObject);
  }
  const handleEvidenceRangeChange = (value) => {
    if(evidenceObject.value !== value) {
      let newEviObj  = global.structuredClone(evidenceObject);
      newEviObj.value = value;
      setEvidenceObject(newEviObj);
      onFilter(newEviObj);
    }
  }

  const handleDateRangeActive = () => {
    onFilter(dateRangeObject);
  }
  const handleDateRangeChange = (value) => {
    let newDateObj  = global.structuredClone(dateRangeObject);
    newDateObj.value = value;
    setDateRangeObject(newDateObj);
    onFilter(newDateObj);
  }

  return (
    <div className={styles.resultsFilter}>
      <div className={styles.bottom}>
        <p className={styles.heading}>Filters</p>
        <p className={styles.subTwo}>Evidence</p>
          <Checkbox handleClick={handleEvidenceActive} 
            checked={activeFilters.some(e => e.tag === evidenceObject.tag)}>
              Minimum Number of Evidence
          </Checkbox>
          <SimpleRange 
            label="Evidence Associated" 
            hideLabel 
            min="1" 
            max="99" 
            onChange={e => handleEvidenceRangeChange(e)}
            initialValue={1}
          />
        {/* <p className={styles.subTwo}></p>
          <Checkbox handleClick={handleDateRangeActive} 
            checked={activeFilters.some(e => e.tag === dateRangeObject.tag)}>
              Date Range
          </Checkbox>
          <TwoThumbRange 
            label="Date Published Range" 
            hideLabel 
            min={dateRangeMin} 
            max={dateRangeMax} 
            onChange={e => handleDateRangeChange(e)}
            initialValues={dateRange} 
          /> */}
        <div className={styles.fdaContainer} onMouseEnter={()=>{setFdaTooltipActive(true)}} onMouseLeave={()=>{setFdaTooltipActive(false)}} >
          <p className={styles.subTwo}>FDA Status</p>
          <Alert/>
          <Tooltip 
            left
            above
            delay={350}
            active={fdaTooltipActive} 
            onClose={() => setFdaTooltipActive(false)}
            text='Checkmarks in this column indicate drugs that have been approved by the FDA for the use of treating a specific disease or condition. This does not mean that the FDA has approved these drugs to treat the disease(s) you specified in your search.'
            >
          </Tooltip>
        </div>
        <Checkbox handleClick={() => onFilter(fdaObject)} 
          checked={activeFilters.some(e => e.tag === fdaObject.tag)}>
            Approved
        </Checkbox>

        <button onClick={()=>onClearAll()} className={styles.clearAll}>Clear All</button>
      </div>
    </div>
  );
}

export default ResultsFilter;