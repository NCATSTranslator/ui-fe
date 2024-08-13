import {useState} from 'react';
import styles from './EntitySearch.module.scss';
import Tooltip from '../Tooltip/Tooltip';
import Alert from '../../Icons/Status/Alerts/Info.svg?react';
import Include from '../../Icons/Buttons/Checkmark/Circle Checkmark.svg?react';
import Exclude from '../../Icons/Buttons/View & Exclude/Exclude.svg?react';
import { cloneDeep } from 'lodash';

const EntitySearch = ({ onFilter, className }) => {

  const [searchStringObject, setSearchStringObject] = useState({type:'str:', value: '', negated: false});

  const handleStringSearchChange = (value) => {
    if(searchStringObject.value !== value) {
      let newStringObj  = cloneDeep(searchStringObject);
      newStringObj.value = value;
      setSearchStringObject(newStringObj);
    }
  }

  const handleKeyDown = (e) => {
    if(e.key === 'Enter') {
      handleActivateFilter(false);
    }
  }

  const handleActivateFilter = (negated) => {
    if(searchStringObject.value === '') 
      return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'textFilterInputEnabled',
      inputValue: searchStringObject.value,
    });
    let newSearchStringObject = cloneDeep(searchStringObject);
    newSearchStringObject.negated = negated;
    onFilter(newSearchStringObject);
    setSearchStringObject({type:'str:', value: '', negated: false})
  }

  return (
    <div className={`${styles.entitySearch} ${!!className && className}`}>
      <div className={styles.labelContainer}>
        <p className={`${styles.subTwo} sub-two`} data-tooltip-id="text-tooltip">Text Filter <Alert/></p>
        <p className={`${styles.caption} caption`}>Include or exclude results or paths containing a word or phrase in the result name, description, or paths.</p>
        <Tooltip id="text-tooltip">
          <span className={styles.tooltip}>Search all textual elements (result name, description, node names, edge names) for a given string.</span>
        </Tooltip>
      </div>
      <span className={styles.inputContainer}>
        <input 
          type="text" 
          placeholder="Filter Terms" 
          size="1" 
          onChange={(e)=> handleStringSearchChange(e.target.value)} 
          maxLength={200}
          value={searchStringObject.value}
          onKeyDown={handleKeyDown}
          className={styles.textInput}
        />
        <div className={styles.checkboxContainer}>
          <span
            onClick={() => handleActivateFilter(false)}
            className={`${styles.checkbox} ${styles.positive}`}
            >
            <Include/>
          </span>
          <span
            onClick={() => handleActivateFilter(true)}
            className={`${styles.checkbox} ${styles.negative}`}
            >
            <Exclude/>
          </span>
        </div>
      </span>
    </div>
  );
}

export default EntitySearch;
