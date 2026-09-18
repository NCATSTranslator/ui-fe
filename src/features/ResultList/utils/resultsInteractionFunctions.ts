import { getEdgeById, getNodeById, getPathById } from "@/features/ResultList/slices/resultsSlice";
import { Path, PathRank, Result, ResultEdge, ResultNode, ResultSet, PathFilterState, EdgeFilterState } from "@/features/ResultList/types/results.d";
import { isPath, isResultEdge } from "@/features/ResultList/types/checkers";
import { Filter, Filters } from "@/features/ResultFiltering/types/filters";
import { makePathRank, updatePathRanks, pathRankSort, makeEdgeRank, updateEdgeRank, getExcludingFilter } from "@/features/Core/utils/sortingFunctions";
import { getPathSequenceKey } from "@/features/Core/utils/resultHelpers";
import * as filtering from "@/features/ResultFiltering/utils/filterFunctions";
import cloneDeep from "lodash/cloneDeep";
import { SaveGroup } from "@/features/UserAuth/utils/userApi";
import { isNotesEmpty, getNodeDescription } from "@/features/ResultItem/utils/utilities";
import { FILTERING_CONSTANTS, makeFilter, applyPredicateFilterDisplayNames } from "@/features/ResultFiltering/utils/filterFunctions";
import { createDebugToggle } from "@/features/Core/utils/debugToggle";

export type StringMatchField =
  | 'drug_name'
  | 'subject_description'
  | 'node_name'
  | 'node_description'
  | 'node_curie'
  | 'edge_predicate';

export type StringMatchLocation = {
  field: StringMatchField;
  value: string;
  itemId?: string;
};

/**
 * Returns a match location when `value` contains the normalized (lowercased) term, otherwise null.
 */
const matchAt = (
  field: StringMatchField,
  value: string | null | undefined,
  term: string,
  itemId?: string,
): StringMatchLocation | null =>
  value?.toLowerCase().includes(term) ? { field, value, itemId } : null;

/**
 * Returns the fields on a path node or edge that contain the search term.
 * Pass `firstOnly` to stop at the first match when the caller only needs a yes/no.
 */
export const getItemStringMatchLocations = (
  item: ResultNode | ResultEdge,
  term: string,
  firstOnly = false,
): StringMatchLocation[] => {
  const locations: StringMatchLocation[] = [];
  if (!term) return locations;

  // Records a match; returns true once no further fields need checking.
  const record = (location: StringMatchLocation | null): boolean => {
    if (location) locations.push(location);
    return firstOnly && locations.length > 0;
  };

  if (isResultEdge(item)) {
    record(matchAt('edge_predicate', item.predicate, term, item.id));
    return locations;
  }

  if (record(matchAt('node_name', item.names?.[0], term, item.id))) return locations;
  if (record(matchAt('node_description', getNodeDescription(item), term, item.id))) return locations;
  for (const curie of item.curies ?? []) {
    if (record(matchAt('node_curie', curie, term, item.id))) break;
  }
  return locations;
};

const stringMatchDebug = createDebugToggle('__textSearchDebug');

/**
 * Turn text-search match console logging on or off. Defaults to off, since it logs
 * every matching field on every filter pass. Also exposed as `window.__textSearchDebug`;
 * re-apply a filter after enabling it to see output.
 */
export const setStringMatchLogging = stringMatchDebug.set;

/**
 * Logs the field and value where a text-search term matched, plus enough
 * result/path context to find it in the UI. No-ops unless logging is enabled.
 */
export const logStringMatch = (
  term: string,
  result: Result,
  location: StringMatchLocation,
  pathId?: string,
): void => {
  if (!stringMatchDebug.isEnabled()) return;
  console.log('[text search] match found', {
    term,
    field: location.field,
    value: location.value,
    result: result.drug_name,
    resultId: result.id,
    pathId,
    itemId: location.itemId,
  });
};

