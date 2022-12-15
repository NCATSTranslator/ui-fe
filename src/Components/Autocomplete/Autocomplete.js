import styles from './Autocomplete.module.scss';
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';

const Autocomplete = ({isLoading, items, handleItemClick}) => {

  return (
    <div 
      className={`${styles.autocompleteContainer} ${(items.length > 0 || isLoading) ? styles.open : ''}`}
      data-testid="autocomplete-list"
      >
      {
        items && !isLoading &&
        items.map((item, i) => {
          return <p key={i} className={styles.item} onClick={()=>handleItemClick(item)}>{item.label}</p>
        })
      }
      {
        isLoading &&
        <img src={loadingIcon} className={styles.loadingIcon} alt="loading icon" />
      }
    <div className={styles.sep}></div>
  </div>
  );
}

export default Autocomplete;