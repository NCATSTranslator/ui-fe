import { FC } from 'react';
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
  onClearAutocomplete: () => void;
  className?: string;
  selectedClassName?: string;
  disabled?: boolean;
}

const AutocompleteInput: FC<AutocompleteInputProps> = ({
  placeholder,
  value,
  onChange,
  onItemSelect,
  autocompleteItems,
  loadingAutocomplete,
  selectedItem,
  onClear,
  onClearAutocomplete,
  className = '',
  selectedClassName = '',
  disabled = false
}) => {
  return (
    <div className={`${styles.inputContainer} ${disabled && styles.disabled} ${className}`}>
      <TextInput 
        placeholder={placeholder} 
        handleChange={onChange} 
        className={`${styles.input} ${!!selectedItem && styles.selected} ${selectedClassName}`}
        value={value}
        iconLeft={!!selectedItem?.types ? getIcon(selectedItem.types[0]) : <QuestionIcon/>}
        iconRight={!!selectedItem && onClear ? 
          <button className={styles.close} onClick={onClear}><CloseIcon/></button> : 
          false
        }
        disabled={disabled}
      />
      <Autocomplete 
        isLoading={loadingAutocomplete}
        items={autocompleteItems}
        handleItemClick={onItemSelect}
        onClearAutocomplete={onClearAutocomplete}
      />
    </div>
  )
}; 

export default AutocompleteInput;