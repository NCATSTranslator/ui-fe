import { FC, useEffect, KeyboardEvent, RefObject } from 'react';
import styles from './Autocomplete.module.scss';
import { getMoreInfoLink, getIcon, formatBiolinkEntity } from '@/features/Common/utils/utilities';
import loadingIcon from '@/assets/images/loading/loading-purple.png';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import { AutocompleteItem } from '@/features/Query/types/querySubmission';
import OutsideClickHandler from '@/features/Common/components/OutsideClickHandler/OutsideClickHandler';

type AutocompleteProps = {
  isLoading: boolean;
  items: Array<AutocompleteItem> | null;
  scrollingIndex: number;
  setScrollingIndex: (index: number | ((index: number) => number)) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleItemClick: (item: AutocompleteItem) => void;
  handleKeyDown: (event: KeyboardEvent) => void;
  handleScrolling: (index: number) => void;
  handleSelect: () => void;
  autocompleteItemsRef: RefObject<HTMLDivElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  itemsContainerRef: RefObject<HTMLDivElement | null>;
}

const Autocomplete: FC<AutocompleteProps> = ({
  isLoading,
  items,
  scrollingIndex,
  setScrollingIndex,
  selectedIndex,
  setSelectedIndex,
  handleItemClick,
  handleKeyDown,
  handleScrolling,
  handleSelect,
  autocompleteItemsRef,
  containerRef,
  itemsContainerRef,
}) => {
  useEffect(() => handleScrolling(scrollingIndex), []);

  return (
    <OutsideClickHandler
      onOutsideClick={() => { return; }}
      className={`${styles.autocompleteContainer} ${(items || isLoading) ? styles.open : ''} ${!!isLoading && styles.loading}`}
      data-testid="autocomplete-list"
      onKeyDown={handleKeyDown}
      ref={(elem) => {
        containerRef.current = elem;
        autocompleteItemsRef.current = elem;
      }}
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
              const isSelected = i === scrollingIndex;
              return (
                  <div
                    key={i}
                    className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                    onMouseEnter={() => setScrollingIndex(i)}
                  >
                    <span className={styles.icon} data-tooltip-id={`${type}${item.label}-${i}`}>
                      {icon}
                      <Tooltip id={`${type}${item.label}-${i}`} place="left">
                        <span className={styles.tooltip}>{typeString}</span>
                      </Tooltip>
                    </span>
                    <span className={`${styles.term} autocomplete-item`}
                          onClick={()=> {
                            setSelectedIndex(scrollingIndex);
                            handleSelect();
                            handleItemClick(item)
                          }}
                          title={item.match ? `${item.label} (${item.match})` : item.label}>
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
