import { hasSupport } from "./resultsFormattingFunctions";

/**
 * Finds a string match in the given element by comparing the value with the element's name, description,
 * and compressed paths. Updates the path ranks for more efficient searching.
 * @param {object} element - The element to search for a string match.
 * @param {string} value - The value to match against the element's properties.
 * @param {array} pathRanks - The ranks of the compressed paths for more efficient searching.
 * @returns {boolean} True if a match is found, false otherwise.
*/
export const findStringMatch = (result, searchTerm, pathRanks) => {
  const checkItemForMatch = (item, searchTerm) => {
    return (
      (item.name && item.name.toLowerCase().includes(searchTerm)) ||
      (item.predicates && item.predicates[0]?.predicate && item.predicates[0].predicate.toLowerCase().includes(searchTerm))
    );
  }

  const checkPathForMatch = (path, searchTerm, pathRank) => {
    let foundMatch = false;
    for (const item of path.path.subgraph) {
      if (hasSupport(item)) {
        for (let i = 0; i < item.support.length; i++) {
          const supportPath = item.support[i];
          const supportRank = pathRank.support[i];
          const supportMatch = checkPathForMatch(supportPath, searchTerm, supportRank);
          foundMatch = supportMatch || foundMatch;
          if (supportMatch) {
            pathRank.rank += supportRank.rank;
          }
        }
      }

      if (checkItemForMatch(item, searchTerm)) {
        // Its confusing to update the pathRanks here, but it is more efficient
        pathRank.rank -= 1;
        foundMatch = true;
      }
    }

    return foundMatch;
  }

  searchTerm = searchTerm.toLowerCase();
  let foundMatch = !searchTerm ||
                   !result ||
                   result.name.toLowerCase().includes(searchTerm) ||
                   (result.description && result.description.toLowerCase().includes(searchTerm));
  for (let i = 0; i < result.compressedPaths.length; i++) {
    const path = result.compressedPaths[i];
    const pathRank = pathRanks[i];
    foundMatch = checkPathForMatch(path, searchTerm, pathRank) || foundMatch;
  }

  return !!foundMatch;
}

/**
 * Removes the highlights from the specified elements if the highlightedName or highlightedDescription
 * contains the given value (case-insensitive match).
 * @param {Array} elements - The elements to remove the highlights from.
 * @param {string} value - The value to match against the highlightedName and highlightedDescription.
 * @returns {Array} The updated elements with removed highlights.
*/
export const removeHighlights = (elements, value) => {
  for(const element of elements) {
    if(element.highlightedName && element.highlightedName.toLowerCase().includes(value.toLowerCase().trim())) {
      element.highlightedName = null;
    }
    if(element.highlightedDescription && element.highlightedDescription.toLowerCase().includes(value.toLowerCase().trim())) {
      element.highlightedDescription = null;
    }
  }
  return elements;
}

export const handleResultsError = (errorExists = true, setIsError, setIsLoading) => {
  setIsError(errorExists);
  setIsLoading(false);
}

export const handleEvidenceModalClose = (setEvidenceOpen) => {
  setEvidenceOpen(false);
}

export const handleResultsRefresh = (freshRawResults, handleNewResults, setFreshRawResults) => {
  // Update rawResults with the fresh data
  handleNewResults(freshRawResults);
  // Set freshRawResults back to null
  setFreshRawResults(null)
}

export const handleClearAllFilters = (asFilters, rResults, oResults, setActiveFilters, currentSortString, handleUpdateResults) => {
  setActiveFilters([]);
  handleUpdateResults([], asFilters, rResults, oResults, false, currentSortString);
}

export const getResultsShareURLPath = (label, nodeID, typeID, resultID, pk) => {
  return `results?l=${label}&i=${nodeID}&t=${typeID}&r=${resultID}&q=${pk}`;
}
