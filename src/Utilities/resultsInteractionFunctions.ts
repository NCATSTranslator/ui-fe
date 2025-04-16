import { Dispatch, MutableRefObject, SetStateAction } from "react";
import { getEdgeById, getNodeById, getPathById } from "../Redux/resultsSlice";
import { isPath, isResultEdge, Path, PathRank, Result, ResultEdge, ResultNode, ResultSet, Filter, PathFilterState } from "../Types/results.d";
import { hasSupport } from "./utilities";
import { AutocompleteItem } from "../Types/querySubmission";
import { makePathRank, updatePathRanks, pathRankSort } from "./sortingFunctions";
import * as filtering from "./filterFunctions";
import { cloneDeep } from "lodash";

/**
 * Finds a string match in the given element by comparing the value with the element's name, description,
 * and compressed paths. Updates the path ranks for more efficient searching.
 * @param {object} element - The element to search for a string match.
 * @param {string} value - The value to match against the element's properties.
 * @param {array} pathRanks - The ranks of the compressed paths for more efficient searching.
 * @returns {boolean} True if a match is found, false otherwise.
*/
export const findStringMatch = (resultSet: ResultSet, result: Result, searchTerm: string, pathRanks: PathRank[]) => {
  const checkItemForMatch = (item: ResultNode | ResultEdge, searchTerm: string) => {
    if(isResultEdge(item)) {
      return (item?.predicate && item.predicate.toLowerCase().includes(searchTerm));
    } else {
      return (
        !!item.names.find(name => name.toLowerCase().includes(searchTerm)) 
        || !!item.curies.find(curie => curie.toLowerCase().includes(searchTerm))
        || !!item.descriptions.find(description => description.toLowerCase().includes(searchTerm))
      );
    }
  }

  const checkPathForMatch = (resultSet: ResultSet, path: Path, searchTerm: string, pathRank: PathRank): boolean => {
    let foundMatch = false;
    for (let i = 0; i < path.subgraph.length; i++) {
      let item = i % 2 === 0 ? getNodeById(resultSet, path.subgraph[i]): getEdgeById(resultSet, path.subgraph[i]);
      if (isResultEdge(item) && hasSupport(item)) {
        for (let i = 0; i < item.support.length; i++) {
          const supportPath = (isPath(item.support[i])) ? item.support[i] : getPathById(resultSet, item.support[i] as string);
          const supportRank = pathRank.support[i];
          const supportMatch = !!supportPath && typeof supportPath !== "string" && checkPathForMatch(resultSet, supportPath, searchTerm, supportRank);
          foundMatch = supportMatch || foundMatch;
          if (supportMatch) {
            pathRank.rank += supportRank.rank;
          }
        }
      }

      if (!!item && checkItemForMatch(item, searchTerm)) {
        // Its confusing to update the pathRanks here, but it is more efficient
        pathRank.rank -= 1;
        foundMatch = true;
      }
    }

    return foundMatch;
  }

  searchTerm = searchTerm.toLowerCase();
  let resultSubjectNode = getNodeById(resultSet, result.subject);
  let description = resultSubjectNode?.descriptions[0] ? resultSubjectNode.descriptions[0] : "";
  let name = result.drug_name;
  let foundMatch = !searchTerm ||
                   !result ||
                   name.toLowerCase().includes(searchTerm) ||
                   (description.toLowerCase().includes(searchTerm));
  for (let i = 0; i < result.paths.length; i++) {
    const path = (isPath(result.paths[i])) ? result.paths[i] : getPathById(resultSet, result.paths[i] as string);
    const pathRank = pathRanks[i];
    foundMatch = (!!path && typeof path !== "string" && checkPathForMatch(resultSet, path, searchTerm, pathRank)) || foundMatch;
  }

  return !!foundMatch;
}

export const handleResultsError = (errorExists = true, setIsError: (value: boolean) => void, setIsLoading: (value: boolean) => void) => {
  setIsError(errorExists);
  setIsLoading(false);
}

export const handleEvidenceModalClose = (setEvidenceOpen: (value: boolean) => void) => {
  setEvidenceOpen(false);
}

export const handleResultsRefresh = (
    freshRawResults: ResultSet | null,
    handleNewResults: (resultSet: ResultSet) => void,
    setFreshRawResults: Dispatch<SetStateAction<ResultSet | null>>
  ) => {
  // Update rawResults with the fresh data
  if(!!freshRawResults)
  handleNewResults(freshRawResults);

  // Set freshRawResults back to null
  setFreshRawResults(null)
}

