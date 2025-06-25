import { FC } from 'react';
import styles from './QueryBar.module.scss';
import ArrowRight from "@/assets/icons/Directional/Arrows/Arrow Right.svg?react";
import QueryTypeIcon from '@/features/Query/components/QueryTypeIcon/QueryTypeIcon';
import Button from "@/features/Common/components/Button/Button";
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
  disabled?: boolean;
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
        <span className={styles.icon}>
          <QueryTypeIcon type={queryType?.searchTypeString || ''} />
        </span>
        <AutocompleteInput
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onItemSelect={handleItemClick}
          autocompleteItems={autocompleteItems}
          loadingAutocomplete={autocompleteLoading}
          selectedItem={queryItem?.node || null}
          className={styles.autocompleteInput}
        />
        <Button type='submit' className={styles.submitButton} iconOnly>
          <ArrowRight/>
        </Button>
      </div>
    </form>
  );
}

export default QueryBar;