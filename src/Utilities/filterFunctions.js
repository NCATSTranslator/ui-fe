export const CONSTANTS = {
  PATH: 'p',
  RESULT: 'r',
  GLOBAL: 'g',
  FAMILIES: {
    ROLE: 'role'
  }
}

export const makeEntitySearch = () => {
  return { id: 'g/str', value: '', negated: false };
}

export const getFamiliesByType = (type) => {
  switch(type) {
    case CONSTANTS.RESULT: return getResultFamilies();
    case CONSTANTS.PATH: return getPathFamilies();
    default: throw new RangeError(`Invalid filter type: ${type}`);
  }
}

export const isResultTag = (tagID) => {
  return getTagType(tagID) === CONSTANTS.RESULT;
}

export const isPathTag = (tagID) => {
  return getTagType(tagID) === CONSTANTS.PATH;
}

export const isGlobalTag = (tagID) => {
  return getTagType(tagID) === CONSTANTS.GLOBAL;
}

export const getValidFamilies = () => {
  return ['cc', 'di', 'pc', 'pt', 'role', 'ara'];
}

export const getResultFamilies = () => {
  return ['cc', 'di', 'role', 'ara'];
}

export const getPathFamilies = () => {
  return ['pc', 'pt'];
}

export const isTagFilter = (filter) => {
  const family = filterFamily(filter);
  return getValidFamilies().includes(family);
}

export const groupFilterByType = (filters) => {
  const resultFilters = [];
  const pathFilters = [];
  const globalFilters = [];
  for (let filter of filters) {
    if (isResultFilter(filter)) {
      resultFilters.push(filter);
    } else if (isPathFilter(filter)) {
      pathFilters.push(filter);
    } else {
      globalFilters.push(filter);
    }
  }

  return [resultFilters, pathFilters, globalFilters];
}

export const isResultFilter = (filter) => {
  return isResultTag(filter.id);
}

export const isPathFilter = (filter) => {
  return isPathTag(filter.id);
}

export const isGlobalFilter = (filter) => {
  return isGlobalTag(filter.id);
}

export const isExclusion = (filter) => {
  return filter.negated
}

export const isEntityFilter = (filter) => {
  return filterFamily(filter) === 'str';
}

export const filterFamily = (filter) => {
  return getTagFamily(filter.id);
}

export const hasSameFamily = (filterA, filterB) => {
  if (filterA === null || filterB === null) return false;
  return filterFamily(filterA) === filterFamily(filterB);
}

export const hasFilterFamily = (filter, family) => {
  return filterFamily(filter) === family;
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
    default: return defaultLabel;
  }
}

export const getTagType = (tagID) => {
  return splitTagID(tagID)[0];
}

export const getTagFamily = (tagID) => {
  return splitTagID(tagID)[1];
}

const splitTagID = (tagID) => {
  return tagID.split('/');
}
