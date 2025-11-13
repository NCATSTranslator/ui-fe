import { FC, useRef, useState, useCallback, useEffect, KeyboardEvent, RefObject } from 'react';
import styles from './AutocompleteInput.module.scss';
import TextInput from '@/features/Core/components/TextInput/TextInput';
import Autocomplete from '@/features/Common/components/Autocomplete/Autocomplete';
import { AutocompleteItem, AutocompleteContext } from '@/features/Query/types/querySubmission';
import OutsideClickHandler from '@/features/Common/components/OutsideClickHandler/OutsideClickHandler';
import QuestionIcon from '@/assets/icons/buttons/Search.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import SwapIcon from '@/assets/icons/buttons/Swap.svg?react';
import { getIcon, joinClasses } from '@/features/Common/utils/utilities';
import Button from '@/features/Core/components/Button/Button';

interface AutocompleteInputProps {
  id: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onItemSelect: (item: AutocompleteItem) => void;
  autocompleteItems: AutocompleteItem[] | null;
  loadingAutocomplete: boolean;
  selectedItem?: AutocompleteItem | null;
  onClear: () => void;
  autocompleteVisibility: boolean;
  setAutocompleteVisibility: (state: boolean) => void;
  className?: string;
  selectedClassName?: string;
  disabled?: boolean;
  handleSelect: (cxt: AutocompleteContext) => void;
  handleSubmit: (cxt: AutocompleteContext) => void;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  handleSwapTerms?: () => void;
}

const AutocompleteInput: FC<AutocompleteInputProps> = ({
  id,
  placeholder,
  value,
  onChange,
  onItemSelect,
  autocompleteItems,
  loadingAutocomplete,
  autocompleteVisibility,
  selectedItem,
  onClear,
  setAutocompleteVisibility,
  className = '',
  selectedClassName = '',
  disabled = false,
  handleSelect,
  handleSubmit,
  inputRef,
  handleSwapTerms,
}) => {
  const autocompleteItemsRef = useRef<HTMLDivElement>(null);
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const autocompleteItemsContainerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [scrollingIndex, setScrollingIndex] = useState<number>(-1);
  
  useEffect(() => setAutocompleteVisibility(true), [loadingAutocomplete]);

  const handleAutocompleteScrolling = useCallback((index: number) => {
    const isValidIndex = index >= 0 && index < (autocompleteItems?.length || 0);
    const isValidScroll = autocompleteItemsContainerRef?.current && isValidIndex;
    if (!isValidScroll) return;

    const itemElements = autocompleteItemsContainerRef?.current?.children;
    if (itemElements && itemElements[index]) {
      const selectedItem = itemElements[index] as HTMLElement;
      const container = autocompleteContainerRef?.current;
      if (container) {
        // Use scrollIntoView for better browser compatibility and smoother scrolling
        selectedItem.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [autocompleteItems]);

  const handleAutocompleteKeyDown = useCallback((event: KeyboardEvent) => {
    if (!autocompleteItems || autocompleteItems.length === 0 || loadingAutocomplete) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        event.stopPropagation();
        setScrollingIndex(prev => {
          const autocompleteIndex = prev < autocompleteItems.length - 1 ? prev + 1 : 0;
          // Scroll the new selected item into view
          handleAutocompleteScrolling(autocompleteIndex);
          return autocompleteIndex;
        });
        break;
      case 'ArrowUp':
        event.preventDefault();
        event.stopPropagation();
        setScrollingIndex(prev => {
          const autocompleteIndex = prev > 0 ? prev - 1 : -1;
          // Scroll the new selected item into view
          if (autocompleteIndex >= 0) {
            handleAutocompleteScrolling(autocompleteIndex);
          } else if (inputRef.current !== null) {
            inputRef.current.focus();
          } else {
            console.error('AutocompleteInput.tsx: inputRef is unexpectedly null');
          }
          return autocompleteIndex;
        });
        break;
      case 'Enter':
        event.preventDefault();
        event.stopPropagation();
        if (scrollingIndex >= 0 && scrollingIndex < autocompleteItems.length) {
          setSelectedIndex(scrollingIndex);
          onItemSelect(autocompleteItems[scrollingIndex]);
          handleSelect({id: id});
        }
        break;
    }
  }, [autocompleteItems, scrollingIndex, loadingAutocomplete, onItemSelect, handleAutocompleteScrolling]);

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        event.stopPropagation();
        if (autocompleteItems && autocompleteItems.length > 0 && autocompleteItemsRef.current) {
          autocompleteItemsRef.current.focus();
          handleAutocompleteKeyDown(event);
        }
        break;
      case 'Enter':
        handleSubmit({id: id, event: event})
        break;
    }
  }
  const handleOutsideClick = () => {
    setAutocompleteVisibility(false);
    setScrollingIndex(selectedIndex);
  }

  const inputContainerClassNames = joinClasses(
    styles.inputContainer,
    disabled && styles.disabled,
    handleSwapTerms && styles.swapTerms,
    className
  );

  const IconLeft = (
    <>
      {handleSwapTerms && <Button iconOnly iconLeft={<SwapIcon/>} handleClick={handleSwapTerms} variant="secondary" />}
      {!!selectedItem?.types ? getIcon(selectedItem.types[0]) : <QuestionIcon/>}
    </>
  )

  return (
    <OutsideClickHandler
      onOutsideClick={handleOutsideClick}
      className={inputContainerClassNames}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <TextInput
        ref={inputRef}
        placeholder={placeholder}
        handleChange={(e: string) => {
          setScrollingIndex(-1);
          setSelectedIndex(-1);
          onChange(e);
        }}
        handleFocus={() => {setAutocompleteVisibility(true)}}
        className={`${styles.input} ${!!selectedItem && styles.selected} ${selectedClassName}`}
        value={value}
        iconLeft={IconLeft}
        iconLeftClassName={styles.iconLeft}
        iconRight={!!selectedItem && onClear ?
          <button className={styles.close} onClick={onClear}><CloseIcon/></button> :
          false
        }
        disabled={disabled}
      />
      {disabled && <a className={styles.clickablePlaceholder} href='/login'>Log In to Enter a Search Term</a>}
      {
        autocompleteVisibility &&
        <Autocomplete
          isLoading={loadingAutocomplete}
          items={autocompleteItems}
          scrollingIndex={scrollingIndex}
          setScrollingIndex={setScrollingIndex}
          setSelectedIndex={setSelectedIndex}
          handleItemClick={onItemSelect}
          handleKeyDown={handleAutocompleteKeyDown}
          handleScrolling={handleAutocompleteScrolling}
          handleSelect={() => handleSelect({id: id})}
          autocompleteItemsRef={autocompleteItemsRef}
          itemsContainerRef={autocompleteItemsContainerRef}
          containerRef={autocompleteContainerRef}
        />
      }
    </OutsideClickHandler>
  )
};

export default AutocompleteInput;
