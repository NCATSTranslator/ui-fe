import { FC } from 'react';
import styles from './Autocomplete.module.scss';
import { getMoreInfoLink, getIcon, formatBiolinkEntity } from '../../Utilities/utilities';
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import Tooltip from '../Tooltip/Tooltip';
import { AutocompleteItem } from '../../Types/querySubmission';

type AutocompleteProps = {
  isLoading: boolean;
  items: Array<AutocompleteItem> | null;
  handleItemClick: (item: AutocompleteItem) => void;
}

const Autocomplete: FC<AutocompleteProps> = ({isLoading, items, handleItemClick}) => {

  return (
    <div
      className={`${styles.autocompleteContainer} ${(items || isLoading) ? styles.open : ''} ${!!isLoading && styles.loading}`}
      data-testid="autocomplete-list"
      >
      {
        // isLoading &&
        <div className={styles.iconContainer}>
          <img src={loadingIcon} className={styles.loadingIcon} alt="loading icon" />
        </div>
      }
      {
        items && items.length === 0 && !isLoading &&
        <p className={styles.noResults}>No matching terms were found, please adjust your search term and try again.</p>
      }
      {
        items && items.length > 0 && !isLoading &&
        <div>
          {
            items.map((item, i) => {
              const type = item.types[0];
              const typeString = formatBiolinkEntity(type);
              const icon = getIcon(type);
              return (
                  <div key={i} className={styles.item}>
                    <span className={styles.icon} data-tooltip-id={`${type}${item.label}-${i}`}>
                      {icon}
                      <Tooltip id={`${type}${item.label}-${i}`} place="left">
                        <span className={styles.tooltip}>{typeString}</span>
                      </Tooltip>
                    </span>
                    <span className={`${styles.term} autocomplete-item`} onClick={()=>handleItemClick(item)}>
                      {item.label}{item.match && <span className={styles.match}>{` (${item.match})`}</span>}
                    </span>
                    {
                      type && 
                      <span className={styles.type}>{typeString}</span>
                    }
                    <span className={styles.link}>{getMoreInfoLink(item.id, styles.link)}</span>
                  </div>)
            })
          }
        </div>
      }
    </div>
  );
}

export default Autocomplete;
