import { useState, useCallback, useRef, FC, useMemo } from 'react';
import styles from './QueryPathfinder.module.scss';
import Button from '@/features/Core/components/Button/Button';
import { AutocompleteItem, AutocompleteContext, AutocompleteConfig } from '@/features/Query/types/querySubmission';
import { defaultQueryFilterFactory } from '@/features/Query/utils/queryTypeFilters';
import { formatBiolinkTypeString } from '@/features/Core/utils/stringFormatters';
import { getDataFromQueryVar } from '@/features/Core/utils/urlHelpers';
import ArrowRight from "@/assets/icons/directional/Arrows/Arrow Right.svg?react";
import PathfinderDivider from "@/assets/icons/directional/Pathfinder/Pathfinder.svg?react";
import AddIcon from '@/assets/icons/buttons/Add/Add.svg?react';
import SubtractIcon from '@/assets/icons/buttons/Subtract/Subtract.svg?react';
import loadingIcon from '@/assets/images/loading/loading-white.png';
import Select from '@/features/Core/components/Select/Select';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import { useAutocomplete, useQuerySubmission, useNameResolverEndpoint } from '@/features/Query/hooks/customQueryHooks';
import { withGeneMatchLabel } from '@/features/Query/utils/autocompleteFunctions';
import AutocompleteInput from '@/features/Query/components/AutocompleteInput/AutocompleteInput';
import { queryTypeAnnotator } from '@/features/Query/utils/queryTypeAnnotators';
import { combinedQueryFormatter } from '@/features/Query/utils/queryTypeFormatters';
import { ProjectRaw } from '@/features/Projects/types/projects';
import { BIOLINK_CATEGORIES } from '@/features/Query/utils/biolinkCategories';
import { User } from '@/features/UserAuth/types/user';
import { getDecodedParams } from '@/features/Core/utils/web';

type QueryPathfinderProps = {
  isResults?: boolean;
  selectedProject?: ProjectRaw | null;
  shouldNavigate?: boolean;
  submissionCallback?: () => void;
  user?: User | null;
}

