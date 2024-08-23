import styles from './Autocomplete.module.scss';
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import { getMoreInfoLink, getIcon, formatBiolinkEntity } from '../../Utilities/utilities';
import Tooltip from '../Tooltip/Tooltip';

const Autocomplete = ({isLoading, items, handleItemClick}) => {

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
        items && items.length === 1 && items[0] === 'node_norm_error' &&
        <p className={styles.nodeNormError}>Unable to retrieve search terms due to an outage with the Node Normalizer. Click <a href="https://smart-api.info/registry/translator?q=node%20normalizer&tags=translator" rel="noreferrer" target="_blank">here</a> for more details, or try again later.</p>
      }
      {
        items && items.length === 0 && !isLoading &&
        <p className={styles.noResults}>No matching terms were found, please adjust your search term and try again.</p>
      }
      {
        items && items.length > 0 && !isLoading && items[0] !== 'node_norm_error' && 
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
