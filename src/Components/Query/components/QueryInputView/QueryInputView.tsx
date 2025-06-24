import { FC } from 'react';
import { QueryBar } from '../QueryBar/QueryBar';
import { AutocompleteItem, QueryItem } from '@/Types/querySubmission';
import { QuerySelect } from '../QuerySelect/QuerySelect';
import ExampleQueryList from '@/Components/ExampleQueryList/ExampleQueryList';
import { queryTypes } from '@/Utilities/queryTypes';
import loadingIcon from '@/Assets/Images/Loading/loading-purple.png';
import styles from '@/Components/Query/Query.module.scss';
import OutsideClickHandler from '@/Components/OutsideClickHandler/OutsideClickHandler';

interface QueryInputViewProps {
  queryItem: QueryItem;
  inputText: string;
  autocompleteItems: AutocompleteItem[] | null;
  loadingAutocomplete: boolean;
  isLoading: boolean;
  isError: boolean;
  errorText: string;
  user: any;
  exampleQueries: any;
  onQueryTypeChange: (value: string, resetInputText?: boolean) => void;
  onQueryItemChange: (value: string) => void;
  onItemSelection: (item: AutocompleteItem) => void;
  onSubmission: (item: QueryItem | null) => void;
  onClearAutocomplete: () => void;
}

export const QueryInputView: FC<QueryInputViewProps> = ({
  queryItem,
  inputText,
  autocompleteItems,
  loadingAutocomplete,
  isLoading,
  isError,
  errorText,
  user,
  exampleQueries,
  onQueryTypeChange,
  onQueryItemChange,
  onItemSelection,
  onSubmission,
  onClearAutocomplete
}) => {
  return (
    <>
      <h3 className={styles.h3}>
        Translator finds associations between drugs, genes, and diseases
      </h3>
      <h6 className={styles.h6}>
        Select a question and enter a search term to get started
      </h6>
      {isError && <p className={styles.error}>{errorText}</p>}
      
      <OutsideClickHandler
        onOutsideClick={onClearAutocomplete}
        className={styles.queryBarContainer}
      >
        <QuerySelect
          label=""
          handleChange={(val: string) => onQueryTypeChange(val, true)}
          noanimate
          value={queryItem.type.id}
        >
          {queryTypes.map((type) => (
            <option value={type.id} key={type.id}>
              <span
                data-modified-name={type.label
                  .replaceAll("a disease?", "...")
                  .replaceAll("a chemical?", "...")
                  .replaceAll("a gene?", "...")}
              >
                {type.label}
              </span>
            </option>
          ))}
        </QuerySelect>
        
        <QueryBar
          handleSubmission={onSubmission}
          handleChange={onQueryItemChange}
          value={inputText}
          queryType={queryItem.type}
          queryItem={queryItem}
          autocompleteItems={autocompleteItems}
          autocompleteLoading={loadingAutocomplete}
          handleItemClick={onItemSelection}
          disabled={user === null}
          placeholderText={
            user === null ? "Log In to Enter a Search Term" : undefined
          }
        />
        
        <img
          src={loadingIcon}
          className={`${styles.loadingIcon} ${
            isLoading ? styles.active : ""
          } loadingIcon`}
          alt="loading icon"
        />
      </OutsideClickHandler>

      {/* Example queries based on type */}
      {queryItem.type.id === 0 && exampleQueries.exampleDiseases && (
        <ExampleQueryList
          examples={exampleQueries.exampleDiseases}
          setPresetURL={() => {}}
        />
      )}
      {queryItem.type.id === 1 && exampleQueries.exampleGenesUp && (
        <ExampleQueryList
          examples={exampleQueries.exampleGenesUp}
          setPresetURL={() => {}}
        />
      )}
      {queryItem.type.id === 2 && exampleQueries.exampleGenesDown && (
        <ExampleQueryList
          examples={exampleQueries.exampleGenesDown}
          setPresetURL={() => {}}
        />
      )}
      {queryItem.type.id === 3 && exampleQueries.exampleChemsUp && (
        <ExampleQueryList
          examples={exampleQueries.exampleChemsUp}
          setPresetURL={() => {}}
        />
      )}
      {queryItem.type.id === 4 && exampleQueries.exampleChemsDown && (
        <ExampleQueryList
          examples={exampleQueries.exampleChemsDown}
          setPresetURL={() => {}}
        />
      )}
    </>
  );
}; 