
/**
 * Finds a string match in the given element by comparing the value with the element's name, description,
 * and compressed paths. Updates the path ranks for more efficient searching.
 * @param {object} element - The element to search for a string match.
 * @param {string} value - The value to match against the element's properties.
 * @param {array} pathRanks - The ranks of the compressed paths for more efficient searching.
 * @returns {boolean} True if a match is found, false otherwise.
*/
export const findStringMatch = (element, value, pathRanks) => {
  const formattedValue = value.toLowerCase();
  let foundMatch = !value ||
    !element ||
    element.name.toLowerCase().includes(formattedValue) ||
    (element.description && element.description.toLowerCase().includes(formattedValue));
  for (let i = 0; i < element.compressedPaths.length; ++i) {
    const path = element.compressedPaths[i];
    for (let item of path.path.subgraph) {
      if ((item.name && item.name.toLowerCase().includes(formattedValue)) ||
          (item.predicates && item.predicates[0].toLowerCase().includes(formattedValue))) {
        // Its confusing to update the pathRanks here, but it is more efficient
        pathRanks[i].rank -= 1;
        foundMatch = true;
        break;
      }
    }
  }

  return foundMatch;
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

export const getResultsShareURLPath = (label, nodeID, typeID, pk) => {
  return `results?l=${label}&i=${nodeID}&t=${typeID}&q=${pk}`;
}