
import TextInput from "../Core/TextInput";
import Autocomplete from "../Autocomplete/Autocomplete";
import SearchIcon from '../../Icons/Buttons/Search.svg?react';
import styles from './QueryBar.module.scss';
import ArrowRight from "../../Icons/Directional/Arrows/Arrow Right.svg?react";
import QueryTypeIcon from "../QueryTypeIcon/QueryTypeIcon";
import Button from "../Core/Button";

const QueryBar = ({handleSubmission, handleChange, queryType, value, autocompleteItems, 
  autocompleteLoading, handleItemClick, disabled = false}) => {

  const placeholderText = (queryType) ? queryType.placeholder : '';
    
  value = (value !== undefined && value !== null) ? value : '';
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
      <div className={styles.inputContainer}>
        <span className={styles.icon}>
          <QueryTypeIcon type={queryType.searchTypeString}/>
        </span>
        {/* <input type="text" placeholder={placeholderText} handleChange={(e)=>handleChange(e)} className={styles.input} value={value} disabled={disabled} /> */}
        <TextInput 
          placeholder={placeholderText} 
          handleChange={(e)=>handleChange(e)} 
          className={styles.input}
          size=""
          value={value}
          disabled={disabled}
        />
        <Button handleClick={handleSubmission} className={styles.submitButton} iconOnly><ArrowRight/></Button>
      </div>
    </form>
  )
}

export default QueryBar;