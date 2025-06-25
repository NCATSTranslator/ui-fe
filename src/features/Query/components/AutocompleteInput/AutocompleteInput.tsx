import { FC } from 'react';
import TextInput from '@/features/Common/components/TextInput/TextInput';
import Autocomplete from '@/features/Common/components/Autocomplete/Autocomplete';
import { AutocompleteItem } from '@/features/Query/types/querySubmission';
import QuestionIcon from '@/assets/icons/Buttons/Search.svg?react';
import CloseIcon from '@/assets/icons/Buttons/Close/Close.svg?react';
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
  onClear?: () => void;
  className?: string;
  selectedClassName?: string;
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
  className = '',
  selectedClassName = ''
}) => (
  <div className={`${styles.inputContainer} ${className}`}>
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
    />
    <Autocomplete 
      isLoading={loadingAutocomplete}
      items={autocompleteItems}
      handleItemClick={onItemSelect}
    />
  </div>
); 

export default AutocompleteInput;