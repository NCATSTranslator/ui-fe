import { FC } from 'react';
import styles from './QueryBar.module.scss';
import ArrowRight from "@/assets/icons/directional/Arrows/Arrow Right.svg?react";
import loadingIcon from '@/assets/images/loading/loading-white.png';
import Button from "@/features/Core/components/Button/Button";
import { cloneDeep } from 'lodash';
import { AutocompleteItem, QueryItem, QueryType } from '@/features/Query/types/querySubmission';
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
  onClearAutocomplete: () => void;
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
  onClearAutocomplete,
  onClearQueryItem,
  placeholderText
}) => {
  const placeholder = (!!placeholderText) ? placeholderText : (queryType) ? queryType.placeholder : '';

  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        if(!queryItem  || (queryItem.node === null && (!autocompleteItems || autocompleteItems.length === 0))) {
          handleSubmission(null);
          return;
        }

        if(queryItem.node === null && !!autocompleteItems &&autocompleteItems.length > 0) {
          handleItemClick(autocompleteItems[0]);
          let newQueryItem = cloneDeep(queryItem);
          newQueryItem.node = autocompleteItems[0];
          handleSubmission(newQueryItem);
        } else {
          handleSubmission(queryItem);
        }
      }} 
      className={styles.form}
    >
      <div className={`${disabled && styles.disabled} ${styles.inputContainer}`}>
        <AutocompleteInput
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onItemSelect={handleItemClick}
          autocompleteItems={autocompleteItems}
          loadingAutocomplete={autocompleteLoading}
          selectedItem={queryItem?.node || null}
          className={styles.autocompleteInput}
          onClearAutocomplete={onClearAutocomplete}
          onClear={onClearQueryItem}
          disabled={disabled}
        />
        <Button type='submit' className={styles.submitButton} iconOnly disabled={isLoading}>
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