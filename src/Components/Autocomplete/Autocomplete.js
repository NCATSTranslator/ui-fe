import styles from './Autocomplete.module.scss';
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import { useCallback, useState, useEffect } from 'react';

const Autocomplete = ({isLoading, items, handleItemClick}) => {

  const [numberVisibleItems, setNumberVisibleItems] = useState(0);
  const pageLength = 10;

  const showMoreItems = useCallback((e) => {
    e.stopPropagation();
    if(numberVisibleItems + pageLength >= items.length)
      setNumberVisibleItems(items.length);
    else
      setNumberVisibleItems((prev) => prev + pageLength);

  }, [numberVisibleItems]);

  const showFewerItems = useCallback((e) => {
    e.stopPropagation();
    if(numberVisibleItems - pageLength <= pageLength)
      setNumberVisibleItems(pageLength);
    else
      setNumberVisibleItems((prevNumVisItems) => prevNumVisItems - pageLength);

  }, [numberVisibleItems]);

  useEffect(() => {
    let initNumberVisibleItems = (items.length > pageLength) ? pageLength : items.length;
    setNumberVisibleItems(initNumberVisibleItems);
  }, [items]);

  return (
    <div 
      className={`${styles.autocompleteContainer} ${(items.length > 0 || isLoading) ? styles.open : ''}`}
      data-testid="autocomplete-list"
      >
      {
        items && !isLoading &&
        items.slice(0, numberVisibleItems).map((item, i) => {
          return <p key={i} className={styles.item} onClick={()=>handleItemClick(item)}>{item.label}</p>
        })
      }
      {
        isLoading &&
        <img src={loadingIcon} className={styles.loadingIcon} alt="loading icon" />
      }
    {
      !isLoading &&
      <div>
        <div className={styles.sep}></div>
        <div className={styles.buttonsContainer}>
          {
            items.length > pageLength && !isLoading &&
            <button 
              onClick={(e)=>showMoreItems(e)} 
              className={`${styles.button} ${(numberVisibleItems < items.length) ? styles.active : styles.inactive}`} 
              >
              Show More
            </button>
          }
          {
            items.length > pageLength && !isLoading &&
            <button 
              onClick={(e)=>showFewerItems(e)} 
              className={`${styles.button} ${(numberVisibleItems > pageLength) ? styles.active : styles.inactive}`}
              >
              Show Less
            </button>
          }
        </div>
      </div>
    }
  </div>
  );
}

export default Autocomplete;