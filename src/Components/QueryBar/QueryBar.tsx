import { FC } from 'react';
import TextInput from "../Core/TextInput";
import Autocomplete from "../Autocomplete/Autocomplete";
import styles from './QueryBar.module.scss';
import ArrowRight from "../../Icons/Directional/Arrows/Arrow Right.svg?react";
import QueryTypeIcon from "../QueryTypeIcon/QueryTypeIcon";
import Button from "../Core/Button";

type QueryBarProps = {
  handleSubmission: () => void;
  handleChange: (value: string) => void;
  queryType?: { placeholder?: string; searchTypeString: string };
  value?: string;
  autocompleteItems: Array<string>;
  autocompleteLoading: boolean;
  handleItemClick: (item: string) => void;
  disabled?: boolean;
}

const QueryBar: FC<QueryBarProps> = ({
  handleSubmission,
  handleChange,
  queryType,
  value = '',
  autocompleteItems,
  autocompleteLoading,
  handleItemClick,
  disabled = false
}) => {
  const placeholderText = queryType ? queryType.placeholder : '';

  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmission();
      }} 
      className={styles.form}
    >
      <Autocomplete 
        isLoading={autocompleteLoading}
        items={autocompleteItems}
        handleItemClick={handleItemClick}
      />
      <div className={styles.inputContainer}>
        <span className={styles.icon}>
          <QueryTypeIcon type={queryType?.searchTypeString || ''} />
        </span>
        <TextInput 
          placeholder={placeholderText} 
          handleChange={handleChange} 
          className={styles.input}
          size=""
          value={value}
          disabled={disabled}
        />
        <Button handleClick={handleSubmission} className={styles.submitButton} iconOnly>
          <ArrowRight/>
        </Button>
      </div>
    </form>
  );
}

export default QueryBar;
