import { FC } from 'react';
import styles from '@/features/Query/components/Query/Query.module.scss';
import QueryBar from '@/features/Query/components/QueryBar/QueryBar';
import { AutocompleteItem, QueryItem } from '@/features/Query/types/querySubmission';
import { QuerySelect } from '@/features/Query/components/QuerySelect/QuerySelect';
import ExampleQueryList from '@/features/Query/components/ExampleQueryList/ExampleQueryList';
import { queryTypes } from '@/features/Query/utils/queryTypes';
import OutsideClickHandler from '@/features/Common/components/OutsideClickHandler/OutsideClickHandler';
import { QueryTypeIcon } from '../QueryTypeIcon/QueryTypeIcon';

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
  onClearQueryItem: () => void;
}

const QueryInputView: FC<QueryInputViewProps> = ({
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
  onClearAutocomplete,
  onClearQueryItem
}) => {
  return (
    <>
      <p className='blurb'>Select a question and enter a search term to find paths between biomedical entities</p>
      {isError && <p className={styles.error}>{errorText}</p>}
      <OutsideClickHandler
        onOutsideClick={onClearAutocomplete}
        className={styles.queryBarContainer}
      >
        <span className={styles.icon}>
          <QueryTypeIcon type={queryItem.type.targetType || ''} />
        </span>
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
          isLoading={isLoading}
          onClearAutocomplete={onClearAutocomplete}
          onClearQueryItem={onClearQueryItem}
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

export default QueryInputView;