import React, {useState} from 'react';
import styles from './EntitySearch.module.scss';
import Checkbox from '../FormFields/Checkbox';
import TextInput from '../FormFields/TextInput';


const EntitySearch = ({activeFilters, onFilter}) => {

  const [searchString, setSearchString] = useState('');
  const [searchStringObject, setSearchStringObject] = useState({tag:'str', value: searchString});

  const handleStringSearchChange = (value) => {
    if(searchStringObject.value !== value) {
      let newStringObj  = global.structuredClone(searchStringObject);
      newStringObj.value = value;
      setSearchStringObject(newStringObj);
    }
  }

  const handleKeyDown = (e) => {
    if(e.key === 'Enter') {
      if(searchStringObject.value !== '') {
        onFilter(searchStringObject);
        setSearchStringObject({tag:'str', value: ''})
      }
    }
  }

  return (
    <div className={styles.entitySearch}>
      <p className={`${styles.subTwo} sub-two`}>Entity Search</p>
      <TextInput 
        label="" 
        rows={1}
        maxLength={200}
        handleChange={(value)=> handleStringSearchChange(value)}
        handleKeyDown={handleKeyDown}
        className={styles.textInput}
        value={searchStringObject.value}
      />
      {/* <Checkbox handleClick={handleStringSearchActive} 
        checked={activeFilters.some(e => e.tag === searchStringObject.tag)}>
          Minimum Number of Evidence
      </Checkbox> */}

    </div>
  );
}

export default EntitySearch;