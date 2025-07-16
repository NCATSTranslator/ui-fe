import { useState, useCallback, useRef, FC, Dispatch, SetStateAction } from 'react';
import { useSelector } from 'react-redux';
import { currentConfig } from "@/features/UserAuth/slices/userSlice";
import styles from './QueryPathfinder.module.scss';
import Button from '@/features/Core/components/Button/Button';
import { AutocompleteItem } from '@/features/Query/types/querySubmission';
import { AutocompleteFunctions } from "@/features/Query/types/querySubmission";
import { defaultQueryFilterFactory } from '@/features/Query/utils/queryTypeFilters';
import { getDataFromQueryVar } from '@/features/Common/utils/utilities';
import ArrowRight from "@/assets/icons/directional/Arrows/Arrow Right.svg?react";
import PathfinderDivider from "@/assets/icons/directional/Pathfinder/Pathfinder.svg?react";
import SwapIcon from '@/assets/icons/buttons/Swap.svg?react';
import InfoIcon from '@/assets/icons/status/Alerts/Info.svg?react';
import AddIcon from '@/assets/icons/buttons/Add/Add.svg?react';
import SubtractIcon from '@/assets/icons/buttons/Subtract/Subtract.svg?react';
import loadingIcon from '@/assets/images/loading/loading-white.png';
import Select from '@/features/Common/components/Select/Select';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import { Result } from "@/features/ResultList/types/results.d";
import { useAutocomplete, useQuerySubmission } from '@/features/Query/hooks/customQueryHooks';
import { AppToastContainer } from '@/features/Common/components/AppToastContainer/AppToastContainer';
import AutocompleteInput from '@/features/Query/components/AutocompleteInput/AutocompleteInput';
import QueryResultsHeader from '@/features/Query/components/QueryResultsHeader/QueryResultsHeader';
import { queryTypeAnnotator } from '@/features/Query/utils/queryTypeAnnotators';
import { combinedQueryFormatter } from '@/features/Query/utils/queryTypeFormatters';
import { ResultContextObject } from '@/features/ResultList/utils/llm';

type QueryPathfinderProps = {
  handleResultMatchClick?: (match: ResultContextObject) => void;
  isResults?: boolean;
  loading?: boolean;
  pk?: string;
  results?: Result[];
  setShareModalFunction?: Dispatch<SetStateAction<boolean>>;
}

const QueryPathfinder: FC<QueryPathfinderProps> = ({ 
  loading = false,
  handleResultMatchClick,
  isResults = false,
  pk,
  results = [],
  setShareModalFunction = ()=>{} 
}) => {

  const config = useSelector(currentConfig);
  const nameResolverEndpoint = (config?.name_resolver) ? `${config.name_resolver}/lookup` : 'https://name-lookup.transltr.io/lookup';
  const [isError, setIsError] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [inputOneText, setInputOneText] = useState("");
  const [inputTwoText, setInputTwoText] = useState("");
  const [queryItemOne, setQueryItemOne] = useState<AutocompleteItem | null>(null);
  const [queryItemTwo, setQueryItemTwo] = useState<AutocompleteItem | null>(null);
  const [hasMiddleType, setHasMiddleType] = useState<boolean>(false);
  const [middleType, setMiddleType] = useState<string>("");

  const labelOne = getDataFromQueryVar("lone");
  const labelTwo = getDataFromQueryVar("ltwo");
  const idOne = getDataFromQueryVar("ione");
  const idTwo = getDataFromQueryVar("itwo");
  const constraintText = getDataFromQueryVar("c");

  const autocompleteFunctions = useRef<AutocompleteFunctions>( {
    filter: defaultQueryFilterFactory,
    annotate: queryTypeAnnotator,
    format: combinedQueryFormatter
  });
  const limitPrefixes = useRef([]);
  const limitTypes = useRef(["Drug", "ChemicalEntity", "Disease", "Gene", "SmallMolecule", "PhenotypicFeature"]);

  const {
    autocompleteItems: autocompleteItemsOne,
    loadingAutocomplete: autocompleteLoadingOne,
    delayedQuery: delayedQueryOne,
    clearAutocompleteItems: clearAutocompleteItemsOne
  } = useAutocomplete(autocompleteFunctions, limitTypes, limitPrefixes, nameResolverEndpoint);

  const {
    autocompleteItems: autocompleteItemsTwo,
    loadingAutocomplete: autocompleteLoadingTwo,
    delayedQuery: delayedQueryTwo,
    clearAutocompleteItems: clearAutocompleteItemsTwo
  } = useAutocomplete(autocompleteFunctions, limitTypes, limitPrefixes, nameResolverEndpoint);

  const { isLoading, submitPathfinderQuery } = useQuerySubmission('pathfinder');

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
        clearAutocompleteItemsOne();
      } else {
        clearAutocompleteItemsTwo();
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
    submitPathfinderQuery!(itemOne, itemTwo, hasMiddleType ? middleType : undefined);
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

  return (
    <div className={`${styles.queryPathfinder} ${isResults && styles.results}`}>
      <AppToastContainer />
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
            <div className={styles.buttons}>
              <Button 
                handleClick={swapTerms} 
                variant="secondary" 
                className={`${styles.button}`}
                iconLeft={<SwapIcon/>}
                smallFont
              >
                Swap Terms
              </Button>
              <Button 
                handleClick={handleMiddleTypeTrigger} 
                variant="secondary"
                className={`${styles.button} ${styles.middleTypeButton}`}
                dataTooltipId='middle-type-tooltip'
                iconLeft={hasMiddleType ? <SubtractIcon/> : <AddIcon/>}
                iconRight={<InfoIcon className={styles.infoIcon}/>}
                smallFont
              >
                Middle Object
              </Button>
              <Tooltip
                id='middle-type-tooltip'
                >
                  <span>Pre-filter results by selecting a middle object type to be included within paths between the entered search terms. <br/><br/> Genes, diseases, phenotypes, and chemicals are currently supported.</span>
              </Tooltip>
            </div>
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
                placeholder="Enter First Search Term"
                value={inputOneText}
                onChange={(e) => handleQueryItemChange(e, true)}
                onItemSelect={(item) => handleItemSelection(item, true)}
                autocompleteItems={autocompleteItemsOne}
                loadingAutocomplete={autocompleteLoadingOne}
                selectedItem={queryItemOne}
                onClear={() => clearItem(1)}
                className={styles.inputContainer}
                selectedClassName={styles.selected}
                onClearAutocomplete={clearAutocompleteItemsOne}
              />
              <PathfinderDivider className={styles.dividerIcon}/>
              {
                hasMiddleType &&
                <>
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
                  <PathfinderDivider className={styles.dividerIcon}/>
                </>
              }
              <AutocompleteInput
                placeholder="Enter Second Search Term"
                value={inputTwoText}
                onChange={(e) => handleQueryItemChange(e, false)}
                onItemSelect={(item) => handleItemSelection(item, false)}
                autocompleteItems={autocompleteItemsTwo}
                loadingAutocomplete={autocompleteLoadingTwo}
                selectedItem={queryItemTwo}
                onClear={() => clearItem(2)}
                className={styles.inputContainer}
                selectedClassName={styles.selected}
                onClearAutocomplete={clearAutocompleteItemsTwo}
              />
              <Button type='submit' className={styles.submitButton} iconOnly>
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
          </>
      }
    </div>
  );
}

export default QueryPathfinder;