export const getResultsShareURLPath = (label: string, nodeID: string | number, typeID: string | number, resultID: string | number, pk: string | number) => {
  return `results?l=${label}&i=${nodeID}&t=${typeID}&r=${resultID}&q=${pk}`;
}

export const getPathfinderResultsShareURLPath = (itemOne: AutocompleteItem, itemTwo: AutocompleteItem, resultID: string, constraint: string | undefined, pk: string) => {
  let labelOne = (itemOne.label) ? itemOne.label : null;
  let labelTwo = (itemTwo.label) ? itemTwo.label : null;
  let idOne = (itemOne.id) ? itemOne.id : null;
  let idTwo = (itemTwo.id) ? itemTwo.id : null;
  let constraintVar = !!constraint ?  `&c=${constraint}`: '';
  return `results?lone=${labelOne}&ltwo=${labelTwo}&ione=${idOne}&itwo=${idTwo}&t=p${constraintVar}&r=${resultID}&q=${pk}`;
}

/**
 * Applies all active filters to the result set, including entity, result, facet, and path filters.
 * Updates entity filters, path filter state, facet counts, and pagination state as needed.
 * @param {Filter[]} filters - The array of active filters to apply.
 * @param {string[]} entityFilters - The currently active entity filter strings.
 * @param {Result[]} filteredResults - The current set of filtered results for the UI.
 * @param {Result[]} originalResults - The full, unfiltered list of results.
 * @param {ResultSet} summary - The context object containing all results and paths.
 * @param {PathFilterState} pathFilterState - A map of path IDs to their filtered state.
 * @returns {[Result[], PathFilterState]} The updated filtered results and updated path filter state.
 */
