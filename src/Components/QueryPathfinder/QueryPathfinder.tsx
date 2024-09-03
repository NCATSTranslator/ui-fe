import { useState, useMemo, useCallback, useRef, Dispatch, SetStateAction } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { currentConfig, currentUser } from "../../Redux/rootSlice";
import styles from './QueryPathfinder.module.scss';
import Autocomplete from '../Autocomplete/Autocomplete';
import TextInput from '../Core/TextInput';
import Button from '../Core/Button';
import QuestionIcon from '../../Icons/Buttons/Search.svg?react';
import ArrowRight from "../../Icons/Directional/Arrows/Arrow Right.svg?react";
import PathfinderDivider from "../../Icons/Queries/PathfinderDivider.svg?react";
import { AutocompleteItem } from '../../Types/results';
import { getAutocompleteTerms } from '../../Utilities/autocompleteFunctions';
import { debounce } from 'lodash';
import { QueryTypeFunctions, queryTypes } from "../../Utilities/queryTypes";
import { defaultQueryFilterFactory } from '../../Utilities/queryTypeFilters';
import { defaultQueryAnnotator } from '../../Utilities/queryTypeAnnotators';
import { defaultQueryFormatter, diseaseQueryFormatter } from '../../Utilities/queryTypeFormatters';

type QueryPathfinderProps = {
  
}

const QueryPathfinder = () => {
  const config = useSelector(currentConfig);
  const nameResolverEndpoint = (config?.name_resolver) ? `${config.name_resolver}/lookup` : 'https://name-lookup.transltr.io/lookup';
  const [isError, setIsError] = useState(false);
  const [inputOneText, setInputOneText] = useState("");
  const [inputTwoText, setInputTwoText] = useState("");
  const [queryItemOne, setQueryItemOne] = useState<{id: string, label: string, match: string} | null>(null);
  const [queryItemTwo, setQueryItemTwo] = useState<{id: string, label: string, match: string} | null>(null);

  // Array, List of items to display in the autocomplete window
  const [autocompleteItemsOne, setAutoCompleteItemsOne] = useState<Array<AutocompleteItem> | null>(null);
  const [autocompleteItemsTwo, setAutoCompleteItemsTwo] = useState<Array<AutocompleteItem> | null>(null);
  // Bool, are autocomplete items loading
  const [autocompleteLoadingOne, setAutocompleteLoadingOne] = useState(false);
  const [autocompleteLoadingTwo, setAutocompleteLoadingTwo] = useState(false);


  const autocompleteFunctions = useRef<QueryTypeFunctions>( {
    filter: defaultQueryFilterFactory,
    annotate: defaultQueryAnnotator,
    format: defaultQueryFormatter
  });
  const limitPrefixes = useRef([]);
  const limitTypes = useRef(["Drug", "ChemicalEntity", "Disease", "Gene", "SmallMolecule", "PhenotypicFeature"]);

  const delayedQuery = useMemo(() => debounce(
    (inputText, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFunctions, limitType, limitPrefixes, endpoint) =>
      getAutocompleteTerms(inputText, setLoadingAutocomplete, setAutoCompleteItems, 
        autocompleteFunctions, limitType, limitPrefixes, endpoint), 750), []
  );

  // Event handler called when search bar is updated by user
  const handleQueryItemChange = useCallback((e: string, isFirstBar:boolean) => {
    let setAutocompleteLoading = (isFirstBar) ? setAutocompleteLoadingOne: setAutocompleteLoadingTwo;

    if(isFirstBar) {
      setInputOneText(e);
      delayedQuery(e, setAutocompleteLoadingOne, setAutoCompleteItemsOne, autocompleteFunctions.current, limitTypes.current, limitPrefixes.current, nameResolverEndpoint);
    } else {
      setInputTwoText(e);
      delayedQuery(e, setAutocompleteLoadingTwo, setAutoCompleteItemsTwo, autocompleteFunctions.current, limitTypes.current, limitPrefixes.current, nameResolverEndpoint);
    }
  },[setAutocompleteLoadingOne, setAutocompleteLoadingTwo, setAutoCompleteItemsOne, setAutoCompleteItemsTwo, setInputOneText, setIsError, delayedQuery, nameResolverEndpoint]);
  
  const updateQueryItem = (selectedNode: {id: string, label: string, match: string}, isFirstBar: boolean) => {
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
      clearAutocompleteItems(isFirstBar);
    }
  }

  const clearAutocompleteItems = (isFirstBar: boolean) => {
    if(isFirstBar)
      setAutoCompleteItemsOne(null);
    else
      setAutoCompleteItemsTwo(null);
  } 

  return (
    <div className={styles.queryPathfinder}>
      <div className={`container ${styles.container}`}>
        <h3 className={styles.h3}>Pathfinder finds associations between genes, diseases, and chemicals</h3>
        <h6 className={styles.h6}>Results will show paths beginning with the first search term and ending with the second</h6>
      </div>
      <form 
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          console.log("submit");
          // if(!queryItem) {
          //   handleSubmission(null);
          //   return;
          // }

          // if(queryItem.node === null && autocompleteItems.length > 0) {
          //   handleItemClick(autocompleteItems[0]);
          //   let newQueryItem = cloneDeep(queryItem);
          //   newQueryItem.node = autocompleteItems[0];
          //   handleSubmission(newQueryItem);
          // } else {
          //   handleSubmission(queryItem);
          // }
        }} 
      >
        <div className={`${styles.inputContainer}`}>
          <TextInput 
            placeholder="Enter First Search Term" 
            handleChange={(e) => handleQueryItemChange(e, true)} 
            className={styles.input}
            value={inputOneText}
            iconLeft={<QuestionIcon/>}
          />
          <Autocomplete 
            isLoading={autocompleteLoadingOne}
            items={autocompleteItemsOne}
            handleItemClick={(item) => handleItemSelection(item, true)}
          />
        </div>
        <PathfinderDivider/>
        <div className={`${styles.inputContainer}`}>
          <TextInput 
            placeholder="Enter Second Search Term" 
            handleChange={(e) => handleQueryItemChange(e, false)} 
            className={styles.input}
            value={inputTwoText}
            iconLeft={<QuestionIcon/>}
            iconRight
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
      </form>
    </div>
  );
}

export default QueryPathfinder;