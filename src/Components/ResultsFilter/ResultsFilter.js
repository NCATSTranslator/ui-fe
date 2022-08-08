import React, {useState} from 'react';
import styles from './ResultsFilter.module.scss';
import Checkbox from '../FormFields/Checkbox';
import Radio from '../FormFields/Radio';
import SimpleRange from '../Range/SimpleRange';
import TwoThumbRange from '../Range/TwoThumbRange';

const ResultsFilter = ({startIndex, endIndex, activeFilters, formattedCount, totalCount, onFilter, onHighlight}) => {

  const [minEvidence, setMinEvidence] = useState(1); 
  const [evidenceObject, setEvidenceObject] = useState({tag:'evi', value: minEvidence});
  const dateRangeMin = 1840;
  const dateRangeMax = 2022;
  const dateRange = [dateRangeMin, dateRangeMax];
  const [dateRangeObject, setDateRangeObject] = useState({tag:'date', value: dateRange});
  const fdaObject = {tag:'fda', value: ''};

  onHighlight = (!onHighlight) ? () => console.log("No highlight function specified in ResultsFilter.") : onHighlight; 

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
        <p className={styles.subTwo}></p>
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
          />
        <p className={styles.subTwo}>FDA Status</p>
          <Checkbox handleClick={() => onFilter(fdaObject)} 
            checked={activeFilters.some(e => e.tag === fdaObject.tag)}>
              Approved
          </Checkbox>
      </div>
    </div>
  );
}

export default ResultsFilter;