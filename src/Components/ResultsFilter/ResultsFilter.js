import React, {useState, useEffect} from 'react';
import Select from '../FormFields/Select';
import Checkbox from '../FormFields/Checkbox';
import Radio from '../FormFields/Radio';
import Accordion from '../Accordion/Accordion';
import SimpleRange from '../Range/SimpleRange';
import TwoThumbRange from '../Range/TwoThumbRange';
import cloneDeep from 'lodash/cloneDeep';

const ResultsFilter = ({startIndex, endIndex, activeFilters, formattedCount, totalCount, onSort, onFilter, onHighlight}) => {

  const [optionState, setOptionState] = useState(''); 
  const [minEvidence, setMinEvidence] = useState(1); 
  const [evidenceObject, setEvidenceObject] = useState({tag:'evi', value: minEvidence});
  const dateRangeMin = 1840;
  const dateRangeMax = 2022;
  const [dateRange, setDateRange] = useState([dateRangeMin, dateRangeMax]);
  const [dateRangeObject, setDateRangeObject] = useState({tag:'date', value: dateRange});
  const humanSpeciesObject = {tag:'hum', value: ''};
  const mouseSpeciesObject = {tag:'mou', value: ''};
  const fdaObject = {tag:'fda', value: ''};

  onHighlight = (!onHighlight) ? () => console.log("No highlight function specified in ResultsFilter.") : onHighlight; 

  const [sortingOptions, setSortingOptions] = useState(
    {
      nameLowHigh: {
        name: 'nameLowHigh',
        active: false
      },
      nameHighLow: {
        name: 'nameHighLow',
        active: false
      },     
      dateLowHigh: {
        name: 'dateLowHigh',
        active: false
      },
      dateHighLow: {
        name: 'dateHighLow',
        active: false
      },   
      evidenceLowHigh: {
        name: 'evidenceLowHigh',
        active: false
      },
      evidenceHighLow: {
        name: 'evidenceHighLow',
        active: false
      },   
    }
  );

  const handleSorting = (sortName) => {
    let newSortingOptions = cloneDeep(sortingOptions);
    Object.values(newSortingOptions).map((option)=> {
      if(option.name === sortName)
        option.active = true;
      else 
        option.active = false;
      return option;
    })
    setSortingOptions(()=>newSortingOptions);
    onSort(sortName);
  }
  
  const handleEvidenceActive = () => {
    onFilter(evidenceObject);
  }
  const handleEvidenceRangeChange = (value) => {
    let newEviObj  = structuredClone(evidenceObject);
    newEviObj.value = value;
    setEvidenceObject(newEviObj);
    onFilter(newEviObj);
  }

  const handleDateRangeActive = () => {
    onFilter(dateRangeObject);
  }
  const handleDateRangeChange = (value) => {
    let newDateObj  = structuredClone(dateRangeObject);
    newDateObj.value = value;
    setDateRangeObject(newDateObj);
    onFilter(newDateObj);
  }

  const handleHighlight = () => {
    onHighlight();
  }

  const handleOptionApply = () => {

    switch (optionState) {
      case "Highlight":
        handleHighlight();
        break;
    
      default:
        console.log("No handler function yet created for this option.");
        break;
    }
  }

  return (
    <div className="results-filter">
      <div className="top">
        <p className="results-count">
          Showing <span className="range">
            <span className='start'>{startIndex}</span>
            -
            <span>{endIndex}</span>
          </span> of 
          <span className="count"> {formattedCount} </span>
          {
            (formattedCount !== totalCount) &&
            <span className='total'>({totalCount}) </span>
          }
          <span> Results</span>
        </p>
      </div>
      <div className="bottom">
          <div className='left'>
            <Select
              label="" 
              size="s" 
              name="Options"
              noanimate
              handleChange={(value)=>{
                setOptionState(value);
              }}
              value={optionState}
              >
              <option value="Highlight" key="0" >Highlight</option>
              <option value="Hide" key="1">Hide</option>
              <option value="Compare" key="2">Compare</option>
            </Select>
            <button onClick={handleOptionApply}>Apply</button>
          </div>
          <Accordion 
            title="Filter & Sort"
            className="filter-sort"
            >
            <div className="filter-left">
              <p className="sub-one">Filter</p>
              <p className="sub-two">Evidence</p>
                <Checkbox handleClick={handleEvidenceActive} 
                  checked={activeFilters.some(e => e.tag === evidenceObject.tag)}>
                    Minimum Number of Evidence
                </Checkbox>
                <SimpleRange 
                  label="Minimum Number of Evidence" 
                  hideLabel 
                  min="1" 
                  max="99" 
                  onChange={e => handleEvidenceRangeChange(e)}
                  initialValue={1} />
              <p className="sub-two"></p>
                <Checkbox handleClick={handleDateRangeActive} 
                  checked={activeFilters.some(e => e.tag === dateRangeObject.tag)}>
                    Date Range
                </Checkbox>
                <TwoThumbRange 
                  label="Date Range" 
                  hideLabel 
                  min={dateRangeMin} 
                  max={dateRangeMax} 
                  onChange={e => handleDateRangeChange(e)}
                  initialValues={dateRange} />
              <p className="sub-two">Species</p>
                <Checkbox handleClick={() => onFilter(humanSpeciesObject)} 
                  checked={activeFilters.some(e => e.tag === humanSpeciesObject.tag)}>
                    Human
                </Checkbox>
                <Checkbox handleClick={() => onFilter(mouseSpeciesObject)} 
                  checked={activeFilters.some(e => e.tag === mouseSpeciesObject.tag)}>
                    Mouse
                </Checkbox>
              <p className="sub-two">Tags</p>
                <Checkbox handleClick={() => onFilter(fdaObject)} 
                  checked={activeFilters.some(e => e.tag === fdaObject.tag)}>
                    FDA Approved
                </Checkbox>
            </div>
            <div className="filter-right">
              <p className="sub-one">Sort By</p>
              <p className="sub-two">Name</p>
                <Radio 
                  handleClick={() => handleSorting('nameLowHigh')} 
                  checked={sortingOptions.nameLowHigh.active}
                  >
                  A &gt; Z
                </Radio>
                <Radio 
                  handleClick={() => handleSorting('nameHighLow')} 
                  checked={sortingOptions.nameHighLow.active}
                  >
                  Z &lt; A
                </Radio>
              <p className="sub-two">Date of Evidence</p>
                <Radio 
                  handleClick={() => handleSorting('dateHighLow')} 
                  checked={sortingOptions.dateHighLow.active}
                  >
                  Newest
                </Radio>
                <Radio 
                  handleClick={() => handleSorting('dateLowHigh')} 
                  checked={sortingOptions.dateLowHigh.active}
                  >
                  Oldest
                </Radio>
              <p className="sub-two">Number of Evidence</p>
                <Radio 
                  handleClick={() => handleSorting('evidenceLowHigh')} 
                  checked={sortingOptions.evidenceLowHigh.active}
                  >
                  Low to High
                </Radio>
                <Radio 
                  handleClick={() => handleSorting('evidenceHighLow')} 
                  checked={sortingOptions.evidenceHighLow.active}
                  >
                  High to Low
                </Radio>
            </div>
          </Accordion>
      </div>
    </div>
  );
}

export default ResultsFilter;