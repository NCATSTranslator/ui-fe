import { FC, useRef, useState, useCallback, KeyboardEvent, RefObject } from 'react';
import TextInput from '@/features/Core/components/TextInput/TextInput';
import Autocomplete from '@/features/Common/components/Autocomplete/Autocomplete';
import { AutocompleteItem } from '@/features/Query/types/querySubmission';
import QuestionIcon from '@/assets/icons/buttons/Search.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import { getIcon } from '@/features/Common/utils/utilities';
import styles from './AutocompleteInput.module.scss';

interface AutocompleteInputProps {
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
  submitRef: RefObject<HTMLButtonElement | null> | null;
}

const AutocompleteInput: FC<AutocompleteInputProps> = ({
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
  submitRef
}) => {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const autocompleteItemsRef = useRef<HTMLDivElement>(null);
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const autocompleteItemsContainerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [scrollingIndex, setScrollingIndex] = useState<number>(-1);

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
          submitRef?.current?.focus()
        }
        break;
    }
  }, [autocompleteItems, scrollingIndex, loadingAutocomplete, onItemSelect, handleAutocompleteScrolling]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key == 'ArrowDown' || event.key == 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      const validAutocompleteItems = autocompleteItems && autocompleteItems.length > 0;
      if (validAutocompleteItems && autocompleteItemsRef.current) {
        autocompleteItemsRef.current.focus();
        handleAutocompleteKeyDown(event);
      }
    } else if (event.key == 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      submitRef?.current?.click();
    }
  }

  return (
    <div
      className={`${styles.inputContainer} ${disabled && styles.disabled} ${className}`}
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
        handleFocus={() => {
          let autocompleteIndex = scrollingIndex;
          if (scrollingIndex < 0) {
            setScrollingIndex(selectedIndex);
            autocompleteIndex = selectedIndex;
          }
          handleAutocompleteScrolling(autocompleteIndex);
          setAutocompleteVisibility(true);
        }}
        className={`${styles.input} ${!!selectedItem && styles.selected} ${selectedClassName}`}
        value={value}
        iconLeft={!!selectedItem?.types ? getIcon(selectedItem.types[0]) : <QuestionIcon/>}
        iconRight={!!selectedItem && onClear ?
          <button className={styles.close} onClick={onClear}><CloseIcon/></button> :
          false
        }
        disabled={disabled}
      />
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
          autocompleteItemsRef={autocompleteItemsRef}
          itemsContainerRef={autocompleteItemsContainerRef}
          containerRef={autocompleteContainerRef}
        />
      }
    </div>
  )
};

export default AutocompleteInput;
