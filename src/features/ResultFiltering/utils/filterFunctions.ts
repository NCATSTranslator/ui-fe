import { Filter, FilterFamily, FilterType, GroupedFilters } from '@/features/ResultFiltering/types/filters';
import { replaceTreatWithImpact } from '@/features/Core/utils/stringFormatters';

export const FILTERING_CONSTANTS = {
  RESULT: 'r' as const,
  PATH: 'p' as const,
  EDGE: 'e' as const,
  GLOBAL: 'g' as const,
  FAMILIES: {
    ROLE: 'role' as const,
    ARA: 'ara' as const
  },
  DYNAMIC_TAG: {
    BOOKMARK: {
      id: 'r/sv/bookmark',
      description: {
        name: 'Has Bookmark',
        description: '',
      },
    },
    NOTE: {
      id: 'r/sv/note',
      description: {
        name: 'Has Note',
        description: '',
      },
    },
  },
  WEIGHT: {
    LIGHT: 1,
    HEAVY: 10000,
  },
} as const;

/**
 * Normalizes a free-text search term for storage and matching: trims surrounding
 * whitespace and collapses internal runs of whitespace to a single space.
 * @param {string} value - The raw search term.
 * @returns {string} The normalized term.
 */
export const normalizeSearchTerm = (value: string): string => {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Normalizes and lowercases a search term for matching purposes.
 */
export const normalizeSearchTermForMatch = (value: string): string => {
  return normalizeSearchTerm(value).toLowerCase();
}

/**
 * Case-insensitive, whitespace-normalized comparison of two filter values.
 */
export const isSameFilterValue = (a?: string, b?: string): boolean =>
  normalizeSearchTermForMatch(a || '') === normalizeSearchTermForMatch(b || '');

/**
 * Applies the same treat→impact display substitution used for edge predicates.
 */
export const formatPredicateFilterName = (name: string): string => {
  if (!name.includes('treat')) return name;
  return replaceTreatWithImpact(name);
};

/** Rewrites pred-family filter names for UI display. Mutates the filters object in place. */
export const applyPredicateFilterDisplayNames = (filters: { [key: string]: Filter }): void => {
  for (const [tagId, filter] of Object.entries(filters)) {
    if (getTagFamily(tagId) === 'pred' && filter.name?.includes('treat')) {
      filters[tagId] = { ...filter, name: formatPredicateFilterName(filter.name) };
    }
  }
};

export const makeEntitySearch = (): Filter => {
  return {
    id: 'g/str',
    value: '',
    negated: false,
    name: '',
    includeWeight: FILTERING_CONSTANTS.WEIGHT.LIGHT,
    excludeWeight: FILTERING_CONSTANTS.WEIGHT.HEAVY
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
    case FILTERING_CONSTANTS.RESULT: return getResultFamilies();
    case FILTERING_CONSTANTS.PATH: return getPathFamilies();
    case FILTERING_CONSTANTS.EDGE: return getEdgeFamilies();
    default: throw new RangeError(`Invalid filter type: ${type}`);
  }
}

export const isResultTag = (tagID: string): boolean => {
  return getTagType(tagID) === FILTERING_CONSTANTS.RESULT;
}

export const isPathTag = (tagID: string): boolean => {
  return getTagType(tagID) === FILTERING_CONSTANTS.PATH;
}

export const isEdgeTag = (tagID: string): boolean => {
  return getTagType(tagID) === FILTERING_CONSTANTS.EDGE;
}

export const isGlobalTag = (tagID: string): boolean => {
  return getTagType(tagID) === FILTERING_CONSTANTS.GLOBAL;
}

export const isPathEvidenceTag = (tagID: string): boolean => {
  return isPathTag(tagID) && getTagFamily(tagID) === 'ev';
}

export const getValidFamilies = (): FilterFamily[] => {
  return ['cc', 'di', 'pc', 'pred', 'pt', 'role', 'ara', 'otc', 'tdl', 'sv', 'ev'];
}

export const getResultFamilies = (): FilterFamily[] => {
  return ['cc', 'di', 'role', 'otc', 'tdl', 'sv'];
}

export const getPathFamilies = (): FilterFamily[] => {
  return ['pc', 'pred', 'pt', 'ev', 'ara'];
}

export const getEdgeFamilies = (): FilterFamily[] => {
  return ['pred', 'ev'];
}

export const isTagFilter = (filter: Filter): boolean => {
  const family = getFilterFamily(filter);
  return getValidFamilies().includes(family);
}

export const groupFilterByType = (filters: Filter[]): [Filter[], Filter[], Filter[], Filter[]] => {
  const resultFilters: Filter[] = [];
  const pathFilters: Filter[] = [];
  const edgeFilters: Filter[] = [];
  const globalFilters: Filter[] = [];
  for (let filter of filters) {
    if (isResultFilter(filter)) {
      resultFilters.push(filter);
    } else if (isPathFilter(filter)) {
      pathFilters.push(filter);
    } else if (isEdgeFilter(filter)) {
      edgeFilters.push(filter);
    } else {
      globalFilters.push(filter);
    }
  }

  return [resultFilters, pathFilters, edgeFilters, globalFilters];
}

export const isResultFilter = (filter: Filter): boolean => {
  return isResultTag(filter.id || '');
}

export const isPathFilter = (filter: Filter): boolean => {
  return isPathTag(filter.id || '');
}

export const isEdgeFilter = (filter: Filter): boolean => {
  return isEdgeTag(filter.id || '');
}

export const isGlobalFilter = (filter: Filter): boolean => {
  return isGlobalTag(filter.id || '');
}

export const isEvidenceFilter = (filter: Filter): boolean => {
  return getFilterFamily(filter) === 'ev';
}

export const isExclusion = (filter: Filter): boolean => {
  return filter.negated || false;
}

export const isEntityFilter = (filter: Filter): boolean => {
  return getFilterFamily(filter) === 'str';
}

export const getFilterFamily = (filter: Filter): FilterFamily => {
  return getTagFamily(filter.id || '') as FilterFamily;
}

export const hasSameFamily = (filterA: Filter | null, filterB: Filter | null): boolean => {
  if (filterA === null || filterB === null) return false;
  return getFilterFamily(filterA) === getFilterFamily(filterB);
}

export const hasFilterFamily = (filter: Filter, family: FilterFamily): boolean => {
  return getFilterFamily(filter) === family;
}

export const getFilterLabel = (filter: Filter | FilterFamily): string => {
  const defaultLabel = "Tag";

  switch(typeof filter === 'string' ? filter as FilterFamily : getFilterFamily(filter)) {
    case "cc":   return "Development Stage";
    case "pc":   return "Objects within Paths";
    case "pred": return "Relationships";
    case "di":   return "Clinical Trial Indications";
    case "ara":  return "Reasoning Agent";
    case "role": return "Chemical Classification";
    case "pt":   return "Path Length";
    case "otc":  return "Availability";
    case "tdl":  return "Target Development Level";
    case "ev":   return "Evidence Type";
    case "str":  return "Search";
    case "sv":   return "Bookmarks & Notes";
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

/*
 * Returns a new object with each tag grouped by its type
 * @param {{[key: string]: Filter}} filters - The filters to group
 * @param {FilterType} type - The type of filters to group
 * @returns {GroupedFilters} A new object with each tag grouped by its type
 */
export const groupFilters = (filters: {[key: string]: Filter}, type: FilterType): GroupedFilters => {
  const newGroupedFilters: GroupedFilters = {};
  // Skip 'sv' since it's manually added to the top of the results filter list
  for (let family of getFamiliesByType(type)) {
    if (family !== 'sv') {
      newGroupedFilters[family] = {};
    }
  }

  for (let [id, description] of Object.entries(filters)) {
    if (getTagType(id) === type) {
      const family = getTagFamily(id);
      const group = newGroupedFilters[family];
      if (group) {
        group[id] = { ...description };
      }
    }
  }

  return newGroupedFilters;
}

/*
 * Returns true if the filter group has any filters
 * @param {GroupedFilters} filterGroup - The filter group to check
 * @returns {boolean} True if the filter group has any filters, false otherwise
 */
export const groupHasFilters = (filterGroup: GroupedFilters): boolean => {
  for (let categoryFilters of Object.values(filterGroup)) {
    if (categoryFilters && Object.keys(categoryFilters).length > 0) return true;
  }

  return false;
}

/*
 * Returns true if the filter group has any active filters
 * @param {GroupedFilters} filterGroup - The filter group to check
 * @param {Filter[]} activeFilters - The active filters to check
 * @returns {boolean} True if the active filters have any filters in the filter group, false otherwise
 */
export const groupHasActiveFilters = (filterGroup: GroupedFilters, activeFilters: Filter[]): boolean => {
  return activeFilters.some((filter) => {
    const family = getFilterFamily(filter);
    return family in filterGroup;
  });
}

/**
 * Clear all filters for a given family
 * @param family - The family to clear
 * @param activeFilters - The active filters
 * @returns void
 */
export const handleClearFamily = (family: string, activeFilters: Filter[], onSetFilters: (filters: Filter[]) => void) => {
  const remaining = activeFilters.filter(filter => {
    const filterFamily = getFilterFamily(filter);
    return filterFamily !== family;
  });
  onSetFilters(remaining);
}

/**
 * Clear all filters for a given group
 * @param group - The group to clear
 * @param activeFilters - The active filters
 * @param onSetFilters - The function to set the filters
 * @returns void
 */
export const handleClearGroup = (group: GroupedFilters, activeFilters: Filter[], onSetFilters: (filters: Filter[]) => void) => {
  const remaining = activeFilters.filter(filter => {
    const family = getFilterFamily(filter);
    return !(family in group);
  });
  onSetFilters(remaining);
};
