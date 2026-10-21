import { useRef, useState, Dispatch, SetStateAction, RefObject } from 'react';
import { AutocompleteItem, AutocompleteConfig } from '@/features/Query/types/querySubmission';
import { useAutocomplete, useSyncedAutocompleteFromNodeParams } from '@/features/Query/hooks/customQueryHooks';
import { withGeneMatchLabel } from '@/features/Query/utils/autocompleteFunctions';

/** Everything one pathfinder search bar needs: its selection, text, autocomplete state, and handlers. */
export interface PathfinderTerm {
  queryItem: AutocompleteItem | null;
  inputText: string;
  autocompleteItems: AutocompleteItem[] | null;
  loadingAutocomplete: boolean;
  autocompleteVisibility: boolean;
  setAutocompleteVisibility: Dispatch<SetStateAction<boolean>>;
  inputRef: RefObject<HTMLInputElement | null>;
  /** The user typed: drop any selection and query autocomplete. */
  onChange: (text: string) => void;
  /** The user picked an autocomplete item. */
  onItemSelect: (item: AutocompleteItem) => void;
  onClear: () => void;
}

interface InitialNodeParams {
  nodeId: string | null;
  nodeLabel: string | null;
  nodeCategory: string | null;
}

/** The raw state and autocomplete a term is assembled from. */
interface TermSource {
  queryItem: AutocompleteItem | null;
  setQueryItem: (item: AutocompleteItem | null) => void;
  inputText: string;
  setInputText: (text: string) => void;
  autocomplete: ReturnType<typeof useAutocomplete>;
  inputRef: RefObject<HTMLInputElement | null>;
  onClear: () => void;
}

/**
 * State for the two pathfinder search terms. The first term can be prefilled
 * from node URL params (canvas/node links); the second is always user-entered.
 */
export const usePathfinderTerms = (initial: InitialNodeParams, autocompleteConfig: AutocompleteConfig, nameResolverEndpoint: string) => {
  const synced = useSyncedAutocompleteFromNodeParams(initial.nodeId, initial.nodeLabel, initial.nodeCategory);
  const [inputTwoText, setInputTwoText] = useState("");
  const [queryItemTwo, setQueryItemTwo] = useState<AutocompleteItem | null>(null);
  const autocompleteOne = useAutocomplete(autocompleteConfig, nameResolverEndpoint);
  const autocompleteTwo = useAutocomplete(autocompleteConfig, nameResolverEndpoint);
  const inputRefOne = useRef<HTMLInputElement>(null);
  const inputRefTwo = useRef<HTMLInputElement>(null);

  const makeTerm = ({ queryItem, setQueryItem, inputText, setInputText, autocomplete, inputRef, onClear }: TermSource): PathfinderTerm => ({
    queryItem,
    inputText,
    autocompleteItems: autocomplete.autocompleteItems,
    loadingAutocomplete: autocomplete.loadingAutocomplete,
    autocompleteVisibility: autocomplete.autocompleteVisibility,
    setAutocompleteVisibility: autocomplete.setAutocompleteVisibility,
    inputRef,
    onChange: (text) => {
      setQueryItem(null);
      setInputText(text);
      autocomplete.delayedQuery(text);
    },
    onItemSelect: (item) => {
      // add in match text for genes, which should be the species
      const selected = withGeneMatchLabel(item);
      setInputText(selected.label);
      setQueryItem(selected);
      if (autocomplete.autocompleteItems) autocomplete.setAutocompleteVisibility(false);
    },
    onClear,
  });

  const one = makeTerm({
    queryItem: synced.queryItem, setQueryItem: synced.setQueryItem,
    inputText: synced.inputText, setInputText: synced.setInputText,
    autocomplete: autocompleteOne, inputRef: inputRefOne, onClear: synced.clear,
  });
  const two = makeTerm({
    queryItem: queryItemTwo, setQueryItem: setQueryItemTwo,
    inputText: inputTwoText, setInputText: setInputTwoText,
    autocomplete: autocompleteTwo, inputRef: inputRefTwo,
    onClear: () => { setQueryItemTwo(null); setInputTwoText(""); },
  });

  const swapTerms = () => {
    const prevItemOne = synced.queryItem;
    synced.setQueryItem(queryItemTwo);
    setQueryItemTwo(prevItemOne);
    const prevTextOne = synced.inputText;
    synced.setInputText(inputTwoText);
    setInputTwoText(prevTextOne);
  };

  return { one, two, swapTerms };
};
