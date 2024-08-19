export const makeEntitySearch = () => {
  return { family: 'str', value: '', negated: false };
}

export const getValidFamilies = () => {
  return [...validFacetFamilies];
}

export const isFacet = (filter) => {
  const family = filterFamily(filter);
  return validFacetFamilies.includes(family);
}

export const isExclusion = (filter) => {
  return filter.negated
}

export const isTextFilter = (filter) => {
  return filter.family === 'str';
}

export const hasSameFacetFamily = (facetA, facetB) => {
  return facetFamily(facetA) === facetFamily(facetB);
}

export const facetFamily = (facet) => {
  return facet.split('/')[1];
}


export const hasFilterFamily = (filter, facetFamily) => {
  return filterFamily(filter) === facetFamily;
}

export const getFilterLabel = (filter) => {
  const defaultLabel = "Tag";
  if(!filter.family) {
    return defaultLabel;
  }

  switch(filterFamily(filter)){
    case "cc":   return "Chemical Category";
    case "pc":   return "Object Type";
    case "di":   return "Drug Indication";
    case "ara":  return "Reasoning Agent";
    case "role": return "ChEBI Role";
    case "pt":   return "Relationship Type";
  }

  return defaultLabel;
}

export const getTagFamily = (tag, category) => {
  return splitTag(tag)[1];
}

// TODO: Make this a configuration
const validFacetFamilies = ['cc', 'di', 'pc', 'pt', 'role', 'ara'];

const splitTag = (tag) => {
  return tag.split('/');
}

const filterFamily = (filter) => {
  return facetFamily(filter.family);
}
