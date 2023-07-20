import {useState} from 'react';
import styles from './EntitySearch.module.scss';
import TextInput from '../FormFields/TextInput';
import Tooltip from '../Tooltip/Tooltip';
import {ReactComponent as Alert} from '../../Icons/Alerts/Info.svg';

const EntitySearch = ({activeFilters, onFilter}) => {

  const [searchStringObject, setSearchStringObject] = useState({type:'str:', value: ''});

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
        setSearchStringObject({type:'str:', value: ''})
      }
    }
  }

  return (
    <div className={styles.entitySearch}>
      <div className={styles.labelContainer}>
        <p className={`${styles.subTwo} sub-two`} data-tooltip-id="text-tooltip">Text Filter <Alert/></p>
        <Tooltip id="text-tooltip">
          <span className={styles.tooltip}>Search all textual elements (result name, description, node names, edge names) for a given string.</span>
        </Tooltip>
      </div>
      <TextInput
        label=""
        rows={1}
        maxLength={200}
        handleChange={(value)=> handleStringSearchChange(value)}
        handleKeyDown={handleKeyDown}
        className={styles.textInput}
        value={searchStringObject.value}
      />
    </div>
  );
}

export default EntitySearch;
