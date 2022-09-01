
import React, {useState, useEffect} from "react";
import Button from "../FormFields/Button";
import TextInput from "../FormFields/TextInput";
import {ReactComponent as SearchIcon} from '../../Icons/Buttons/Search.svg';
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import styles from './SimpleQueryBar.module.scss';

const SimpleQueryBar = ({handleSubmission, handleChange, isLoading, value, 
  autocompleteItems, autocompleteLoading, handleItemClick}) => {

  const [submissionDisabled, setSubmissionDisabled] = useState(false);
    
  value = (value !== undefined && value !== null) ? value : '';

  useEffect(() => {
    setSubmissionDisabled(isLoading);
  }, [isLoading]);

  return (
    <form 
      onSubmit={(e)=>{
        e.preventDefault(); 
        handleSubmission()
      }} 
      className={styles.form}
      >
      <div className={`${styles.autocompleteContainer} ${(autocompleteItems.length > 0 || autocompleteLoading) ? styles.open : ''}`}>
        {
          autocompleteItems && !autocompleteLoading &&
          autocompleteItems.map((item, i) => {
            return <p key={i} className={styles.item} onClick={()=>handleItemClick(item)}>{item.label}</p>
          })
        }
        {
          autocompleteLoading &&
          <img src={loadingIcon} className={styles.loadingIcon} alt="loading icon" />
        }
        <div className={styles.sep}></div>
      </div>
      <span className={styles.prefix}>What drugs may treat</span>
      <TextInput 
        placeholder="Enter a Disease" 
        handleChange={(e)=>handleChange(e)} 
        className={styles.input}
        size=""
        icon={<SearchIcon/>}
        value={value}
      />
      <Button type="submit" size="" disabled={submissionDisabled}>
        <span>Search</span>
      </Button>
    </form>
  )
}

export default SimpleQueryBar;