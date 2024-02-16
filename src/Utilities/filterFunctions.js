export const isFacet = (filter) => {
  const family = filterFamily(filter);
  return validFacetFamilies.has(family);
}

export const isExclusion = (filter) => {
  return filter.negated
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

export const getFilterLabel = (filter) => {
  let filterLabel = "Tag";
  if(!filter.type)
    return filterLabel;
  let _filterFamily = filterFamily(filter);
  switch(_filterFamily){
    case "cc":
      filterLabel = "Chemical Category";
      break;
    case "pc":
      filterLabel = "Node Type";
      break;
    case "di":
      filterLabel = "Drug Indication";
      break;
    case "ara":
      filterLabel = "Reasoning Agent";
      break;
    case "role":
      filterLabel = "ChEBI Role";
      break;
    default:
      break;
  }
  return filterLabel;
}

// TODO: Make this a configuration
const validFacetFamilies = new Set(['role', 'rc', 'pc', 'fda', 'ara', 'di', 'cc']);
