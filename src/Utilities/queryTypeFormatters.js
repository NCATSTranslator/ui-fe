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
    const closestMatch = closestStrMatch(formatData.input, formatData.resolved[id]);
    return {
      id: id,
      label: capitalizeAllWords(disease.id.label),
      match: `matched on ${capitalizeAllWords(closestMatch)}`
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

