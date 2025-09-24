import { Filter, Filters, FilterFamily, FilterType } from '@/features/ResultFiltering/types/filters';
import { Tags } from '@/features/ResultList/types/results';

export const CONSTANTS = {
  RESULT: 'r' as const,
  PATH: 'p' as const,
  GLOBAL: 'g' as const,
  FAMILIES: {
    ROLE: 'role' as const
  },
  DYNAMIC_TAG: {
    BOOKMARK: {
      id: 'r/sv/bookmark',
      name: 'Has Bookmark',
      value: '',
    },
    NOTE: {
      id: 'r/sv/note',
      name: 'Has Note',
      value: '',
    },
  },
  WEIGHT: {
    LIGHT: 1,
    HEAVY: 10000,
  },
} as const;

export const makeEntitySearch = (): Filter => {
  return {
    id: 'g/str',
    value: '',
    negated: false,
    name: '',
    includeWeight: CONSTANTS.WEIGHT.LIGHT,
    excludeWeight: CONSTANTS.WEIGHT.HEAVY
  };
}

export const makeFilter = (name: string, includeWeight: number, excludeWeight: number): Filter => {
  return {
    name: name,
    value: '',
    count: 1,
    includeWeight: includeWeight,
    excludeWeight: excludeWeight
  }
}

export const getFamiliesByType = (type: FilterType): FilterFamily[] => {
  switch(type) {
    case CONSTANTS.RESULT: return getResultFamilies();
    case CONSTANTS.PATH: return getPathFamilies();
    default: throw new RangeError(`Invalid filter type: ${type}`);
  }
}

export const isResultTag = (tagID: string): boolean => {
  return getTagType(tagID) === CONSTANTS.RESULT;
}

export const isPathTag = (tagID: string): boolean => {
  return getTagType(tagID) === CONSTANTS.PATH;
}

export const isGlobalTag = (tagID: string): boolean => {
  return getTagType(tagID) === CONSTANTS.GLOBAL;
}

export const isPathEvidenceTag = (tagID: string): boolean => {
  return isPathTag(tagID) && getTagFamily(tagID) === 'ev';
}

export const getValidFamilies = (): FilterFamily[] => {
  return ['cc', 'di', 'pc', 'pt', 'role', 'ara', 'otc', 'tdl', 'sv', 'ev'];
}

export const getResultFamilies = (): FilterFamily[] => {
  return ['cc', 'di', 'role', 'ara', 'otc', 'tdl', 'sv'];
}

export const getPathFamilies = (): FilterFamily[] => {
  return ['pc', 'pt', 'ev'];
}

export const isTagFilter = (filter: Filter): boolean => {
  const family = filterFamily(filter);
  return getValidFamilies().includes(family);
}

export const groupFilterByType = (filters: Filter[]): [Filter[], Filter[], Filter[]] => {
  const resultFilters: Filter[] = [];
  const pathFilters: Filter[] = [];
  const globalFilters: Filter[] = [];
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

export const isResultFilter = (filter: Filter): boolean => {
  return isResultTag(filter.id || '');
}

export const isPathFilter = (filter: Filter): boolean => {
  return isPathTag(filter.id || '');
}

export const isGlobalFilter = (filter: Filter): boolean => {
  return isGlobalTag(filter.id || '');
}

export const isEvidenceFilter = (filter: Filter): boolean => {
  return filterFamily(filter) === 'ev';
}

export const isExclusion = (filter: Filter): boolean => {
  return filter.negated || false;
}

export const isEntityFilter = (filter: Filter): boolean => {
  return filterFamily(filter) === 'str';
}

export const filterFamily = (filter: Filter): FilterFamily => {
  return getTagFamily(filter.id || '') as FilterFamily;
}

export const hasSameFamily = (filterA: Filter | null, filterB: Filter | null): boolean => {
  if (filterA === null || filterB === null) return false;
  return filterFamily(filterA) === filterFamily(filterB);
}

export const hasFilterFamily = (filter: Filter, family: FilterFamily): boolean => {
  return filterFamily(filter) === family;
}

export const getFilterLabel = (filter: Filter): string => {
  const defaultLabel = "Tag";

  switch(filterFamily(filter)) {
    case "cc":   return "Development Stage";
    case "pc":   return "Objects within Paths";
    case "di":   return "CT Indications";
    case "ara":  return "Reasoning Agent";
    case "role": return "Chemical Classification";
    case "pt":   return "Path Length";
    case "otc":  return "Availability";
    case "tdl":  return "Target Development Level";
    case "ev":   return "Evidence Type";
    default: return defaultLabel;
  }
}

export const getTagType = (tagID: string): FilterType => {
  return _splitTagID(tagID)[0] as FilterType;
}

export const getTagFamily = (tagID: string): FilterFamily => {
  return _splitTagID(tagID)[1] as FilterFamily;
}

const _splitTagID = (tagID: string): string[] => {
  return tagID.split('/');
}
