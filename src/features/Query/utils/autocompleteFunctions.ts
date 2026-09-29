import { AutocompleteItem, AutocompleteConfig, Example, NormalizedNode } from '@/features/Query/types/querySubmission';
import { GENE_ONLY_TAXA_PARAM } from '@/features/Query/utils/queryTypeAnnotators';

/**
 * Returns a copy of the autocomplete item with the species match appended to its
 * label for NCBIGene entries. Returns the item unchanged when not applicable.
 * Never mutates the input item.
 *
 * @param {AutocompleteItem} item - The autocomplete item to label.
 * @returns {AutocompleteItem} The labeled item (a new object when modified).
 */
export const withGeneMatchLabel = (item: AutocompleteItem): AutocompleteItem => {
  if (item.id.includes("NCBIGene") && item.match && !item.label.includes(`(${item.match})`))
    return { ...item, label: `${item.label} (${item.match})` };
  return item;
};

/** True when autocomplete is limited to Gene only (Smart Query gene templates). */
export const isGeneScopedLookup = (types: string[]): boolean =>
  types.length === 1 && types[0] === 'Gene';

/**
 * Builds the Name Resolver `/lookup` query string (without leading `?`).
 * Gene-only lookups include `only_taxa`; mixed/non-gene lookups omit it.
 */
export const buildNameResolverLookupQuery = (
  inputText: string,
  types: string[],
  prefixes: string[],
  excludePrefixes: string[],
): string => {
  const prefixString = prefixes.length > 0 ? `&only_prefixes=${prefixes.join('|')}` : '';
  const excludePrefixString = excludePrefixes.length > 0
    ? `&exclude_prefixes=${excludePrefixes.join('|')}`
    : '';
  const typesString = types.length > 0 ? `&biolink_type=${types.join('&biolink_type=')}` : '';
  const taxaString = isGeneScopedLookup(types) ? `&only_taxa=${GENE_ONLY_TAXA_PARAM}` : '';

  return `string=${inputText}&autocomplete=true&offset=0&limit=100${typesString}${prefixString}${excludePrefixString}${taxaString}`;
};

/**
 * Fetches, annotates, and formats autocomplete items for the given input text.
 * Rejects if the fetch or formatting fails; the caller owns loading/error state.
 *
 * Callers must enforce a minimum input length (e.g. ≥ 2 characters) before
 * invoking this — empty or short strings are not guarded here.
 *
 * @param {string} inputText - The user's input text (caller-enforced length).
 * @param {AutocompleteConfig} config - Autocomplete functions plus type/prefix limits.
 * @param {string} endpoint - Name resolver endpoint URL.
 * @returns {Promise<AutocompleteItem[]>} Up to 40 formatted autocomplete items.
 */
export const getAutocompleteTerms = (
  inputText: string,
  { functions, limitTypes, limitPrefixes, excludePrefixes }: AutocompleteConfig,
  endpoint: string
): Promise<AutocompleteItem[]> => {
  console.log(`fetching '${inputText}'`);
  const formatData = { input: inputText.toLowerCase(), resolved: {} };

  return newFetchNodesFromInputText(inputText, limitTypes || [], limitPrefixes || [], excludePrefixes || [], endpoint)
    .then((response) => response.json())
    .then((nodes: NormalizedNode[]) => {
      let newNodes: { [key: string]: string[] } = {};
      for (const node of nodes) {
        newNodes[node.curie] = node.synonyms;
      }
      formatData.resolved = newNodes;
      return nodes;
    })
    .then((normalizedNodes) => functions.annotate(normalizedNodes))
    .then((annotatedNodes) => functions.format(annotatedNodes, formatData))
    .then((autocompleteItems) => {
      // Truncate items in case of too many matches
      const newAutocompleteItems = autocompleteItems.slice(0, 40);
      console.log('formatted autocomplete items:', newAutocompleteItems);
      return newAutocompleteItems;
    });
};

// Function to fetch nodes based on user input text
const newFetchNodesFromInputText = async (
  inputText: string,
  types: string[],
  prefixes: string[],
  excludePrefixes: string[],
  endpoint: string
): Promise<Response> => {
  const query = buildNameResolverLookupQuery(inputText, types, prefixes, excludePrefixes);

  const nameResolverRequestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  };

  return fetch(`${endpoint}?${query}`, nameResolverRequestOptions);
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
