import { getEdgeById, getNodeById, getPathById } from "@/features/ResultList/slices/resultsSlice";
import { Path, PathRank, Result, ResultEdge, ResultNode, ResultSet, PathFilterState, EdgeFilterState } from "@/features/ResultList/types/results.d";
import { isPath, isResultEdge } from "@/features/ResultList/types/checkers";
import { Filter, Filters } from "@/features/ResultFiltering/types/filters";
import { makePathRank, updatePathRanks, pathRankSort, makeEdgeRank, updateEdgeRank } from "@/features/Core/utils/sortingFunctions";
import * as filtering from "@/features/ResultFiltering/utils/filterFunctions";
import cloneDeep from "lodash/cloneDeep";
import { SaveGroup } from "@/features/UserAuth/utils/userApi";
import { isNotesEmpty, getNodeDescription } from "@/features/ResultItem/utils/utilities";
import { FILTERING_CONSTANTS, makeFilter } from "@/features/ResultFiltering/utils/filterFunctions";

/**
 * Performs a case-insensitive string match against a result's name, description, and all associated paths.
 *
 * This function checks the `Result` object for a match with the provided search term by:
 * - Comparing the term against the `drug_name` and the primary description of the subject node
 * - Recursively traversing all paths and their support subpaths
 * - Matching the term against node names, curies, descriptions, and edge predicates
 *
 * During traversal, the function also mutates the corresponding `PathRank` objects to influence relevance scoring:
 * - Decreases rank when a direct match is found
 * - Increases rank when a supporting subpath contains a match
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
  const nameMatch = result.drug_name?.toLowerCase().includes(normalizedTerm) ?? false;
  const subjectNode = getNodeById(resultSet, result.subject);
  const descriptionMatch = (subjectNode ? getNodeDescription(subjectNode) : null)
    ?.toLowerCase().includes(normalizedTerm) ?? false;
  let matched = !normalizedTerm || nameMatch || descriptionMatch;
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

  function _checkItemForMatch(item?: ResultNode | ResultEdge): boolean {
    if (!item) return false;

    if (isResultEdge(item)) {
      return !!item.predicate?.toLowerCase().includes(normalizedTerm);
    }

    return (item.names &&
        item.names.length > 0 &&
        item.names[0].toLowerCase().includes(normalizedTerm)) ||
      (getNodeDescription(item)?.toLowerCase().includes(normalizedTerm) ?? false) ||
      item.curies && item.curies.length > 0 && item.curies.some(curie => curie.toLowerCase().includes(normalizedTerm));
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
      if (!_checkItemForMatch(item)) continue;

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

      const pathRanks = resultPathRanks.get(result.id);
      for (const p of result.paths) {
        const path = typeof p === "string" ? getPathById(resultSet, p) : p;
        const rank = path?.id && pathRanks?.get(path.id);
        if (path && rank) {
          updatePathRanks(resultSet, path, rank, pathFilters);
        }
      }

      pathRankSort([...pathRanks?.values() || []]);
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
    modifiedSummary.data.tags[tag.id] = {name: tag.name, value: tag.value};
    modifiedFormattedResults[ridx].tags[tag.id] = null;
    modifiedOriginalResults[ridx].tags[tag.id] = null;
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
