
import React, {useState, useEffect, useRef} from "react";
import Button from "../FormFields/Button";
import TextInput from "../FormFields/TextInput";
import Autocomplete from "../Autocomplete/Autocomplete";
import Select from "../FormFields/Select";
import {ReactComponent as SearchIcon} from '../../Icons/Buttons/Search.svg';
import { queryTypes } from "../../Utilities/queryTypes";
import styles from './QueryBar.module.scss';

const QueryBar = ({handleSubmission, handleChange, handleQueryTypeChange, isDisabled, value, 
  autocompleteItems, autocompleteLoading, handleItemClick}) => {

  const [submissionDisabled, setSubmissionDisabled] = useState(false);
  const [queryType, setQueryType] = useState('');
  const placeholderText = useRef('');
    
  value = (value !== undefined && value !== null) ? value : '';

  const handleTypeChange = (value) =>{
    // get selected query from array by id
    const newCurrentQueryType = queryTypes.find(type => {
      return type.id === parseInt(value)
    })
    // set placeholder text
    placeholderText.current = newCurrentQueryType.placeholder;
    // update the current query type 
    setQueryType(newCurrentQueryType);
    // handle type change callback
    handleQueryTypeChange(newCurrentQueryType);
  }

  useEffect(() => {
    setSubmissionDisabled(isDisabled);
  }, [isDisabled]);

  return (
    <form 
      onSubmit={(e)=>{
        e.preventDefault(); 
        handleSubmission()
      }} 
      className={styles.form}
      >
      <Autocomplete 
        isLoading={autocompleteLoading}
        items={autocompleteItems}
        handleItemClick={handleItemClick}
      />
      <Select
        label="" 
        name="Select a Query"
        handleChange={handleTypeChange}
        value={queryType.id}
        className={styles.prefix}
        iconClass={styles.prefixIcon}
        noanimate
      >
        {
          queryTypes.map((type) => {
            return (
              <option value={type.id} key={type.id}>{type.label}</option>
            )
          })
        }
      </Select>
      <TextInput 
        placeholder={placeholderText.current} 
        handleChange={(e)=>handleChange(e)} 
        className={styles.input}
        size=""
        icon={<SearchIcon/>}
        value={value}
      />
      <Button type="submit" size="" disabled={submissionDisabled} testId="query-submit">
        <span>Search</span>
      </Button>
    </form>
  )
}

export default QueryBar;