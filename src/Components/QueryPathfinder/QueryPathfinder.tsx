import { useState, useCallback, useRef, FC, Dispatch, SetStateAction } from 'react';
import { useSelector } from 'react-redux';
import { currentConfig } from "../../Redux/slices/userSlice";
import styles from './QueryPathfinder.module.scss';
import Autocomplete from '../Autocomplete/Autocomplete';
import TextInput from '../Core/TextInput';
import Button from '../Core/Button';
import { AutocompleteItem } from '../../Types/querySubmission';
import { AutocompleteFunctions } from "../../Types/querySubmission";
import { defaultQueryFilterFactory } from '../../Utilities/queryTypeFilters';
import { defaultQueryAnnotator } from '../../Utilities/queryTypeAnnotators';
import { defaultQueryFormatter } from '../../Utilities/queryTypeFormatters';
import { ToastContainer, Slide } from 'react-toastify';
import { generateEntityLink, getDataFromQueryVar, getIcon, getFormattedPathfinderName } from '../../Utilities/utilities';
import QuestionIcon from '../../Icons/Buttons/Search.svg?react';
import ArrowRight from "../../Icons/Directional/Arrows/Arrow Right.svg?react";
import PathfinderDivider from "../../Icons/Queries/PathfinderDivider.svg?react";
import ShareIcon from '../../Icons/Buttons/Link.svg?react';
import SwapIcon from '../../Icons/Buttons/Swap.svg?react';
import CloseIcon from '../../Icons/Buttons/Close/Close.svg?react';
import InfoIcon from '../../Icons/Status/Alerts/Info.svg?react';
import AddIcon from '../../Icons/Buttons/Add/Add.svg?react';
import SubtractIcon from '../../Icons/Buttons/Subtract/Subtract.svg?react';
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import Select from '../Core/Select';
import Tooltip from '../Tooltip/Tooltip';
import ResultsSummaryButton from "../ResultsSummaryButton/ResultsSummaryButton";
import { Result } from "../../Types/results";
import { useAutocomplete, useQuerySubmission } from '../../Utilities/customQueryHooks';

type QueryPathfinderProps = {
  handleResultMatchClick?: Function;
  isResults?: boolean;
  loading?: boolean;
  pk?: string;
  results?: Result[];
  setShareModalFunction?: Dispatch<SetStateAction<boolean>>;
}

const QueryPathfinder: FC<QueryPathfinderProps> = ({ 
  loading = false,
  handleResultMatchClick = ()=>{},
  isResults = false,
  pk,
  results = [],
  setShareModalFunction = ()=>{} }) => {

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

  const resultsPaneQuestionText = `What paths begin with ${labelOne} and end with ${labelTwo}?`;

  const autocompleteFunctions = useRef<AutocompleteFunctions>( {
    filter: defaultQueryFilterFactory,
    annotate: defaultQueryAnnotator,
    format: defaultQueryFormatter
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
      <ToastContainer
        position="top-center"
        autoClose={3000}
        theme="light"
        transition={Slide}
        pauseOnFocusLoss={false}
        hideProgressBar
        className="toastContainer"
        closeOnClick={false}
        closeButton={false}
      />
      <div className={`container ${styles.container}`}>
        { isResults 
          ?
            <>
              <div className={styles.resultsHeader}>
                <div className={styles.showingResultsContainer}>
                  <h6 className={styles.subHeading}>
                    What paths begin with
                    {
                      !!idOne && !!labelOne
                        ?
                          generateEntityLink(idOne, styles.searchedTerm, ()=>labelOne, true)
                        :
                          <span className={styles.searchedTerm}>{labelOne}</span>
                    }
                    {
                      !!constraintText && constraintText !== "undefined" &&
                      `, contain a ${getFormattedPathfinderName(constraintText.replace("Entity", "").replace("PhenotypicFeature", "Phenotype"))}, `
                    }
                    and end with
                    {
                      (!!labelTwo &&!!idTwo && idTwo !== 'null') 
                        ? generateEntityLink(idTwo, styles.searchedTerm, ()=>labelTwo, true) : <span className={styles.searchedTerm}>{labelTwo}</span>
                    }
                    ?
                  </h6>
                  <Button 
                    isSecondary
                    handleClick={()=>{setShareModalFunction(true)}}
                    className={styles.shareButton}
                  >
                    <ShareIcon/>Share Result Set
                  </Button>
                  {
                    !loading &&
                    <ResultsSummaryButton
                      results={results}
                      queryString={`${resultsPaneQuestionText}`}
                      handleResultMatchClick={handleResultMatchClick}
                      pk={!!pk ? pk : ""}
                    />
                  }
                </div>
              </div>
            </>
          :
            <>
              <h3 className={styles.h3}>Pathfinder finds associations between genes, diseases, and chemicals</h3>
              <h6 className={styles.h6}>Results will show paths beginning with the first search term and ending with the second</h6>
              <div className={styles.buttons}>
                <Button handleClick={swapTerms} isSecondary><SwapIcon/>Swap Terms</Button>
                <Button handleClick={handleMiddleTypeTrigger} isSecondary className={styles.middleTypeButton} dataTooltipId='middle-type-tooltip'>{ hasMiddleType ? <SubtractIcon/> : <AddIcon/>}Middle Object<InfoIcon/></Button>
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
                <div className={`${styles.inputContainer}`}>
                  <TextInput 
                    placeholder="Enter First Search Term" 
                    handleChange={(e) => handleQueryItemChange(e, true)} 
                    className={`${styles.input} ${!!queryItemOne && styles.selected}`}
                    value={inputOneText}
                    iconLeft={!!queryItemOne?.types ? getIcon(queryItemOne.types[0]) : <QuestionIcon/>}
                    iconRight={!!queryItemOne?.types ? <button className={styles.close} onClick={()=>clearItem(1)}><CloseIcon/></button> : false}
                  />
                  <Autocomplete 
                    isLoading={autocompleteLoadingOne}
                    items={autocompleteItemsOne}
                    handleItemClick={(item) => handleItemSelection(item, true)}
                  />
                </div>
                <PathfinderDivider/>
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
                    <PathfinderDivider/>
                  </>
                }
                <div className={`${styles.inputContainer}`}>
                  <TextInput 
                    placeholder="Enter Second Search Term" 
                    handleChange={(e) => handleQueryItemChange(e, false)} 
                    className={`${styles.input} ${!!queryItemTwo && styles.selected}`}
                    value={inputTwoText}
                    iconLeft={!!queryItemTwo?.types ? getIcon(queryItemTwo.types[0]) : <QuestionIcon/>}
                    iconRight={!!queryItemTwo?.types ? <button className={styles.close} onClick={()=>clearItem(2)}><CloseIcon/></button> : false}
                  />
                  <Autocomplete 
                    isLoading={autocompleteLoadingTwo}
                    items={autocompleteItemsTwo}
                    handleItemClick={(item) => handleItemSelection(item, false)}
                  />
                </div>
                <Button type='submit' className={styles.submitButton} iconOnly>
                  <ArrowRight/>
                </Button>
                <img src={loadingIcon} className={`${styles.loadingIcon} ${isLoading ? styles.active : ''} loadingIcon`} alt="loading icon"/>
              </form>
            </>
        }
      </div>
    </div>
  );
}

export default QueryPathfinder;