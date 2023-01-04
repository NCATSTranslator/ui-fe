
import React, {useState, useEffect} from "react";
import Button from "../FormFields/Button";
import TextInput from "../FormFields/TextInput";
import Autocomplete from "../Autocomplete/Autocomplete";
import {ReactComponent as SearchIcon} from '../../Icons/Buttons/Search.svg';
import styles from './QueryBar.module.scss';

const QueryBar = ({handleSubmission, handleChange, isDisabled, value, 
  autocompleteItems, autocompleteLoading, handleItemClick}) => {

  const [submissionDisabled, setSubmissionDisabled] = useState(false);
    
  value = (value !== undefined && value !== null) ? value : '';

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
      <span className={styles.prefix}>What drugs may treat</span>
      <TextInput 
        placeholder="Enter a Disease" 
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