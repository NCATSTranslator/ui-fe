import { capitalizeAllWords } from "./utilities";

// By default grab the ID and label straight from the normalizer
export const defaultQueryFormatter = async (items) => {
  const autocompleteObjects = items.map((item) => {
    return {id: item.id.identifier, label: capitalizeAllWords(item.id.label)};
  });

  // Ensure each autocomplete item is unique
  return Promise.resolve(Array.from(new Set(autocompleteObjects.map(a => a.id)))
    .map(id => { return autocompleteObjects.find(a => a.id === id) }));
}

// The result of gene annotation includes the symbol and species information
export const geneQueryFormatter = async (genes) => {
  return Promise.resolve(genes.map((gene) => {
    return { id: gene.curie, label: gene.symbol, match: gene.species };
  }));
}

