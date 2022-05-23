import React, {useState, useEffect} from 'react';
import Select from '../FormFields/Select';
import Checkbox from '../FormFields/Checkbox';
import Radio from '../FormFields/Radio';
import Accordion from '../Accordion/Accordion';
import Range from '../Range/Range';
import cloneDeep from 'lodash/cloneDeep';

const ResultsFilter = ({startIndex, endIndex, activeFilters, formattedCount, totalCount, onSort, onFilter}) => {

  const [optionState, setOptionState] = useState(''); 
  const [minEvidence, setMinEvidence] = useState(1); 
  const [minEvidenceActive, setMinEvidenceActive] = useState(false); 

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
    onFilter({tag:'evi', value: minEvidence});
    setMinEvidenceActive(!minEvidenceActive)
  }
  const handleEvidenceRangeChange = (e) => {
    setMinEvidence(e.target.value);
  }
  
  useEffect(() => {
    if(minEvidenceActive) {
      onFilter({tag:'evi', value: minEvidence})
    }
  }, [minEvidence]);

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
            <button>Apply</button>
          </div>
          <Accordion 
            title="Filter & Sort"
            className="filter-sort"
            >
            <div className="filter-left">
              <p className="sub-one">Filter</p>
              <p className="sub-two">Evidence</p>
                <Checkbox handleClick={handleEvidenceActive}>Minimum Number of Evidence</Checkbox>
                <Range label="Minimum Number of Evidence" hideLabel min="1" max="99" onChange={e => handleEvidenceRangeChange(e)}/>
              <p className="sub-two">Species</p>
                <Checkbox handleClick={() => onFilter({tag:'hum', value: ''})}>Human</Checkbox>
                <Checkbox handleClick={() => onFilter({tag:'mou', value: ''})}>Mouse</Checkbox>
                <Checkbox handleClick={() => onFilter({tag:'zeb', value: ''})}>Zebrafish</Checkbox>
              <p className="sub-two">Tags</p>
                <Checkbox handleClick={() => onFilter({tag:'fda', value: ''})}>FDA Approved</Checkbox>
                <Checkbox handleClick={() => onFilter({tag:'ped', value: ''})}>Pediatric Indications</Checkbox>
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