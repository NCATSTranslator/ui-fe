import { Dispatch, SetStateAction } from 'react';
import { AutocompleteItem, AutocompleteFunctions, Example } from '../Types/querySubmission';

interface Node {
  curie: string;
  synonyms: string[];
}

// Function to get autocomplete terms based on user input
export const getAutocompleteTerms = (
  inputText: string,
  setLoadingAutocomplete: Dispatch<SetStateAction<boolean>>,
  setAutoCompleteItems: Dispatch<SetStateAction<AutocompleteItem[] | null>>,
  autocompleteFunctions: AutocompleteFunctions,
  limitTypes: string[] = [],
  limitPrefixes: string[] = [],
  endpoint: string
) => {
  if (inputText) {
    console.log(`fetching '${inputText}'`);
    setLoadingAutocomplete(true);
    const formatData = { input: inputText.toLowerCase(), resolved: {} };

    newFetchNodesFromInputText(inputText, limitTypes, limitPrefixes, endpoint)
      .then((response) => response.json())
      .then((nodes: Node[]) => {
        let newNodes: { [key: string]: string[] } = {};
        for (const node of nodes) {
          newNodes[node.curie] = node.synonyms;
        }
        formatData.resolved = newNodes;
        return nodes;
      })
      .then((normalizedNodes) => autocompleteFunctions.annotate(normalizedNodes))
      .then((annotatedNodes) => autocompleteFunctions.format(annotatedNodes, formatData))
      .then((autocompleteItems) => {
        // Truncate items in case of too many matches
        autocompleteItems = autocompleteItems.slice(0, 40);
        console.log('formatted autocomplete items:', autocompleteItems);
        setAutoCompleteItems(autocompleteItems);
        setLoadingAutocomplete(false);
      })
      .catch((error) => {
        console.log(error);
        setLoadingAutocomplete(false);
      });
  }
};

// Function to fetch nodes based on user input text
const newFetchNodesFromInputText = async (
  inputText: string,
  types: string[],
  prefixes: string[],
  endpoint: string
): Promise<Response> => {
  let prefixString = "&only_prefixes=";
  if (prefixes.length > 0) {
    prefixString = `${prefixString}${prefixes.join('|')}`;
  } else {
    prefixString = "";
  }
  const typesString = types.length > 0 ? `&biolink_type=${types.join('&biolink_type=')}` : "";

  const nameResolverRequestOptions: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  };

  return fetch(
    `${endpoint}?string=${inputText}&offset=0&limit=100${typesString}${prefixString}`,
    nameResolverRequestOptions
  );
};

// Function to filter and sort examples
export const filterAndSortExamples = (
  arr: Example[],
  type: string,
  direction: string | false = false
): Example[]  => {
  if (direction) {
    return arr
      .filter((query) => query.type === type && query.direction === direction)
      .sort((a, b) => (a.name > b.name ? 1 : -1));
  }
  return arr
    .filter((query) => query.type === type)
    .sort((a, b) => (a.name > b.name ? 1 : -1));
};
