
import React from "react";
import Button from "../FormFields/Button";
import TextInput from "../FormFields/TextInput";
import {ReactComponent as SearchIcon} from '../../Icons/Buttons/Search.svg';
import loadingIcon from '../../Assets/Images/Loading/loading.png';

import styles from './SimpleQueryBar.module.scss';

const SimpleQueryBar = ({handleSubmission, handleChange, isLoading, value, autocompleteItems, autocompleteLoading, handleItemClick}) => {

  value = (value !== undefined && value !== null) ? value : '';

  return (
    <form onSubmit={handleSubmission} className={styles.form}>
      <div className={`${styles.autocompleteContainer} ${(autocompleteItems.length > 0 || autocompleteLoading) ? styles.open : ''}`}>
        {
          autocompleteItems && !autocompleteLoading &&
          autocompleteItems.map((item, i) => {
            return <p key={i} className={styles.item} onClick={()=>handleItemClick(item.label)}>{item.label}</p>
          })
        }
        {
          autocompleteLoading &&
          <img src={loadingIcon} alt="loading icon" />
        }
        <div className={styles.sep}></div>
      </div>
      <span className={styles.prefix}>What drugs treat</span>
      <TextInput 
        placeholder="Enter a Disease" 
        handleChange={(e)=>handleChange(e)} 
        className={styles.input}
        size=""
        icon={<SearchIcon/>}
        value={value}
      />
      <Button type="submit" size="" disabled={isLoading}>
        <span>Search</span>
      </Button>
    </form>
  )
}

export default SimpleQueryBar;