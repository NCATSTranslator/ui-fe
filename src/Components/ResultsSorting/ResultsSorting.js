import React, {useState} from "react";
import styles from "./ResultsSorting.module.scss";
// import Radio from '../FormFields/Radio';
import Select from '../FormFields/Select';
import cloneDeep from 'lodash/cloneDeep';


const ResultsSorting = ({onSort, onHighlight}) => {

  const [optionState, setOptionState] = useState(''); 
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

  const handleHighlight = () => {
    onHighlight();
  }

  const handleOptionApply = (option) => {

    switch (option) {
      case "Highlight":
        handleHighlight();
        break;
        
      case "Newest Evidence":
        handleSorting('evidenceHighLow');
        break;
    
      default:
        console.log("No handler function yet created for this option.");
        break;
    }
  }

  return(
    <>
      <div className={styles.left}>
        <Select
          label="" 
          name="Sort By:"
          size="n"
          noanimate
          handleChange={(value)=>{
            setOptionState(value);
            handleOptionApply(value);
          }}
          value={optionState}
          >
          <option value="Newest Evidence" key="0" >Newest Evidence</option>
          <option value="Result Category" key="1">Result Category</option>
          <option value="Confidence" key="2">Confidence</option>
        </Select>
      </div>
      {/* <div className={styles.filterRight}>
        <p className={styles.subOne}>Sort By</p>
        <p className={styles.subTwo}>Name</p>
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
        <p className={styles.subTwo}>Date of Evidence</p>
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
        <p className={styles.subTwo}>Number of Evidence</p>
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
      </div> */}
    </>
  )
}

export default ResultsSorting;