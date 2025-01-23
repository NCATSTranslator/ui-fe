import {FC, useState, KeyboardEvent, useMemo} from 'react';
import styles from './EntitySearch.module.scss';
import Tooltip from '../Tooltip/Tooltip';
import Alert from '../../Icons/Status/Alerts/Info.svg?react';
import Include from '../../Icons/Buttons/Checkmark/Circle Checkmark.svg?react';
import Exclude from '../../Icons/Buttons/View & Exclude/Exclude.svg?react';
import { cloneDeep } from 'lodash';
import { isEntityFilter, makeEntitySearch } from '../../Utilities/filterFunctions';
import { Filter } from '../../Types/results';
import FacetTag from '../FacetTag/FacetTag';
import FacetHeading from '../FacetHeading/FacetHeading';

interface EntitySearchProps {
  activeFilters: Filter[];
  className?: string;
  onFilter: (filter: Filter) => void;
}


const EntitySearch: FC<EntitySearchProps> = ({ 
  activeFilters, 
  className = "",
  onFilter }) => {

  const [entitySearch, setEntitySearch] = useState<Filter>(makeEntitySearch());
  const activeEntityFilters = useMemo(()=> activeFilters.filter(filter => isEntityFilter(filter)), [activeFilters]);

  const handleEntitySearchChange = (value: string) => {
    if (entitySearch.value !== value) {
      const newEntitySearch = cloneDeep(entitySearch);
      newEntitySearch.value = value;
      setEntitySearch(newEntitySearch);
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleActivateFilter(false);
    }
  }

  const handleActivateFilter = (negated: boolean, filter?: Filter) => {
    if (entitySearch.value === '' && !filter) return;
    const newEntitySearch = (!!filter) ? filter : cloneDeep(entitySearch);
    newEntitySearch.negated = negated;
    onFilter(newEntitySearch);
    setEntitySearch(makeEntitySearch());
  }

  const handleInteractExistingEntity = (filter: Filter, currentChecked: boolean, currentClicked: boolean) => {
    if(currentChecked === currentClicked) {
      // remove
      onFilter(filter);
    } else {
      // remove and add inverse
      let newFilter = cloneDeep(filter);
      newFilter.negated = (filter.negated === undefined) ? false : !filter.negated;
      onFilter(newFilter);
    }
  }

  return (
    <div className={`${styles.entitySearch} ${!!className && className}`}>
      <FacetHeading
        title="Text Filter"
        tagFamily="str"
        activeFilters={activeFilters}
      >
        <span className={styles.tooltip}>Search all textual elements (result name, description, node names, edge names) for a given string.</span>
      </FacetHeading>
      <p className={`${styles.caption} caption`}>Include or exclude results or paths containing a word or phrase in the result name, description, or paths.</p>
      <span className={styles.inputContainer}>
        <input
          type="text"
          placeholder="Filter Terms"
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
            title="Include"
            aria-label="Include"
            >
            <Include/>
          </span>
          <span
            onClick={() => handleActivateFilter(true)}
            className={`${styles.checkbox} ${styles.negative}`}
            title="Exclude"
            aria-label="Exclude"
            >
            <Exclude/>
          </span>
        </div>
      </span>
      <div className={styles.activeFilters}>
        {
          activeEntityFilters.length > 0 &&
          activeEntityFilters.map((filter, i) => {
            return (
              <FacetTag 
                activeFilters={activeEntityFilters}
                family="str"
                onFilter={onFilter}
                filterObject={["g/str", filter]}
                setFilterObjectFunc={setEntitySearch}
                isEntitySearch={true}
                handleInteractExistingEntity={handleInteractExistingEntity}
              />
            )
          })
        }
      </div>
    </div>
  );
}

export default EntitySearch;
