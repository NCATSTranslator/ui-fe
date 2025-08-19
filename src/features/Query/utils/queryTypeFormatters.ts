import { closest as closestStrMatch, distance } from 'fastest-levenshtein';
import { capitalizeAllWords, removeDuplicateObjects } from "@/features/Common/utils/utilities";
import { AutocompleteItem, FormatData, GenericItem, GeneItem } from '@/features/Query/types/querySubmission';

/**
 * Default query formatter that processes generic items and formats them for autocomplete
 *
 * @param items - Array of generic items to format
 * @param formatData - Object containing input string and resolved matches
 * @returns Promise resolving to an array of formatted autocomplete items
 *
 */
const defaultQueryFormatter = async (
  items: GenericItem[],
  formatData: FormatData
): Promise<AutocompleteItem[]> => {
  const autocompleteObjects: AutocompleteItem[] = items.map((item) => {
    const id = item.curie;
    const input = formatData.input;
    const matches = formatData.resolved[id];
    const types = item.types;

    // Attempt to find an exact text match
    let [bestMatch, isExactMatch] = _findExactMatch(input, matches);

    // If we can't find an exact one, use minimum edit distance to find some match
    if (!bestMatch) {
      bestMatch = closestStrMatch(input, matches);
    }

    const matchText = _genMatchText(item.label, input, bestMatch);
    const firstType = types[0];
    const formattedLabel = firstType === "biolink:Gene" || firstType === "biolink:Protein"
      ? item.label.toUpperCase()
      : capitalizeAllWords(item.label);

    return {
      id: id,
      label: formattedLabel,
      match: matchText,
      isExact: isExactMatch,
      score: _calculateOrderScore(input, bestMatch, isExactMatch),
      types: types
    };
  });

  // Ensure each autocomplete item is distinct
  return Promise.resolve(removeDuplicateObjects(autocompleteObjects, 'id'));
};

/**
 * Disease-specific query formatter that processes disease items and formats them for autocomplete
 *
 * This formatter includes special sorting logic to prioritize exact matches over partial matches.
 *
 * @param diseases - Array of disease items to format
 * @param formatData - Object containing input string and resolved matches
 * @returns Promise resolving to an array of formatted autocomplete items, sorted by exact matches first
 *
 */
const diseaseQueryFormatter = async (
  diseases: GenericItem[],
  formatData: FormatData
): Promise<AutocompleteItem[]> => {
  const autocompleteObjects: AutocompleteItem[] = diseases.map((disease) => {
    const id = disease.curie;
    const input = formatData.input;
    const matches = formatData.resolved[id];
    const types = disease.types;

    // Attempt to find an exact text match
    let [bestMatch, isExactMatch] = _findExactMatch(input, matches);

    // If we can't find an exact one, use minimum edit distance to find some match
    if (!bestMatch) {
      bestMatch = closestStrMatch(input, matches);
    }
    const matchText = _genMatchText(disease.label, input, bestMatch);
    return {
      id: id,
      label: capitalizeAllWords(disease.label),
      match: matchText,
      isExact: isExactMatch,
      score: _calculateOrderScore(input, bestMatch, isExactMatch),
      types: types
    };
  });

  // Ensure each autocomplete item is distinct
  const distinctObjects = removeDuplicateObjects(autocompleteObjects, 'id');
  return Promise.resolve(distinctObjects);
};

/**
 * Gene-specific query formatter that processes gene items and formats them for autocomplete
 *
 * The result of gene annotation includes the symbol and species information.
 *
 * @param genes - Array of gene items to format
 * @returns Promise resolving to an array of formatted autocomplete items
 *
 */
const geneQueryFormatter = async (
  genes: GeneItem[],
  formatData: FormatData
): Promise<AutocompleteItem[]> => {
  return Promise.resolve(genes.map((gene) => {
    const id = gene.curie;
    const input = formatData.input.toLowerCase();
    const matches = formatData.resolved[id];

    // Attempt to find an exact text match
    let isExactMatch = false;
    for (const match of matches) {
      const lowerMatch = match.toLowerCase();
      if (lowerMatch.includes(input)) {
        isExactMatch = true;
        break;
      }
    }
    return {
      id: id,
      label: gene.symbol,
      match: gene.species,
      isExact: isExactMatch,
      score: _calculateOrderScore(input, gene.symbol, isExactMatch),
      types: ['biolink:Gene']
    };
  }));
};

/**
 * Combined query formatter that routes items to the appropriate formatter based on their type
 *
 * This formatter delegates to:
 * - diseaseQueryFormatter for disease items
 * - geneQueryFormatter for gene items
 * - defaultQueryFormatter for all other items
 *
 * @param items - Array of generic items to format
 * @param formatData - Object containing input string and resolved matches
 * @returns Promise resolving to an array of formatted autocomplete items
 *
 */
export const combinedQueryFormatter = async (
  items: GenericItem[],
  formatData: FormatData
): Promise<AutocompleteItem[]> => {
  // Separate items by type
  const diseases: GenericItem[] = [];
  const genes: GeneItem[] = [];
  const otherItems: GenericItem[] = [];

  items.forEach((item) => {
    const types = item.types;
    const isDisease = types.some(type =>
      type === "biolink:Disease" ||
      type === "biolink:PhenotypicFeature" ||
      type === "biolink:DiseaseOrPhenotypicFeature"
    );
    const isGene = types.some(type =>
      type === "biolink:Gene" ||
      type === "biolink:Protein"
    );

    if (isDisease) {
      diseases.push(item);
    } else if (isGene) {
      // Only add to genes if it has the required GeneItem properties
      if ('symbol' in item && 'species' in item) {
        genes.push(item as GeneItem);
      } else {
        // If it's a gene but doesn't have GeneItem properties, treat as generic
        otherItems.push(item);
      }
    } else {
      otherItems.push(item);
    }
  });

  // Format each group using appropriate formatter
  const [diseaseTerms, geneTerms, otherTerms] = await Promise.all([
    diseases.length > 0 ? diseaseQueryFormatter(diseases, formatData) : Promise.resolve([]),
    genes.length > 0 ? geneQueryFormatter(genes, formatData) : Promise.resolve([]),
    otherItems.length > 0 ? defaultQueryFormatter(otherItems, formatData) : Promise.resolve([])
  ]);
  const allTerms = [...diseaseTerms, ...geneTerms, ...otherTerms];

  // Sort all terms
  allTerms.sort((a, b) => {
    if (a.score < b.score) return -1;
    if (a.score > b.score) return 1;
    return 0;
  });

  return allTerms;
};

const _calculateOrderScore = (
  input: string,
  bestMatch: string,
  isExactMatch: boolean): number => {
    const lowInput = input.toLowerCase();
    const lowBest = bestMatch.toLowerCase();
    return distance(lowInput, lowBest) - (isExactMatch ? 10 : 0);
};

const _findExactMatch = (
  input: string,
  matches: string[]
): [string, boolean] => {
    input = input.toLowerCase();
    for (const match of matches) {
      const lowMatch = match.toLowerCase();
      if (lowMatch.includes(input)) return [match, true];
    }
    return ['', false];
};

const _genMatchText = (
  termLabel: string,
  input: string,
  bestMatch: string
): string => {
    // Only include 'matched on' text if the returned label doesn't contain the input string
    if (termLabel.toLowerCase().includes(input.toLowerCase())) return '';
    return `matched on ${capitalizeAllWords(bestMatch)}`;
};
