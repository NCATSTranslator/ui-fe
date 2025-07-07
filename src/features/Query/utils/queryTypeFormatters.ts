import { closest as closestStrMatch } from 'fastest-levenshtein';
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
    let bestMatch: string = '';
    for (const match of matches) {
      if (match.includes(input)) {
        bestMatch = match;
        break;
      }
    }

    // If we can't find an exact one, use minimum edit distance to find some match
    if (!bestMatch) {
      bestMatch = closestStrMatch(formatData.input, formatData.resolved[id]);
    }

    // only include 'matched on' text if the returned label doesn't contain the input string
    const matchText = (item.label.toLowerCase().includes(input.toLowerCase())) 
      ? ''
      : `matched on ${capitalizeAllWords(bestMatch)}`;

    const firstType = types[0];
    const formattedLabel = firstType === "biolink:Gene" || firstType === "biolink:Protein" 
      ? item.label.toUpperCase()
      : capitalizeAllWords(item.label);
      
    return {
      id: id,
      label: formattedLabel,
      match: matchText,
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
    let bestMatch: string = '';
    for (const match of matches) {
      if (match.includes(input)) {
        bestMatch = match;
        break;
      }
    }

    // If we can't find an exact one, use minimum edit distance to find some match
    if (!bestMatch) {
      bestMatch = closestStrMatch(formatData.input, formatData.resolved[id]);
    }

    // only include 'matched on' text if the returned label doesn't contain the input string
    const matchText = (disease.label.toLowerCase().includes(input.toLowerCase())) 
      ? ''
      : `matched on ${capitalizeAllWords(bestMatch)}`;

    return {
      id: id,
      label: capitalizeAllWords(disease.label),
      match: matchText,
      types: types
    };
  });

  // Ensure each autocomplete item is distinct
  const distinctObjects = removeDuplicateObjects(autocompleteObjects, 'id');

  // Sort disease objects by exact matches first
  distinctObjects.sort((a, b) => {
    if (a.match === '' && b.match !== '') {
      return -1;
    } else if (a.match !== '' && b.match === '') {
      return 1;
    } else {
      return 0;
    }
  });

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
const geneQueryFormatter = async (genes: GeneItem[]): Promise<AutocompleteItem[]> => {
  return Promise.resolve(genes.map((gene) => {
    return { 
      id: gene.curie, 
      label: gene.symbol, 
      match: gene.species, 
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
  const [diseaseResults, geneResults, defaultResults] = await Promise.all([
    diseases.length > 0 ? diseaseQueryFormatter(diseases, formatData) : Promise.resolve([]),
    genes.length > 0 ? geneQueryFormatter(genes) : Promise.resolve([]),
    otherItems.length > 0 ? defaultQueryFormatter(otherItems, formatData) : Promise.resolve([])
  ]);

  // Combine all results
  return [...diseaseResults, ...geneResults, ...defaultResults];
}; 