const logAndHasMatch = (
  term: string,
  result: Result,
  locations: StringMatchLocation[],
  pathId?: string,
): boolean => {
  for (const location of locations) {
    logStringMatch(term, result, location, pathId);
  }
  return locations.length > 0;
};

/**
 * Checks a result's drug name and subject node description for the normalized search term.
 */
const matchesShallowProperties = (resultSet: ResultSet, result: Result, normalizedTerm: string): boolean => {
  const subjectNode = getNodeById(resultSet, result.subject);
  const locations = [
    matchAt('drug_name', result.drug_name, normalizedTerm),
    matchAt('subject_description', subjectNode ? getNodeDescription(subjectNode) : null, normalizedTerm, subjectNode?.id),
  ].filter((location): location is StringMatchLocation => location !== null);

  return logAndHasMatch(normalizedTerm, result, locations);
};

/**
 * Re-ranks a result's paths against the path filters, then re-sorts its path ranks.
 */
const updateResultPathRanks = (
  resultSet: ResultSet,
  result: Result,
  pathRanks: Map<string, PathRank> | undefined,
  pathFilters: Filter[]
): void => {
  for (const p of result.paths) {
    const path = typeof p === "string" ? getPathById(resultSet, p) : p;
    const rank = path?.id && pathRanks?.get(path.id);
    if (path && rank) {
      updatePathRanks(resultSet, path, rank, pathFilters);
    }
  }
  pathRankSort([...pathRanks?.values() || []]);
};

/**
 * Performs a case-insensitive string match against a result's name, description, and all associated paths.
 *
 * This function checks the `Result` object for a match with the provided search term by:
 * - Comparing the term against the `drug_name` and the primary description of the subject node
 * - Traversing each of the result's paths
 * - Matching the term against node names, curies, descriptions, and edge predicates
 *
 * During traversal, the function also mutates the corresponding `PathRank` objects to influence relevance scoring:
 * - Decreases rank for each matching element on a path
 * - Sets an excluding rank when the term is an exclusion and the path matches
 *
 * @param resultSet - The full ResultSet containing all nodes, edges, and paths
 * @param result - The individual result to check for a string match
 * @param filter - The entity filter
 * @param pathRanks - Mutable ranking data structure, updated based on path relevance
 * @returns True if the search term is found in the result or any associated path; false otherwise
 */
export const findStringMatch = (
  resultSet: ResultSet,
  result: Result,
  filter: Filter,
  pathRanks: Map<string, PathRank>): boolean => {
  const normalizedTerm = filtering.normalizeSearchTermForMatch(filter.value || '');
  const isExclusion = filtering.isExclusion(filter);
  // Shallow properties: drug name and subject node description
  let matched = !normalizedTerm || matchesShallowProperties(resultSet, result, normalizedTerm);
  if (isExclusion && matched) return true;
  for (let i = 0; i < result.paths.length; i++) {
    const path = isPath(result.paths[i])
      ? result.paths[i]
      : getPathById(resultSet, result.paths[i] as string);

    if (!!path && typeof path !== 'string') {
      const pathRank = (path.id) ? pathRanks.get(path.id) : null;
      if (!!pathRank) {
        const subMatch = _checkPathForMatch(resultSet, path, pathRank, isExclusion);
        matched ||= subMatch;
      }
    }
  }
  return matched;

  function _checkItemForMatch(item?: ResultNode | ResultEdge, pathId?: string): boolean {
    if (!item) return false;
    // Only collect every matching field when someone is reading the logs.
    const firstOnly = !stringMatchDebug.isEnabled();
    return logAndHasMatch(normalizedTerm, result, getItemStringMatchLocations(item, normalizedTerm, firstOnly), pathId);
  }

  function _checkPathForMatch(
      resultSet: ResultSet,
      path: Path,
      pathRank: PathRank,
      isExclusion: boolean): boolean {
    // Look for matches on any node/edge of this path, accumulating rank
    // for every matching element (not just the first).
    for (let i = 0; i < path.subgraph.length; i++) {
      const item = isNodeIndex(i)
        ? getNodeById(resultSet, path.subgraph[i])
        : getEdgeById(resultSet, path.subgraph[i]);
      if (!_checkItemForMatch(item, path.id)) continue;

      if (isExclusion) {
        // rank this path heavily so it is filtered
        // out by the path filter state without excluding the whole result.
        pathRank.rank = FILTERING_CONSTANTS.WEIGHT.HEAVY;
        return false;
      }
      pathRank.rank += -1 * FILTERING_CONSTANTS.WEIGHT.LIGHT;
    }

    return (!isExclusion && pathRank.rank < 0);
  }
}

