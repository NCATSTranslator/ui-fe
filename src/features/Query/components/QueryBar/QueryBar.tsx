import { FC, FormEvent, useRef } from 'react';
import styles from './QueryBar.module.scss';
import ArrowRight from "@/assets/icons/directional/Arrows/Arrow Right.svg?react";
import loadingIcon from '@/assets/images/loading/loading-white.png';
import Button from "@/features/Core/components/Button/Button";
import { cloneDeep } from 'lodash';
import { AutocompleteItem, AutocompleteContext, QueryItem, QueryType } from '@/features/Query/types/querySubmission';
import AutocompleteInput from '@/features/Query/components/AutocompleteInput/AutocompleteInput';

type QueryBarProps = {
  handleSubmission: (item: QueryItem | null) => void;
  handleChange: (value: string) => void;
  queryType?: QueryType;
  queryItem?: QueryItem;
  value?: string;
  autocompleteItems: AutocompleteItem[] | null;
  autocompleteLoading: boolean;
  handleItemClick: (item: AutocompleteItem) => void;
  autocompleteVisibility: boolean;
  setAutocompleteVisibility: (state: boolean) => void;
  onClearQueryItem: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholderText?: string;
}

const QueryBar: FC<QueryBarProps> = ({
  handleSubmission,
  handleChange,
  queryType,
  queryItem,
  value = '',
  autocompleteItems,
  autocompleteLoading,
  handleItemClick,
  disabled = false,
  isLoading = false,
  autocompleteVisibility,
  setAutocompleteVisibility,
  onClearQueryItem,
  placeholderText
}) => {
  const autocompleteId = 'ac';
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validAutocompleteItems = autocompleteItems && autocompleteItems.length > 0;
    const validSubmission = queryItem && (queryItem.node !== null || validAutocompleteItems);
    if (!validSubmission) {
      handleSubmission(null);
      return;
    }
    if (queryItem.node === null && validAutocompleteItems) {
      handleItemClick(autocompleteItems[0]);
      const newQueryItem = cloneDeep(queryItem);
      newQueryItem.node = autocompleteItems[0];
      handleSubmission(newQueryItem);
    } else {
      handleSubmission(queryItem);
    }
  }

  const handleAutocompleteSelect = () => submitRef?.current?.focus();
  const handleInputSubmit = (cxt: AutocompleteContext) => {
    if (cxt.event === undefined || cxt.event === null) {
      throw Error(`Developer Error in QueryBar.tsx: \n  In handleInputSubmit cxt.event is required but is ${cxt.event}`);
    }
    if (queryItem?.node) {
      cxt.event.preventDefault();
      cxt.event.stopPropagation();
      submitRef.current?.click();
    }
  }

  let placeholder = '';
  if (!!placeholderText) {
    placeholder = placeholderText;
  } else if (queryType) {
    placeholder = queryType.placeholder;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={styles.form}
    >
      <div className={`${disabled && styles.disabled} ${styles.inputContainer}`}>
        <AutocompleteInput
          id={autocompleteId}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onItemSelect={handleItemClick}
          autocompleteItems={autocompleteItems}
          loadingAutocomplete={autocompleteLoading}
          selectedItem={queryItem?.node || null}
          className={styles.autocompleteInput}
          autocompleteVisibility={autocompleteVisibility}
          setAutocompleteVisibility={setAutocompleteVisibility}
          onClear={onClearQueryItem}
          disabled={disabled}
          loginOnDisabled
          handleSelect={handleAutocompleteSelect}
          handleSubmit={handleInputSubmit}
          inputRef={autocompleteInputRef}
        />
        <Button
          ref={submitRef}
          type='submit'
          className={styles.submitButton}
          iconOnly
          disabled={isLoading || disabled}
        >
          {
            isLoading
            ?
              <img
                src={loadingIcon}
                className={`loadingIcon`}
                alt="loading icon"
              />
            :
              <ArrowRight/>
          }
        </Button>
      </div>
    </form>
  );
}

export default QueryBar;
