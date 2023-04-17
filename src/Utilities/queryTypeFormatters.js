import { closest as closestStrMatch } from 'fastest-levenshtein';
import { capitalizeAllWords, removeDuplicateObjects } from "./utilities";

// By default grab the ID and label straight from the normalizer
export const defaultQueryFormatter = async (items) => {
  const autocompleteObjects = items.map((item) => {
    return {id: item.id.identifier, label: capitalizeAllWords(item.id.label)};
  });

  // Ensure each autocomplete item is distinct
  return Promise.resolve(removeDuplicateObjects(autocompleteObjects, o => o.id));
}

export const diseaseQueryFormatter = async (diseases, formatData) => {
  const autocompleteObjects = diseases.map((disease) => {
    const id = disease.id.identifier
    const input = formatData.input
    const matches = formatData.resolved[id];
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

    return {
      id: id,
      label: capitalizeAllWords(disease.id.label),
      match: `matched on ${capitalizeAllWords(bestMatch)}`
    };
  });

  // Ensure each autocomplete item is distinct
  return Promise.resolve(removeDuplicateObjects(autocompleteObjects, o => o.id));
}

// The result of gene annotation includes the symbol and species information
export const geneQueryFormatter = async (genes) => {
  return Promise.resolve(genes.map((gene) => {
    return { id: gene.curie, label: gene.symbol, match: gene.species };
  }));
}