export const handleResultsError = (errorExists = true, setIsError: (value: boolean) => void, setIsLoading: (value: boolean) => void) => {
  setIsError(errorExists);
  setIsLoading(false);
}

/**
 * Applies all active filters (entity, result, facet, path) to the provided result set.
 * Separates results into included and excluded groups based on match criteria, then
 * re-evaluates available facet filters, path-based inclusion, and path rank states.
 *
 * @param {Filter[]} filters - The complete list of filters to apply.
 * @param {Result[]} filteredResults - The UI-visible list of results, possibly pre-filtered.
 * @param {Result[]} originalResults - The original, unfiltered list of results.
 * @param {ResultSet} summary - The complete context including path, node, and tag metadata.
 * @param {PathFilterState} pathFilterState - Current state of which paths are filtered out.
 * @returns {object} Filtering and facet metadata including final results, updated entity filters,
 * updated path filter state, grouped facet filters, and flags for UI reset logic.
 */
export const applyFilters = (
  filters: Filter[],
  filteredResults: Result[],
  originalResults: Result[],
  summary: ResultSet,
  pathFilterState: PathFilterState
): {
  results: Result[];
  updatedEntityFilters: string[];
  updatedPathFilterState: PathFilterState;
  updatedEdgeFilterState: EdgeFilterState;
  facetCounts: {
    resultFacets: Filter[];
    negatedResultFacets: Filter[];
    results: Result[];
    negatedResults: Result[];
  };
  unrankedIsFiltered: boolean;
  shouldResetPage: boolean;
} => {
  let [resultFilters, pathFilters, edgeFilters, globalFilters] = filtering.groupFilterByType(filters);
  const resultFacets = resultFilters.filter(f => !filtering.isExclusion(f));
  const negatedResultFacets = resultFilters.filter(f => filtering.isExclusion(f));
  resultFilters = negatedResultFacets.concat(globalFilters);

  if (filters.length === 0) {
    return {
      results: filteredResults,
      updatedEntityFilters: [],
      updatedPathFilterState: genPathFilterState(summary),
      updatedEdgeFilterState: {},
      facetCounts: {
        resultFacets: resultFacets,
        negatedResultFacets: negatedResultFacets,
        results: filteredResults,
        negatedResults: []
      },
      unrankedIsFiltered: false,
      shouldResetPage: false
    };
  }

  const resultPathRanks = new Map<string, Map<string, PathRank>>();
  let [results, negatedResults, updatedEntityFilters] = _filterResults(
    summary,
    resultFilters,
    originalResults,
    resultPathRanks
  );

  const resultsAfterFacets = _facetResults(summary, resultFacets, pathFilters, results, resultPathRanks);
  const unrankedIsFiltered = [...resultPathRanks.values()].some(rankMap =>
    [...rankMap.values()].some(rank => rank.rank < 0)
  );

  for (const pathRanks of resultPathRanks.values()) {
    _updatePathFilterState(pathFilterState, [...pathRanks.values()], unrankedIsFiltered);
  }

  _propagateExclusionAcrossCompressionGroups(summary, resultsAfterFacets, pathFilters, pathFilterState);

  const finalResults = _filterResultsByPathFilterState(resultsAfterFacets, pathFilterState);
  const updatedEdgeFilterState = _genEdgeFilterState(summary, finalResults, edgeFilters);

  return {
    results: finalResults,
    updatedEntityFilters,
    updatedEdgeFilterState,
    updatedPathFilterState: pathFilterState,
    facetCounts: {
      resultFacets,
      negatedResultFacets,
      results,
      negatedResults
    },
    unrankedIsFiltered,
    shouldResetPage: finalResults.length > 0
  };

  /**
   * Applies entity and result-level filters to the result set.
   * Separates matched and negated results based on exclusion logic, while constructing
   * per-result path rank maps for downstream facet filtering and path state updates.
   *
   * @param {ResultSet} resultSet - The full dataset used for path lookup and context.
   * @param {Filter[]} filters - The filters to apply (entity or result type).
   * @param {Result[]} originalResults - The unfiltered list of results to be evaluated.
   * @param {Map<string, Map<string, PathRank>>} resultPathRanks - Output container mapping result IDs to their computed path ranks.
   * @returns {[Result[], Result[], string[]]} A tuple containing:
   *  - the filtered results,
   *  - the negated (excluded) results,
   *  - the updated list of active entity filter values.
   */
  function _filterResults(
    resultSet: ResultSet,
    filters: Filter[],
    originalResults: Result[],
    resultPathRanks: Map<string, Map<string, PathRank>>
  ): [Result[], Result[], string[]] {
    const filtered: Result[] = [];
    const negated: Result[] = [];
    const newEntityFilters: string[] = [];

    for (const result of originalResults) {
      const pathRanks = new Map<string, PathRank>();
      for (const p of result.paths) {
        const path: Path | null = typeof p === "string" ? getPathById(resultSet, p) : p as Path;
        if (path?.id) {
          pathRanks.set(path.id, makePathRank(path));
        }
      }

      let include = true;
      for (const filter of filters) {
        if (
          filtering.isEntityFilter(filter) &&
          filtering.isExclusion(filter) === findStringMatch(resultSet, result, filter || "", pathRanks)
        ) {
          include = false;
          negated.push(result);
          break;
        }

        if (
          filtering.isResultFilter(filter) &&
          filtering.isExclusion(filter) === Object.keys(result.tags).some(tag => tag === filter.id)
        ) {
          include = false;
          negated.push(result);
          break;
        }
      }

      if (include) {
        filtered.push(result);
        resultPathRanks.set(result.id, pathRanks);
      }
    }

    for (const f of filters) {
      if (filtering.isEntityFilter(f) && typeof f.value === "string")
        newEntityFilters.push(f.value);
    }

    return [filtered, negated, newEntityFilters];
  };

  /**
   * Applies facet-based filters to an already filtered list of results.
   * Enforces AND logic between facet families and OR logic within each family.
   * Updates and sorts per-path ranks for each retained result.
   *
   * @param {ResultSet} resultSet - The full dataset used for path and tag metadata.
   * @param {Filter[]} resultFacets - The set of active facet filters to apply.
   * @param {Filter[]} pathFilters - Filters applied to individual paths (e.g., to update ranks).
   * @param {Result[]} filteredResults - The results that passed base filtering.
   * @param {Map<string, Map<string, PathRank>>} resultPathRanks - A map of result IDs to their path rank structures.
   * @returns {Result[]} A filtered list of results that satisfy the facet filtering logic.
   */
  function _facetResults(
    resultSet: ResultSet,
    resultFacets: Filter[],
    pathFilters: Filter[],
    filteredResults: Result[],
    resultPathRanks: Map<string, Map<string, PathRank>>
  ): Result[] {
    const facetsByFamily: Record<string, Filter[]> = {};
    for (const facet of resultFacets) {
      const family = filtering.getFilterFamily(facet);
      if (!facetsByFamily[family]) facetsByFamily[family] = [];
      facetsByFamily[family].push(facet);
    }

    const results: Result[] = [];

    for (const result of filteredResults) {
      const include = Object.values(facetsByFamily).every(filters =>
        filters.some(facet => facet.id && Object.prototype.hasOwnProperty.call(result.tags, facet.id))
      );

      if (!include) continue;

      updateResultPathRanks(resultSet, result, resultPathRanks.get(result.id), pathFilters);
      results.push(result);
    }

    return results;
  };

  /**
   * Removes results whose paths are fully excluded by the current path filter state.
   * A result is retained if at least one of its paths is not explicitly filtered out.
   *
   * @param {Result[]} results - The list of results to evaluate.
   * @param {PathFilterState} pathFilterState - A map of path IDs to boolean values indicating exclusion.
   * @returns {Result[]} The list of results that have at least one unfiltered path.
   */
  function _filterResultsByPathFilterState(
    results: Result[],
    pathFilterState: PathFilterState
  ): Result[] {
    return results.filter((result) =>
      result.paths.some((p) => {
        const pid = typeof p === "string" ? p : p.id;
        return pid && !pathFilterState[pid];
      })
    );
  }
}

