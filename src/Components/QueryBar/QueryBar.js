
import TextInput from "../FormFields/TextInput";
import Autocomplete from "../Autocomplete/Autocomplete";
import {ReactComponent as SearchIcon} from '../../Icons/Buttons/Search.svg';
import styles from './QueryBar.module.scss';

const QueryBar = ({handleSubmission, handleChange, queryType, value, autocompleteItems, autocompleteLoading, handleItemClick}) => {

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
      <TextInput 
        placeholder={placeholderText} 
        handleChange={(e)=>handleChange(e)} 
        className={styles.input}
        size=""
        icon={<SearchIcon/>}
        value={value}
      />
    </form>
  )
}

export default QueryBar;