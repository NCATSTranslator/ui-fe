import {useState} from 'react';
import styles from './EntitySearch.module.scss';
import Tooltip from '../Tooltip/Tooltip';
import Alert from '../../Icons/Status/Alerts/Info.svg?react';
import Include from '../../Icons/Buttons/Checkmark/Circle Checkmark.svg?react';
import Exclude from '../../Icons/Buttons/View & Exclude/Exclude.svg?react';
import { cloneDeep } from 'lodash';
import { makeEntitySearch } from '../../Utilities/filterFunctions';

const EntitySearch = ({ onFilter, className }) => {

  const [entitySearch, setEntitySearch] = useState(makeEntitySearch());

  const handleEntitySearchChange = (value) => {
    if (entitySearch.value !== value) {
      const newEntitySearch = cloneDeep(entitySearch);
      newEntitySearch.value = value;
      setEntitySearch(newEntitySearch);
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleActivateFilter(false);
    }
  }

  const handleActivateFilter = (negated) => {
    if (entitySearch.value === '') return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'textFilterInputEnabled', inputValue: entitySearch.value, });
    const newEntitySearch = cloneDeep(entitySearch);
    newEntitySearch.negated = negated;
    onFilter(newEntitySearch);
    setEntitySearch(makeEntitySearch());
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
          onChange={(e)=> handleEntitySearchChange(e.target.value)}
          maxLength={200}
          value={entitySearch.value}
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