/**
 * Ranks every edge reachable from the given results against the active edge
 * filters and returns a map of edge ID to filtered state.
 *
 * @param {ResultSet} resultSet - The full dataset used for path and edge lookup.
 * @param {Result[]} results - The results whose edges should be ranked.
 * @param {Filter[]} edgeFilters - The active edge ('e/...') filters.
 * @returns {EdgeFilterState} A map of edge IDs to whether that edge is filtered out.
 */
function _genEdgeFilterState(resultSet: ResultSet, results: Result[], edgeFilters: Filter[]): EdgeFilterState {
  const edgeFilterState: EdgeFilterState = {};
  if (edgeFilters.length === 0) return edgeFilterState;

  for (const result of results) {
    for (const p of result.paths) {
      const path = typeof p === "string" ? getPathById(resultSet, p) : p;
      if (!path) continue;
      for (const [i, elementID] of path.subgraph.entries()) {
        // An edge shared across paths only needs ranking once.
        if (isNodeIndex(i) || elementID in edgeFilterState) continue;
        const edge = getEdgeById(resultSet, elementID);
        if (!edge) continue;
        const edgeRank = makeEdgeRank(elementID);
        updateEdgeRank(edge, edgeFilters, edgeRank);
        edgeFilterState[elementID] = edgeRank.rank > 0;
      }
    }
  }

  return edgeFilterState;
}

