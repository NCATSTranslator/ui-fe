export const isFacetFilter = (filter) => {
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

const filterFamily = (filter) => {
  return filter.type.split(':')[0];
}

// TODO: Make this a configuration
const validFacetFamilies = new Set(['atc', 'rc', 'pc', 'fda']);
