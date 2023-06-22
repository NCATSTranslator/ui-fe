export const isFacet = (filter) => {
  const family = filterFamily(filter);
  return validFacetFamilies.has(family);
}

export const isFdaFilter = (filter) => {
  return filter.type === 'fda:approved';
}

export const isEvidenceFilter = (filter) => {
  return filter.type === 'evi:';
}

export const isTextFilter = (filter) => {
  return filter.type === 'str:';
}

export const hasSameFacetFamily = (facetA, facetB) => {
  return facetFamily(facetA) === facetFamily(facetB);
}

export const facetFamily = (facet) => {
  return facet.split(':')[0];
}

const filterFamily = (filter) => {
  return facetFamily(filter.type);
}

// TODO: Make this a configuration
const validFacetFamilies = new Set(['role', 'rc', 'pc', 'fda', 'ara', 'di']);
