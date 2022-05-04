import React, {useState, useEffect} from 'react';
import Toggle from '../Toggle/Toggle';
import Select from '../FormFields/Select';
import Checkbox from '../FormFields/Checkbox';
import Radio from '../FormFields/Radio';
import Accordion from '../Accordion/Accordion';
import Range from '../Range/Range';

const ResultsFilter = ({startIndex, endIndex, totalCount, onSort, onFilter}) => {

  
  const [optionState, setOptionState] = useState(''); 
  const [minEvidence, setMinEvidence] = useState(1); 
  const [minEvidenceActive, setMinEvidenceActive] = useState(false); 

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
          <span className="total"> {totalCount}</span> <span>Results</span>
        </p>
        {/* <Toggle labelInternal={false} labelOne={labelOne} labelTwo={labelTwo} onClick={()=>{}} /> */}
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
                <Checkbox handleClick={()=>{onFilter({tag:'hum', value: ''})}}>Human</Checkbox>
                <Checkbox handleClick={()=>{onFilter({tag:'mou', value: ''})}}>Mouse</Checkbox>
                <Checkbox handleClick={()=>{onFilter({tag:'zeb', value: ''})}}>Zebrafish</Checkbox>
              <p className="sub-two">Tags</p>
                <Checkbox handleClick={()=>{onFilter({tag:'fda', value: ''})}}>FDA Approved</Checkbox>
                <Checkbox handleClick={()=>{onFilter({tag:'ped', value: ''})}}>Pediatric Indications</Checkbox>
            </div>
            <div className="filter-right">
              <p className="sub-one">Sort By</p>
              <p className="sub-two">Name</p>
                <Radio>A &gt; Z</Radio>
                <Radio>Z &lt; A </Radio>
              <p className="sub-two">Date of Evidence</p>
                <Radio>Newest</Radio>
                <Radio>Oldest</Radio>
              <p className="sub-two">Number of Evidence</p>
                <Radio>Low to High</Radio>
                <Radio>High to Low</Radio>
            </div>
          </Accordion>
      </div>
    </div>
  );
}

export default ResultsFilter;