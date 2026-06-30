import { useState, useCallback, useRef, FC, useMemo } from 'react';
import styles from './QueryLookup.module.scss';
import Button from '@/features/Core/components/Button/Button';
import { AutocompleteItem, AutocompleteContext, AutocompleteConfig } from '@/features/Query/types/querySubmission';
import { defaultQueryFilterFactory } from '@/features/Query/utils/queryTypeFilters';
import ArrowRight from "@/assets/icons/directional/Arrows/Arrow Right.svg?react";
import loadingIcon from '@/assets/images/loading/loading-white.png';
import Select from '@/features/Core/components/Select/Select';
import { useAutocomplete, useQuerySubmission, useNameResolverEndpoint } from '@/features/Query/hooks/customQueryHooks';
import { withGeneMatchLabel } from '@/features/Query/utils/autocompleteFunctions';
import AutocompleteInput from '@/features/Query/components/AutocompleteInput/AutocompleteInput';
import { queryTypeAnnotator } from '@/features/Query/utils/queryTypeAnnotators';
import { combinedQueryFormatter } from '@/features/Query/utils/queryTypeFormatters';
import { ProjectRaw } from '@/features/Projects/types/projects';
import { User } from '@/features/UserAuth/types/user';
import { BIOLINK_CATEGORIES } from '@/features/Query/utils/biolinkCategories';
import { getNodeIcon } from '@/features/Core/utils/entityLinks';
import DividerVert from '@/features/Core/components/DividerVert/DividerVert';

type QueryLookupProps = {
  isResults?: boolean;
  selectedProject?: ProjectRaw | null;
  shouldNavigate?: boolean;
  submissionCallback?: () => void;
  user?: User | null;
}

const QueryLookup: FC<QueryLookupProps> = ({
  isResults = false,
  selectedProject = null,
  shouldNavigate = true,
  submissionCallback = () => {},
  user = null
}) => {
  const disabled = user === null;
  const nameResolverEndpoint = useNameResolverEndpoint();
  const submitRef = useRef<HTMLButtonElement>(null);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const [isError, setIsError] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [inputText, setInputText] = useState("");
  const [queryItem, setQueryItem] = useState<AutocompleteItem | null>(null);
  const [objectCategory, setObjectCategory] = useState<string>("biolink:ChemicalEntity");

  const autocompleteConfig = useMemo<AutocompleteConfig>(() => ({
    functions: {
      filter: defaultQueryFilterFactory,
      annotate: queryTypeAnnotator,
      format: combinedQueryFormatter
    },
    limitTypes: [
      "Drug",
      "ChemicalEntity",
      "Disease",
      "Gene",
      "SmallMolecule",
      "PhenotypicFeature",
      "BiologicalProcess",
      "AnatomicalEntity",
      "CellLine"
    ],
    limitPrefixes: [],
    excludePrefixes: ["UMLS"],
  }), []);

  const {
    autocompleteItems,
    loadingAutocomplete,
    delayedQuery,
    autocompleteVisibility,
    setAutocompleteVisibility,
  } = useAutocomplete(autocompleteConfig, nameResolverEndpoint);

  const { isLoading, submitLookupQuery } = useQuerySubmission('lookup', shouldNavigate, submissionCallback);

  const handleQueryItemChange = useCallback((e: string) => {
    setQueryItem(null);
    setInputText(e);
    delayedQuery(e);
  }, [delayedQuery]);

  const handleItemSelection = useCallback((item: AutocompleteItem) => {
    setIsError(false);
    const labeledItem = withGeneMatchLabel(item);
    setInputText(labeledItem.label);
    setQueryItem(labeledItem);
    setAutocompleteVisibility(false);
  }, [setAutocompleteVisibility]);

  const handleSubmission = useCallback(() => {
    if (!queryItem || queryItem.id === "") {
      setIsError(true);
      setErrorText("No search term selected, please select a valid term.");
      return;
    }
    submitLookupQuery!(queryItem, objectCategory, selectedProject?.id?.toString() || undefined);
  }, [queryItem, objectCategory, selectedProject, submitLookupQuery]);

  const clearItem = useCallback(() => {
    setQueryItem(null);
    setInputText("");
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAutocompleteSelect = useCallback((_cxt: AutocompleteContext) => {
    submitRef.current?.focus();
  }, []);

  const handleInputSubmit = useCallback((cxt: AutocompleteContext) => {
    if (cxt.event === undefined || cxt.event === null) {
      throw Error(`Developer Error in QueryLookup.tsx: In handleInputSubmit cxt.event is required but is ${cxt.event}`);
    }
    cxt.event.preventDefault();
    cxt.event.stopPropagation();
    handleSubmission();
  }, [handleSubmission]);

  return (
    <div className={`${styles.queryLookup} ${isResults ? styles.results : ''}`}>
      {isResults
        ? null
        :
          <>
            <p className={`blurb ${styles.blurb}`}>Enter a search term and select an object type to find direct connections between them</p>
            {
              isError &&
              <p className={styles.error}>{errorText}</p>
            }
            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmission();
              }}
            >
              <AutocompleteInput
                id="lookup-ac"
                value={inputText}
                onChange={handleQueryItemChange}
                onItemSelect={handleItemSelection}
                autocompleteItems={autocompleteItems}
                loadingAutocomplete={loadingAutocomplete}
                selectedItem={queryItem}
                onClear={clearItem}
                className={styles.inputContainer}
                selectedClassName={styles.selected}
                autocompleteVisibility={autocompleteVisibility}
                setAutocompleteVisibility={setAutocompleteVisibility}
                disabled={disabled}
                placeholder={user === null ? "Log In to Enter Search Terms" : "Enter Search Term"}
                handleSelect={handleAutocompleteSelect}
                handleSubmit={handleInputSubmit}
                inputRef={autocompleteInputRef}
              />
              <DividerVert className={styles.dividerVert} />
              <span className={styles.categoryIcon}>{getNodeIcon(objectCategory)}</span>
              <Select
                label=""
                name="Object Type"
                handleChange={(value) => setObjectCategory(value.toString())}
                value={objectCategory}
                noanimate
                className={styles.categorySelector}
              >
                {BIOLINK_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.pluralLabel}</option>
                ))}
              </Select>
              <Button
                ref={submitRef}
                type='submit'
                className={styles.submitButton}
                iconOnly
                disabled={disabled}
              >
                {
                  isLoading
                  ?
                    <img
                      src={loadingIcon}
                      className="loadingIcon"
                      alt="loading icon"
                    />
                  :
                    <ArrowRight/>
                }
              </Button>
            </form>
          </>
      }
    </div>
  );
};

export default QueryLookup;