/**
 * Injects dynamic filters into the result set based on the bookmark set.
 * This is used to display the bookmark and note tags on the result item.
 * @param {ResultSet} summary - The result set containing the full tag list.
 * @param {Result[]} formattedResults - The results that passed filtering and are currently shown.
 * @param {Result[]} originalResults - The original, unfiltered list of results.
 * @param {SaveGroup | null} bookmarkSet - The set of bookmark objects to search in.
 * @returns {[ResultSet, Result[], Result[]]} A tuple containing:
 *  - the modified result set,
 *  - the modified formatted results,
 *  - the modified original results.
 */
export const injectDynamicFilters = (
  summary: ResultSet,
  formattedResults: Result[],
  originalResults: Result[],
  bookmarkSet: SaveGroup | null): [ResultSet, Result[], Result[]] => {
  if (bookmarkSet === null || bookmarkSet.saves.size === 0) return [summary, formattedResults, originalResults];
  const tagsAdded = [];
  for (let i = 0; i < formattedResults.length; i++) {
    const save = bookmarkSet.saves.get(formattedResults[i].id);
    if (save) {
      tagsAdded.push({index: i, tag: FILTERING_CONSTANTS.DYNAMIC_TAG.BOOKMARK});
      if (!isNotesEmpty(save.notes)) {
        tagsAdded.push({index: i, tag: FILTERING_CONSTANTS.DYNAMIC_TAG.NOTE});
      }
    }
  }
  if (tagsAdded.length === 0) return [summary, formattedResults, originalResults];
  const modifiedSummary = cloneDeep(summary);
  const modifiedFormattedResults = cloneDeep(formattedResults);
  const modifiedOriginalResults = cloneDeep(originalResults);
  for (const tagEntry of tagsAdded) {
    const tag = tagEntry.tag;
    const ridx = tagEntry.index;
    modifiedSummary.data.tags[tag.id] = tag.description;
    modifiedFormattedResults[ridx].tags[tag.id] = tag;
    modifiedOriginalResults[ridx].tags[tag.id] = tag;
  }
  return [modifiedSummary, modifiedFormattedResults, modifiedOriginalResults];
}

