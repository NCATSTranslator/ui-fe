import { FC, useState, useEffect, useCallback, KeyboardEvent, useRef } from 'react';
import styles from './Autocomplete.module.scss';
import { getMoreInfoLink, getIcon, formatBiolinkEntity } from '@/features/Common/utils/utilities';
import loadingIcon from '@/assets/images/loading/loading-purple.png';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import { AutocompleteItem } from '@/features/Query/types/querySubmission';
import OutsideClickHandler from '../OutsideClickHandler/OutsideClickHandler';

type AutocompleteProps = {
  isLoading: boolean;
  items: Array<AutocompleteItem> | null;
  handleItemClick: (item: AutocompleteItem) => void;
  onClearAutocomplete: () => void;
}

const Autocomplete: FC<AutocompleteProps> = ({
  isLoading,
  items,
  handleItemClick,
  onClearAutocomplete
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  // Reset selected index when items change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [items]);

  // Focus the container when it opens
  useEffect(() => {
    if (items && items.length > 0 && !isLoading && containerRef.current) {
      containerRef.current.focus();
    }
  }, [items, isLoading]);

  // Scroll selected item into view
  const scrollSelectedItemIntoView = useCallback((index: number) => {
    if (!itemsContainerRef.current || index < 0 || index >= (items?.length || 0)) return;
    
    const itemElements = itemsContainerRef.current.children;
    if (itemElements[index]) {
      const selectedItem = itemElements[index] as HTMLElement;
      const container = containerRef.current;
      
      if (container) {
        // Use scrollIntoView for better browser compatibility and smoother scrolling
        selectedItem.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [items]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!items || items.length === 0 || isLoading) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        event.stopPropagation();
        setSelectedIndex(prev => {
          const newIndex = prev < items.length - 1 ? prev + 1 : 0;
          // Scroll the new selected item into view
          scrollSelectedItemIntoView(newIndex);
          return newIndex;
        });
        break;
      case 'ArrowUp':
        event.preventDefault();
        event.stopPropagation();
        setSelectedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : items.length - 1;
          // Scroll the new selected item into view
          scrollSelectedItemIntoView(newIndex);
          return newIndex;
        });
        break;
      case 'Enter':
        event.preventDefault();
        event.stopPropagation();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          handleItemClick(items[selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        onClearAutocomplete();
        break;
    }
  }, [items, selectedIndex, isLoading, handleItemClick, onClearAutocomplete, scrollSelectedItemIntoView]);

  return (
    <OutsideClickHandler
      onOutsideClick={onClearAutocomplete}
      className={`${styles.autocompleteContainer} ${(items || isLoading) ? styles.open : ''} ${!!isLoading && styles.loading}`}
      data-testid="autocomplete-list"
      onKeyDown={handleKeyDown}
      ref={containerRef}
      tabIndex={-1}
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
        <div ref={itemsContainerRef}>
          {
            items.map((item, i) => {
              const type = (item?.types) ? item.types[0] : "";
              const typeString = formatBiolinkEntity(type);
              const icon = getIcon(type);
              const isSelected = i === selectedIndex;
              return (
                  <div 
                    key={i} 
                    className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
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
    </OutsideClickHandler>
  );
}

export default Autocomplete;