const QueryPathfinder: FC<QueryPathfinderProps> = ({
  isResults = false,
  selectedProject = null,
  shouldNavigate = true,
  submissionCallback = () => {},
  user = null
}) => {

  const autocompleteOneId = 'ac1';
  const autocompleteTwoId = 'ac2';
  const disabled = user === null;
  const nameResolverEndpoint = useNameResolverEndpoint();
  const submitRef = useRef<HTMLButtonElement>(null);
  const autocompleteInputRefOne = useRef<HTMLInputElement>(null);
  const autocompleteInputRefTwo = useRef<HTMLInputElement>(null);
  const [isError, setIsError] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [inputOneText, setInputOneText] = useState("");
  const [inputTwoText, setInputTwoText] = useState("");
  const [queryItemOne, setQueryItemOne] = useState<AutocompleteItem | null>(null);
  const [queryItemTwo, setQueryItemTwo] = useState<AutocompleteItem | null>(null);
  const [hasMiddleType, setHasMiddleType] = useState<boolean>(false);
  const [middleType, setMiddleType] = useState<string>("");

  const decodedParams = useMemo(() => getDecodedParams(), []);
  const labelOne = getDataFromQueryVar("lone", decodedParams);
  const labelTwo = getDataFromQueryVar("ltwo", decodedParams);
  const idOne = getDataFromQueryVar("ione", decodedParams);
  const idTwo = getDataFromQueryVar("itwo", decodedParams);
  const constraintText = formatBiolinkTypeString(getDataFromQueryVar("c", decodedParams) || "");

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
    autocompleteItems: autocompleteItemsOne,
    loadingAutocomplete: autocompleteLoadingOne,
    delayedQuery: delayedQueryOne,
    autocompleteVisibility: autocompleteVisibilityOne,
    setAutocompleteVisibility: setAutocompleteVisibilityOne,
  } = useAutocomplete(autocompleteConfig, nameResolverEndpoint);

  const {
    autocompleteItems: autocompleteItemsTwo,
    loadingAutocomplete: autocompleteLoadingTwo,
    delayedQuery: delayedQueryTwo,
    autocompleteVisibility: autocompleteVisibilityTwo,
    setAutocompleteVisibility: setAutocompleteVisibilityTwo,
  } = useAutocomplete(autocompleteConfig, nameResolverEndpoint);

  const { isLoading, submitPathfinderQuery } = useQuerySubmission('pathfinder', shouldNavigate, submissionCallback);

  // Event handler called when search bar is updated by user
  const handleQueryItemChange = useCallback((e: string, isFirstBar:boolean) => {
    if(isFirstBar) {
      setQueryItemOne(null);
      setInputOneText(e);
      delayedQueryOne(e);
    } else {
      setQueryItemTwo(null);
      setInputTwoText(e);
      delayedQueryTwo(e);
    }
  },[delayedQueryOne, delayedQueryTwo]);

  const updateQueryItem = (node: AutocompleteItem, isFirstBar: boolean) => {
    // add in match text for genes, which should be the species
    const selectedNode = withGeneMatchLabel(node);

    if(isFirstBar) {
      setInputOneText(selectedNode.label);
      setQueryItemOne(selectedNode);
    } else {
      setInputTwoText(selectedNode.label);
      setQueryItemTwo(selectedNode);
    }
  }

  const handleItemSelection = (item: AutocompleteItem, isFirstBar: boolean) => {
    setIsError(false);
    updateQueryItem(item, isFirstBar);

    if(autocompleteItemsOne || autocompleteItemsTwo) {
      if(isFirstBar) {
        setAutocompleteVisibilityOne(false);
      } else {
        setAutocompleteVisibilityTwo(false);
      }
    }
  }

  const validateSubmission = (itemOne: AutocompleteItem | null, itemTwo: AutocompleteItem | null) => {
    if(!itemOne && !itemTwo) {
      setIsError(true);
      setErrorText("No terms selected, please select two search terms.");
      return;
    }
    if(!itemOne || itemOne.id === "") {
      setIsError(true);
      setErrorText("First search term is not selected, please select a valid term.");
      return;
    }
    if(!itemTwo || itemTwo.id === "") {
      setIsError(true);
      setErrorText("Second search term is not selected, please select a valid term.");
      return;
    }
    submitPathfinderQuery!(itemOne, itemTwo, hasMiddleType ? middleType : undefined, selectedProject?.id?.toString() || undefined, shouldNavigate);
  }

  // Event handler for form submission
  const handleSubmission = (itemOne: AutocompleteItem | null, itemTwo: AutocompleteItem | null) => {
    validateSubmission(itemOne, itemTwo);
  }

  const clearItem = (item: number) => {
    if(item === 1) {
      setQueryItemOne(null);
      setInputOneText("");
    } else if(item === 2) {
      setQueryItemTwo(null);
      setInputTwoText("");
    }
  }

  const swapTerms = () => {
    const prevItemOne = queryItemOne;
    setQueryItemOne(queryItemTwo);
    setQueryItemTwo(prevItemOne);

    const prevTextOne = inputOneText;
    setInputOneText(inputTwoText);
    setInputTwoText(prevTextOne);
  }

  const handleMiddleTypeTrigger = () => {
    if(hasMiddleType) {
      setMiddleType("");
    } else {
      setMiddleType("biolink:ChemicalEntity");
    }
    setHasMiddleType(prev => !prev);
  }

  const handleAutocompleteSelect = (cxt: AutocompleteContext) => {
    if (cxt.id === autocompleteOneId) {
      autocompleteInputRefTwo.current?.focus();
    } else if (cxt.id === autocompleteTwoId) {
      submitRef.current?.focus();
    } else {
      throw Error(`Developer Error in QueryPathfinder.tsx: In handleAutocompleteSelect\n  cxt.id: ${cxt.id}`);
    }
  }

  const handleInputSubmit = (cxt: AutocompleteContext) => {
    if (cxt.event === undefined || cxt.event === null) {
      throw Error(`Developer Error in QueryPathfinder.tsx: \n  In handleInputSubmit cxt.event is required but is ${cxt.event}`);
    }
    cxt.event.preventDefault();
    cxt.event.stopPropagation();
    handleSubmission(queryItemOne, queryItemTwo);
  }

  return (
    <div className={`${styles.queryPathfinder} ${isResults && styles.results}`}>
      { isResults
        ? null
        :
          <>
            <p className={`blurb ${styles.blurb}`}>Enter two search terms to find paths beginning with the first term and ending with the second</p>
            {
              isError &&
              <p className={styles.error}>{errorText}</p>
            }
            <form
              className={`${styles.form} ${hasMiddleType && styles.hasMiddleType}`}
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmission(queryItemOne, queryItemTwo);
              }}
            >
              <AutocompleteInput
                id={autocompleteOneId}
                value={inputOneText}
                onChange={(e) => handleQueryItemChange(e, true)}
                onItemSelect={(item) => handleItemSelection(item, true)}
                autocompleteItems={autocompleteItemsOne}
                loadingAutocomplete={autocompleteLoadingOne}
                selectedItem={queryItemOne}
                onClear={() => clearItem(1)}
                className={styles.inputContainer}
                selectedClassName={styles.selected}
                autocompleteVisibility={autocompleteVisibilityOne}
                setAutocompleteVisibility={setAutocompleteVisibilityOne}
                disabled={disabled}
                placeholder={user === null ? "Log In to Enter Search Terms" : "Enter First Search Term"}
                handleSelect={handleAutocompleteSelect}
                handleSubmit={handleInputSubmit}
                inputRef={autocompleteInputRefOne}
                handleSwapTerms={swapTerms}
                showDisclaimer
              />
              <PathfinderDivider className={styles.dividerIcon}/>
              {
                hasMiddleType
                ?
                  <>
                    <Button iconOnly iconLeft={<SubtractIcon/>} handleClick={handleMiddleTypeTrigger} variant="secondary" dataTooltipId='middle-type-tooltip' />
                    <Select
                      label=""
                      name="Type"
                      handleChange={(value)=>{
                        setMiddleType(value.toString());
                      }}
                      value={middleType ?? ""}
                      noanimate
                      className={styles.middleTypeSelector}
                      >
                      {BIOLINK_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </Select>
                  </>
                : 
                  <Button iconOnly iconLeft={<AddIcon/>} handleClick={handleMiddleTypeTrigger} variant="secondary" dataTooltipId='middle-type-tooltip' />
              }
              <PathfinderDivider className={styles.dividerIcon}/>
              <AutocompleteInput
                id={autocompleteTwoId}
                value={inputTwoText}
                onChange={(e) => handleQueryItemChange(e, false)}
                onItemSelect={(item) => handleItemSelection(item, false)}
                autocompleteItems={autocompleteItemsTwo}
                loadingAutocomplete={autocompleteLoadingTwo}
                selectedItem={queryItemTwo}
                onClear={() => clearItem(2)}
                className={styles.inputContainer}
                selectedClassName={styles.selected}
                autocompleteVisibility={autocompleteVisibilityTwo}
                setAutocompleteVisibility={setAutocompleteVisibilityTwo}
                disabled={disabled}
                placeholder={user === null ? "Log In to Enter Search Terms" : "Enter Second Search Term"}
                handleSelect={handleAutocompleteSelect}
                handleSubmit={handleInputSubmit}
                inputRef={autocompleteInputRefTwo}
                showDisclaimer
              />
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
                      className={`loadingIcon`}
                      alt="loading icon"
                    />
                  :
                    <ArrowRight/>
                }
              </Button>
            </form>
            <Tooltip
              id='middle-type-tooltip'
              >
                <span>Pre-filter results by selecting a middle object type to be included within paths between the entered search terms. <br/><br/> Genes, diseases, phenotypes, and chemicals are currently supported.</span>
            </Tooltip>
          </>
      }
    </div>
  );
}

export default QueryPathfinder;
