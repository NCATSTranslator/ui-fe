import { closest as closestStrMatch } from 'fastest-levenshtein';
import { capitalizeAllWords, removeDuplicateObjects } from "./utilities";

export const defaultQueryFormatter = async (items, formatData) => {
  const autocompleteObjects = items.map((item) => {
    const id = item.curie
    const input = formatData.input
    const matches = formatData.resolved[id];
    const types = item.types;
    // Attempt to find an exact text match
    let bestMatch = false;
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

    return {
      id: id,
      label: capitalizeAllWords(item.label),
      match: matchText,
      types: types
    };
  });

  // Ensure each autocomplete item is distinct
  return Promise.resolve(removeDuplicateObjects(autocompleteObjects, 'id'));
}

export const diseaseQueryFormatter = async (diseases, formatData) => {
  const autocompleteObjects = diseases.map((disease) => {
    const id = disease.curie
    const input = formatData.input
    const matches = formatData.resolved[id];
    const types = disease.types;
    // Attempt to find an exact text match
    let bestMatch = false;
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
}

// The result of gene annotation includes the symbol and species information
export const geneQueryFormatter = async (genes) => {
  return Promise.resolve(genes.map((gene) => {
    return { id: gene.curie, label: gene.symbol, match: gene.species, types: ['biolink:Gene'] };
  }));
}