/**
 * Generates the initial path filter state object using all paths from the result set.
 * Each path is initialized to `false`, indicating it is not filtered.
 * @param {ResultSet} summary - The result set containing all available paths.
 * @returns {{[key: string]: boolean}} An object mapping path IDs to a boolean filter state.
 */
export const genPathFilterState = (summary: ResultSet): {[key: string]: boolean} => {
  const filterState: {[key: string]: boolean} = {};
  for (let pid of Object.keys(summary.data.paths)) {
    filterState[pid] = false;
  }
  return filterState;
}

/**
 * Calculates how many times each tag appears in the filtered and negated results.
 * Uses active and negated facet filters to conditionally count tags by facet family.
 * Updates the UI-facing tag list via the provided setter method.
 * @param {Result[]} filteredResults - The results that passed filtering and are currently shown.
 * @param {ResultSet} summary - The result set containing the full tag list.
 * @param {Result[]} negatedResults - Results excluded due to filtering, used to count negated tags.
 * @param {Filter[]} activeFacets - Facet filters currently applied to the results.
 * @param {Filter[]} negatedFacets - Facet filters used for exclusion logic.
 */
export const calculateFacetCounts = (
  filteredResults: Result[],
  summary: ResultSet,
  negatedResults: Result[],
  activeFacets: Filter[],
  negatedFacets: Filter[]
): Filters => {
  // Create a list of tags from the master tag list provided by the backend
  const countedTags = cloneDeep(summary.data.tags) as Filters;
  applyPredicateFilterDisplayNames(countedTags);
  const activeFamilies = new Set(activeFacets.map(facet => filtering.getFilterFamily(facet)));
  for(const result of filteredResults) {
    // Determine the distance between a result's facets and the facet selection
    const resultFamilies = new Set();
    for (const facet of activeFacets) {
      if (!!facet.id && result.tags[facet.id] !== undefined) {
        resultFamilies.add(filtering.getFilterFamily(facet));
      }
    }

    const missingFamiliesCount = activeFamilies.size - resultFamilies.size;
    // When the family counts are equal, add all the result's tags
    if (missingFamiliesCount === 0) {
      _addTagCountsWhen(countedTags, result, () => { return true; });
    // When the result is missing a single family, add all tags from only the missing family
    } else if (missingFamiliesCount === 1) {
      // Find the missing family
      const missingFamily = [...activeFamilies].filter((family) => {
        return !resultFamilies.has(family);
      })[0];
      _addTagCountsWhen(countedTags, result, (tagID: string) => {
        return filtering.getTagFamily(tagID) === missingFamily;
      });
    }
    // Otherwise skip this result
  }

  // Count all results that have a matching negated facet
  for (const result of negatedResults) {
    _addTagCountsWhen(countedTags, result, (tagID) => {
      return negatedFacets.reduce((acc, facet) => {
        return (tagID === facet.id) || acc;
      }, false);
    });
  }

  Object.entries(countedTags).forEach((tag)=> {
    if(tag[1].count === undefined || tag[1].count <= 0) {
      delete countedTags[tag[0]];
    }
  })

  return countedTags;

  // Function that adds the tag counts when a certain condition (predicate) is met
  function _addTagCountsWhen(
      countedTags: {[key: string]: Filter},
      result: Result,
      predicate: (tag: string) => boolean) {
    for(const tag of Object.keys(result.tags)) {
      // If the tag exists on the list, either increment it or initialize its count
      if (predicate(tag)) {
        if (!countedTags[tag].count) {
          countedTags[tag] = makeFilter(countedTags[tag].name, FILTERING_CONSTANTS.WEIGHT.LIGHT,
            FILTERING_CONSTANTS.WEIGHT.HEAVY);
        } else {
          countedTags[tag].count += 1;
        }
      }
    }
  }
}

