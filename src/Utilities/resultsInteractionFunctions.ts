import { Dispatch, SetStateAction } from "react";
import { getEdgeById, getNodeById, getPathById } from "../Redux/resultsSlice";
import { isPath, isResultEdge, Path, PathRank, Result, ResultEdge, ResultNode, ResultSet } from "../Types/results.d";
import { hasSupport } from "./utilities";
import { AutocompleteItem } from "../Types/querySubmission";

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
