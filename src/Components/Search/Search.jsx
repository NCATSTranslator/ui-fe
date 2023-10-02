import SearchIcon from '../../Icons/Buttons/Search.svg?react';
import styles from './Search.module.scss';

const Search = ({iconInternal, handleClick, size }) => {

  const containerClass = (iconInternal) ? styles.internal : styles.external;
  size = (size === undefined) ? 's' : size;
  
  return (
    <div className={`${styles.searchContainer} ${containerClass} ${size}`}> 
      <input type="text" placeholder="Search" className={styles.searchInput}/>
      {!iconInternal && <button className={styles.searchButton} onClick={handleClick}><SearchIcon /></button>}
    </div>
  );
}

export default Search;