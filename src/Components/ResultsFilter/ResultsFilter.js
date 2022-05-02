import React, {useState} from 'react';
import Toggle from '../Toggle/Toggle';
import Select from '../FormFields/Select';
import Checkbox from '../FormFields/Checkbox';
import Radio from '../FormFields/Radio';
import Accordion from '../Accordion/Accordion';
import Range from '../Range/Range';

const ResultsFilter = ({startIndex, endIndex, totalCount, onSort, onFilter}) => {

  const labelOne = "Chemical";
  const labelTwo = "Gene";
  
  const [optionState, setOptionState] = useState(''); 

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
                <Checkbox handleClick={()=>{onFilter('evi')}}>Minimum Number of Evidence</Checkbox>
                <Range label="Minimum Number of Evidence" hideLabel min="1" max="99" />
              <p className="sub-two">Species</p>
                <Checkbox handleClick={()=>{onFilter('hum')}}>Human</Checkbox>
                <Checkbox handleClick={()=>{onFilter('mou')}}>Mouse</Checkbox>
                <Checkbox handleClick={()=>{onFilter('zeb')}}>Zebrafish</Checkbox>
              <p className="sub-two">Tags</p>
                <Checkbox handleClick={()=>{onFilter('fda')}}>FDA Approved</Checkbox>
                <Checkbox handleClick={()=>{onFilter('ped')}}>Pediatric Indications</Checkbox>
            </div>
            <div className="filter-right">
              <p className="sub-one">Sort By</p>
              <p className="sub-two">Toxicity</p>
                <Radio>Low to High</Radio>
                <Radio>High to Low</Radio>
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