/**
 * Updates the path filter state based on the rank of each path.
 * A path is filtered out if it ranked positively, or if it went unranked (rank 0)
 * while some other path in the set did match.
 * @param {{[key: string]: boolean}} pathFilterState - The current map of path IDs to their filtered state.
 * @param {PathRank[]} pathRanks - The ranked paths to evaluate and update in the state.
 * @param {boolean} unrankedIsFiltered - Whether paths with rank 0 should be considered filtered.
 */
function _updatePathFilterState(pathFilterState: {[key: string]: boolean},
                                pathRanks: PathRank[],
                                unrankedIsFiltered: boolean) {
  for (let pathRank of pathRanks) {
    const pid = pathRank.path.id;
    if (!pid) continue;
    pathFilterState[pid] = pathRank.rank > 0 || (pathRank.rank === 0 && unrankedIsFiltered);
  }
}

/**
 * Scaffolding for strict-mode compression-group exclusion propagation.
 *
 * Currently a no-op: propagatesExclusionAcrossCompressionGroups returns false for
 * all path filters, so negatedPathFilters is always empty. Per-member exclusion
 * is handled solely by updatePathRanks.
 *
 * When strict mode is re-enabled in propagatesExclusionAcrossCompressionGroups,
 * matching negated filters will spread filtered state to every member of a
 * compression group (same node sequence). ARA inclusion exemption is preserved
 * via getExcludingFilter.
 */
function _propagateExclusionAcrossCompressionGroups(
  resultSet: ResultSet,
  results: Result[],
  pathFilters: Filter[],
  pathFilterState: PathFilterState
): void {
  const negatedPathFilters = pathFilters.filter(
    (ftr) =>
      filtering.isExclusion(ftr) &&
      filtering.propagatesExclusionAcrossCompressionGroups(ftr)
  );
  if (negatedPathFilters.length === 0) return;

  const hasAraInclusion = pathFilters.some(
    (ftr) =>
      !ftr.negated &&
      filtering.getFilterFamily(ftr) === FILTERING_CONSTANTS.FAMILIES.ARA
  );

  for (const result of results) {
    const groups = new Map<string, Path[]>();
    for (const p of result.paths) {
      const path = typeof p === "string" ? getPathById(resultSet, p) : p;
      if (!path?.id) continue;
      const key = getPathSequenceKey(resultSet, path);
      if (!key) continue;
      const group = groups.get(key);
      if (group) group.push(path);
      else groups.set(key, [path]);
    }

    for (const members of groups.values()) {
      if (members.length <= 1) continue;
      const anyExcluded = members.some((path) =>
        getExcludingFilter(path, negatedPathFilters, hasAraInclusion) !== null
      );
      if (anyExcluded) {
        for (const path of members) {
          if (path.id) pathFilterState[path.id] = true;
        }
      }
    }
  }
}

export const areEntityFiltersEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((val) => setA.has(val));
};

/**
 * Checks if the given index is for a node in a path.
 * Nodes are represented by even indices, while edges are represented by odd indices.
 *
 * @param {number} index - The index to check.
 * @returns {boolean} Returns true if the index is for a node, otherwise returns false.
 */
export const isNodeIndex = (index: number): boolean => {
  return index % 2 === 0;
}