export const applyFilters = (filters: Filter[], entityFilters: string[], filteredResults: Result[], originalResults: Result[],
  summary: ResultSet, pathFilterState: PathFilterState, setActiveEntityFilters: Dispatch<SetStateAction<string[]>>,
  setAvailableFilters: Dispatch<SetStateAction<{[key: string]: Filter;}>>, handlePageReset: (newItemsPerPage: number | false, resultsLength: number) => void,
  currentPage: MutableRefObject<number>): [Result[], PathFilterState] => {
  
  /**
   * Filters the full result list using entity and result filters, handling exclusion logic.
   * Updates active entity filters and calculates path ranks for matched results.
   * @param {ResultSet} resultSet - The dataset containing all paths and result metadata.
   * @param {Filter[]} filters - The entity and result filters to apply.
   * @param {string[]} entityFilters - The currently applied entity filters.
   * @param {Result[]} originalResults - The original, unfiltered result list.
   * @param {PathRank[][]} resultPathRanks - The output container for computed path ranks per result.
   * @returns {[Result[], Result[]]} The filtered results and the excluded (negated) results.
  */
  const filterResults = (resultSet: ResultSet, filters: Filter[], entityFilters: string[], originalResults: Result[], resultPathRanks: PathRank[][], setActiveEntityFilters: Dispatch<SetStateAction<string[]>>) => {
    const filteredResults = [];
    const negatedResults = [];
    /*
      For each result, check against each filter. If any filter is not met,
      skip that result.
    */
    for (let result of originalResults) {
      const pathRanks: PathRank[] = resultSet 
        ? result.paths.map((p) => typeof p === "string" ? getPathById(resultSet, p) : p)
          .filter((path): path is Path => path !== undefined)
          .map((path) => makePathRank(resultSet, path))
        : [];
      let addResult = true;
      for (const filter of filters) {
        if(filtering.isEntityFilter(filter))
        if (filtering.isEntityFilter(filter) &&
            filtering.isExclusion(filter) === findStringMatch(resultSet, result, filter.value || "", pathRanks)) {
          addResult = false;
          negatedResults.push(result);
          break;
        }

        if (filtering.isResultFilter(filter) &&
            filtering.isExclusion(filter) === Object.values(result.tags).includes((tag: Filter) => tag.id === filter.id)) {
          addResult = false;
          negatedResults.push(result);
          break;
        }
      }

      if (addResult) {
        filteredResults.push(result);
        resultPathRanks.push(pathRanks);
      }
    }

    const newEntityFilters = [];
    for (const filter of filters) {
      // String filters with identical values shouldn't be added to the activeFilters array,
      // so we don't have to check for duplicate values here, just for the str tag.
      if (filtering.isEntityFilter(filter) && !!filter.value) {
        newEntityFilters.push(filter.value);
      }
    }

    // if the new set of filters don't match the current ones, call setActiveEntityFilters to update them
    if (!(newEntityFilters.length === entityFilters.length &&
          newEntityFilters.every((value, index) => value === entityFilters[index]))) {
      setActiveEntityFilters(newEntityFilters);
    }

    // Set the formatted results to the newly filtered results
    return [filteredResults, negatedResults];
  }

  /**
   * Filters results using facet filters, applying AND logic between facet families and OR logic within them.
   * Updates path ranks for each retained result and sorts them accordingly.
   * @param {Filter[]} resultFacets - The list of active, non-exclusion facet filters.
   * @param {Filter[]} pathFilters - The list of filters to apply to individual paths for scoring.
   * @param {Result[]} filteredResults - The results that passed base-level filtering.
   * @param {PathRank[][]} resultPathRanks - The path ranks for each result, to be updated and sorted.
   * @returns {Result[]} The results that passed facet filtering and had their path ranks updated.
   */
  const facetResults = (resultSet: ResultSet, resultFacets: Filter[], pathFilters: Filter[], filteredResults: Result[], resultPathRanks: PathRank[][]) => {
    const intersect = (a: any, b: any) => { return a && b; };
    const union = (a: any, b: any) => { return a || b; };
    const facetedResults = [];
    let resultIndex = 0;
    for (const result of filteredResults) {
      let addResult = true;
      let isInter = null;
      let combine = null;
      let lastFacet = null;
      for (const resFacet of resultFacets) {
        isInter = (!filtering.hasSameFamily(lastFacet, resFacet));
        if (isInter) {
          if (!addResult) break; // We went through an entire facet group with no match
          lastFacet = resFacet;
          combine = intersect;
        } else {
          combine = union;
        }

        addResult = combine(addResult, !!resFacet.id && Object.keys(result.tags).includes(resFacet.id));
      }

      if (addResult) {
        const pathRanks = resultPathRanks[resultIndex];
        for (let i = 0; i < result.paths.length; i++) {
          const path = (typeof result.paths[i] === 'string') ? getPathById(resultSet, result.paths[i] as string) : result.paths[i];
          const pathRank = pathRanks[i];
          if(!!resultSet && !!path)
            updatePathRanks(resultSet, path as Path, pathRank, pathFilters);
        }
        pathRankSort(pathRanks);
        facetedResults.push(result);
      }

      resultIndex++;
    };

    return facetedResults;
  }

  /**
   * Filters out results whose paths are entirely excluded based on the path filter state.
   * Retains results if at least one of their paths is not marked as filtered.
   * @param {Result[]} results - The list of results to evaluate against path filters.
   * @param {PathFilterState} pathFilterState - A map of path IDs to boolean values indicating exclusion.
   * @returns {Result[]} The filtered results after applying path-based exclusion rules.
  */
  const filterResultsByPathFilterState = (results: Result[], pathFilterState: PathFilterState) => {
    let anyFilteredPaths = false;
    for (const filterState of Object.values(pathFilterState)) {
      anyFilteredPaths = anyFilteredPaths || filterState;
    }

    if (!anyFilteredPaths) return results;
    const filteredResults = [];
    for (const result of results) {
      let filterResult = true;
      for (const path of result.paths) {
        const pathID = (typeof path === "string") ? path : path.id;
        filterResult = filterResult && !!pathID && pathFilterState[pathID];
      }

      if (!filterResult) {
        filteredResults.push(result);
      }
    }

    return filteredResults;
  }

  // If there are no active filters or facets, get the full result set and reset the activeEntityFilters
  if (filters.length === 0) {
    if (entityFilters.length > 0) {
      setActiveEntityFilters([]);
    }

    pathFilterState = genPathFilterState(summary);
    calculateFacetCounts(filteredResults, summary, [], [], [], setAvailableFilters);
    return [filteredResults, pathFilterState];
  }

  let [resultFilters, pathFilters, globalFilters] = filtering.groupFilterByType(filters);
  const resultFacets = resultFilters.filter((f) => !filtering.isExclusion(f));
  const negatedResultFacets = resultFilters.filter((f) => filtering.isExclusion(f));
  resultFilters = negatedResultFacets.concat(globalFilters);
  const resultPathRanks: PathRank[][] = [];
  let [results, negatedResults] = filterResults(summary, resultFilters, entityFilters, originalResults, resultPathRanks, setActiveEntityFilters);
  calculateFacetCounts(results, summary, negatedResults, resultFacets, negatedResultFacets, setAvailableFilters);
  results = facetResults(summary, resultFacets, pathFilters, results, resultPathRanks);
  let unrankedIsFiltered = false;
  for (let pathRanks of resultPathRanks) {
    for (let pathRank of pathRanks) {
      unrankedIsFiltered = unrankedIsFiltered || (pathRank.rank < 0);
    }
  }

  for (let pathRanks of resultPathRanks) {
    updatePathFilterState(pathFilterState, pathRanks, unrankedIsFiltered);
  }

  results = filterResultsByPathFilterState(results, pathFilterState);
  if(currentPage.current !== 0) {
    handlePageReset(false, results.length);
  }

  return [results, pathFilterState];
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
 * @param {Function} filterSetterMethod - The method used to update the available tag list.
 */
const calculateFacetCounts = (filteredResults: Result[], summary: ResultSet, negatedResults: Result[], activeFacets: Filter[], negatedFacets: Filter[], filterSetterMethod: Function) => {
  // Function that adds the tag counts when a certain condition (predicate) is met
  const addTagCountsWhen = (countedTags: {[key: string]: Filter}, result: Result, predicate: (tag: string)=>boolean) => {
    for(const tag of Object.keys(result.tags)) {
      // If the tag exists on the list, either increment it or initialize its count
      if (predicate(tag)) {
        if (countedTags.hasOwnProperty(tag)) {
          countedTags[tag].count = (countedTags[tag].count ?? 0) + 1;
        } else {
          // If it doesn't exist on the current list of tags, add it and initialize its count
          countedTags[tag] = { name: tag, value: '', count: 1 };
        }
      }
    }
  }

  // Create a list of tags from the master tag list provided by the backend
  const countedTags = cloneDeep(summary.data.tags);
  const activeFamilies = new Set(activeFacets.map(facet => filtering.filterFamily(facet)));
  for(const result of filteredResults) {
    // Determine the distance between a result's facets and the facet selection
    const resultFamilies = new Set();
    for (const facet of activeFacets) {
      if (!!facet.id && Object.keys(result.tags).includes(facet.id)) {
        resultFamilies.add(filtering.filterFamily(facet));
      }
    }

    const missingFamiliesCount = activeFamilies.size - resultFamilies.size;
    // When the family counts are equal, add all the result's tags
    if (missingFamiliesCount === 0) {
      addTagCountsWhen(countedTags, result, (tag) => { return true; });
    // When the result is missing a single family, add all tags from only the missing family
    } else if (missingFamiliesCount === 1) {
      // Find the missing family
      const missingFamily = [...activeFamilies].filter((family) => {
        return !resultFamilies.has(family);
      })[0];

      addTagCountsWhen(countedTags, result, (tagID) => {
        return filtering.getTagFamily(tagID) === missingFamily;
      });
    }
    // Otherwise skip this result
  }

  // Count all results that have a matching negated facet
  for (const result of negatedResults) {
    addTagCountsWhen(countedTags, result, (tagID) => {
      return negatedFacets.reduce((acc, facet) => {
        return (tagID === facet.id) || acc;
      }, false);
    });
  }

  Object.entries(countedTags).forEach((tag)=> {
    if(tag[1].count === undefined || tag[1].count <= 0)
      delete countedTags[tag[0]];
  })

  filterSetterMethod(countedTags);
}

/**
 * Updates the path filter state based on the rank and support relationships of each path.
 * Recursively traverses supported paths and marks a path as filtered if all of its supports are filtered.
 * A path is included if it is ranked positively or meets the fallback condition for unranked paths.
 * @param {{[key: string]: boolean}} pathFilterState - The current map of path IDs to their filtered state.
 * @param {PathRank[]} pathRanks - The ranked paths to evaluate and update in the state.
 * @param {boolean} unrankedIsFiltered - Whether paths with rank 0 should be considered filtered.
 */
const updatePathFilterState = (pathFilterState: {[key: string]: boolean}, pathRanks: PathRank[], unrankedIsFiltered: boolean) => {
  for (let pathRank of pathRanks) {
    const pid = pathRank.path.id;
    if(!pid)
      continue;

    if (pathRank.support.length !== 0) {
      updatePathFilterState(pathFilterState, pathRank.support, unrankedIsFiltered);
      let filterIndirect = true;
      for (let supportRank of pathRank.support) {
        const supportPid = supportRank.path.id;
        if(!!supportPid)
          filterIndirect = filterIndirect && pathFilterState[supportPid];
      }
      pathFilterState[pid] = filterIndirect;
    } else {
      pathFilterState[pid] = (pathRank.rank > 0 || (pathRank.rank === 0 && unrankedIsFiltered));
    }
  }
}