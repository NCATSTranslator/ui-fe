import { useState, useCallback, useRef, FC, Dispatch, SetStateAction } from 'react';
import { useSelector } from 'react-redux';
import { currentConfig } from "@/features/UserAuth/slices/userSlice";
import styles from './QueryPathfinder.module.scss';
import Button from '@/features/Core/components/Button/Button';
import { AutocompleteItem, AutocompleteContext } from '@/features/Query/types/querySubmission';
import { AutocompleteFunctions } from "@/features/Query/types/querySubmission";
import { defaultQueryFilterFactory } from '@/features/Query/utils/queryTypeFilters';
import { getDataFromQueryVar } from '@/features/Common/utils/utilities';
import ArrowRight from "@/assets/icons/directional/Arrows/Arrow Right.svg?react";
import PathfinderDivider from "@/assets/icons/directional/Pathfinder/Pathfinder.svg?react";
import InfoIcon from '@/assets/icons/status/Alerts/Info.svg?react';
import AddIcon from '@/assets/icons/buttons/Add/Add.svg?react';
import SubtractIcon from '@/assets/icons/buttons/Subtract/Subtract.svg?react';
import loadingIcon from '@/assets/images/loading/loading-white.png';
import Select from '@/features/Common/components/Select/Select';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import { Result } from "@/features/ResultList/types/results.d";
import { useAutocomplete, useQuerySubmission } from '@/features/Query/hooks/customQueryHooks';
import AutocompleteInput from '@/features/Query/components/AutocompleteInput/AutocompleteInput';
import QueryResultsHeader from '@/features/Query/components/QueryResultsHeader/QueryResultsHeader';
import { queryTypeAnnotator } from '@/features/Query/utils/queryTypeAnnotators';
import { combinedQueryFormatter } from '@/features/Query/utils/queryTypeFormatters';
import { ResultContextObject } from '@/features/ResultList/utils/llm';
import { ProjectRaw } from '@/features/Projects/types/projects';
import { User } from '@/features/UserAuth/types/user';
import { getDecodedParams } from '@/features/Common/utils/web';

type QueryPathfinderProps = {
  handleResultMatchClick?: (match: ResultContextObject) => void;
  isResults?: boolean;
  loading?: boolean;
  pk?: string;
  results?: Result[];
  setShareModalFunction?: Dispatch<SetStateAction<boolean>>;
  selectedProject?: ProjectRaw | null;
  shouldNavigate?: boolean;
  submissionCallback?: () => void;
  user?: User | null;
}

const QueryPathfinder: FC<QueryPathfinderProps> = ({
  loading = false,
  handleResultMatchClick,
  isResults = false,
  pk,
  results = [],
  setShareModalFunction = ()=>{},
  selectedProject = null,
  shouldNavigate = true,
  submissionCallback = () => {},
  user = null
}) => {

  const autocompleteOneId = 'ac1';
  const autocompleteTwoId = 'ac2';
  const config = useSelector(currentConfig);
  const disabled = user === null;
  const nameResolverEndpoint = (config?.name_resolver.endpoint) ? `${config.name_resolver.endpoint}/lookup` : 'https://name-lookup.transltr.io/lookup';
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

  const decodedParams = getDecodedParams();
  const labelOne = getDataFromQueryVar("lone", decodedParams);
  const labelTwo = getDataFromQueryVar("ltwo", decodedParams);
  const idOne = getDataFromQueryVar("ione", decodedParams);
  const idTwo = getDataFromQueryVar("itwo", decodedParams);
  const constraintText = getDataFromQueryVar("c", decodedParams);

  const autocompleteFunctions = useRef<AutocompleteFunctions>( {
    filter: defaultQueryFilterFactory,
    annotate: queryTypeAnnotator,
    format: combinedQueryFormatter
  });
  const limitPrefixes = useRef([]);
  const limitTypes = useRef(["Drug", "ChemicalEntity", "Disease", "Gene", "SmallMolecule", "PhenotypicFeature"]);
  const excludePrefixes = useRef(["UMLS"]);

  const {
    autocompleteItems: autocompleteItemsOne,
    loadingAutocomplete: autocompleteLoadingOne,
    delayedQuery: delayedQueryOne,
    autocompleteVisibility: autocompleteVisibilityOne,
    setAutocompleteVisibility: setAutocompleteVisibilityOne,
    clearAutocompleteItems: clearAutocompleteItemsOne
  } = useAutocomplete(autocompleteFunctions, nameResolverEndpoint, limitTypes, limitPrefixes, excludePrefixes);

  const {
    autocompleteItems: autocompleteItemsTwo,
    loadingAutocomplete: autocompleteLoadingTwo,
    delayedQuery: delayedQueryTwo,
    autocompleteVisibility: autocompleteVisibilityTwo,
    setAutocompleteVisibility: setAutocompleteVisibilityTwo,
    clearAutocompleteItems: clearAutocompleteItemsTwo
  } = useAutocomplete(autocompleteFunctions, nameResolverEndpoint, limitTypes, limitPrefixes, excludePrefixes);

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

  const updateQueryItem = (selectedNode: AutocompleteItem, isFirstBar: boolean) => {
    // add in match text for genes, which should be the species
    if(selectedNode.id.includes("NCBIGene") && selectedNode?.match)
      selectedNode.label += ` (${selectedNode.match})`;

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
    return;
  }

  return (
    <div className={`${styles.queryPathfinder} ${isResults && styles.results}`}>
      { isResults
        ?
          <QueryResultsHeader
            questionText={""}
            entityId={idOne || undefined}
            entityLabel={labelOne || undefined}
            entityIdTwo={idTwo || undefined}
            entityLabelTwo={labelTwo || undefined}
            onShare={() => setShareModalFunction(true)}
            results={results}
            loading={loading}
            onResultMatchClick={handleResultMatchClick}
            pk={pk || ""}
            className={styles.resultsHeader}
            searchedTermClassName={styles.searchedTerm}
            shareButtonClassName={styles.shareButton}
            isPathfinder
            constraintText={constraintText || undefined}
          />
        :
          <>
            <p className={`blurb ${styles.blurb}`}>Enter two search terms to find paths beginning with the first term and ending with the second</p>
            <p className='caption'>Genes, diseases or phenotypes, and drugs or chemicals are currently supported</p>
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
                placeholder={user === null ? "Log In to Enter a Search Term" : "Enter First Search Term"}
                handleSelect={handleAutocompleteSelect}
                handleSubmit={handleInputSubmit}
                inputRef={autocompleteInputRefOne}
                handleSwapTerms={swapTerms}
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
                      <option value="biolink:ChemicalEntity">Chemical</option>
                      <option value="biolink:Disease">Disease</option>
                      <option value="biolink:Drug">Drug</option>
                      <option value="biolink:Gene">Gene</option>
                      <option value="biolink:PhenotypicFeature">Phenotype</option>
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
                placeholder={user === null ? "Log In to Enter a Search Term" : "Enter Second Search Term"}
                handleSelect={handleAutocompleteSelect}
                handleSubmit={handleInputSubmit}
                inputRef={autocompleteInputRefTwo}
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
