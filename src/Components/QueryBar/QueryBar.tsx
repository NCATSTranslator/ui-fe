import { FC } from 'react';
import TextInput from "../Core/TextInput";
import Autocomplete from "../Autocomplete/Autocomplete";
import styles from './QueryBar.module.scss';
import ArrowRight from "../../Icons/Directional/Arrows/Arrow Right.svg?react";
import QueryTypeIcon from "../QueryTypeIcon/QueryTypeIcon";
import Button from "../Core/Button";
import { cloneDeep } from 'lodash';
import { AutocompleteItem } from '../../Types/results';

export type QueryType = {
  placeholder?: string; 
  searchTypeString: string;
}
export type QueryItem = {
  type: QueryType; 
  node: { id: string; label: string; match: string; types: Array<string> } | null; 
}

type QueryBarProps = {
  handleSubmission: (item: QueryItem | null) => void;
  handleChange: (value: string) => void;
  queryType?: QueryType;
  queryItem?: QueryItem;
  value?: string;
  autocompleteItems: Array<AutocompleteItem>;
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

        if(queryItem.node === null && autocompleteItems.length > 0) {
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
      <Autocomplete 
        isLoading={autocompleteLoading}
        items={autocompleteItems}
        handleItemClick={handleItemClick}
      />
      <div className={`${disabled && styles.disabled} ${styles.inputContainer}`}>
        <span className={styles.icon}>
          <QueryTypeIcon type={queryType?.searchTypeString || ''} />
        </span>
        <TextInput 
          placeholder={placeholder} 
          handleChange={handleChange} 
          className={styles.input}
          value={value}
          disabled={disabled}
        />
        <Button type='submit' className={styles.submitButton} iconOnly>
          <ArrowRight/>
        </Button>
      </div>
    </form>
  );
}

export default QueryBar;
