
import React from "react";
import Button from "../FormFields/Button";
import TextInput from "../FormFields/TextInput";
import {ReactComponent as SearchIcon} from '../../Icons/Buttons/Search.svg'

import styles from './SimpleQueryBar.module.scss';

const SimpleQueryBar = ({handleSubmission, handleChange, isLoading, value}) => {

  value = (value !== undefined && value !== null) ? value : '';

  return (
    <form onSubmit={handleSubmission} className={styles.form}>
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