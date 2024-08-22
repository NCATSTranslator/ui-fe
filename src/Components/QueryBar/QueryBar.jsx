
import TextInput from "../FormFields/TextInput";
import Autocomplete from "../Autocomplete/Autocomplete";
import SearchIcon from '../../Icons/Buttons/Search.svg?react';
import styles from './QueryBar.module.scss';
import QueryTypeIcon from "../QueryTypeIcon/QueryTypeIcon";

const QueryBar = ({handleSubmission, handleChange, queryType, value, autocompleteItems, 
  autocompleteLoading, handleItemClick, disabled = false, placeholderText}) => {

  const placeholder = (!!placeholderText) ? placeholderText : (queryType) ? queryType.placeholder : '';
    
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
      <TextInput 
        placeholder={placeholder} 
        handleChange={(e)=>handleChange(e)} 
        className={styles.input}
        size=""
        iconLeft={<QueryTypeIcon type={queryType.searchTypeString}/>}
        iconRight={<SearchIcon/>}
        value={value}
        disabled={disabled}
      />
    </form>
  )
}

export default QueryBar;