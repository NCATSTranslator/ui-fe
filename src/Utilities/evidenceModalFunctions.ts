import { Dispatch, SetStateAction } from 'react';
import { sortNameHighLow, sortNameLowHigh, sortJournalHighLow, sortJournalLowHigh,
  sortDateYearHighLow, sortDateYearLowHigh } from './sortingFunctions';
import { cloneDeep } from 'lodash';
import { capitalizeAllWords, getPathsWithSelectionsSet, hasSupport, intToChar, intToNumeral } from "./utilities";
import { EvidenceSortState, PublicationObject, RawPublicationList, TrialObject } from '../Types/evidence';
import { Path, PathFilterState, ResultEdge, ResultSet } from '../Types/results';
import { getEdgeById, getPubById, getTrialById } from '../Redux/resultsSlice';

/**
 * Sorts PubMed evidence based on the specified sorting criteria and updates the state.
 *
 * @param {string} sortName - The sorting criteria (e.g., "titleLowHigh", "dateHighLow").
 * @param {PublicationObject[]} pubmedEvidence - The current list of publication objects.
 * @param {(event: any) => void} handlePageClick - Function to reset pagination to page one.
 * @param {Dispatch<SetStateAction<EvidenceSortState>>} sortingStateSetter - State setter for the sorting state.
 * @param {Dispatch<SetStateAction<PublicationObject[]>>} setPubmedEvidence - State setter for the sorted publication objects.
 *
 */
export const handleEvidenceSort = (
  sortName: string,
  pubmedEvidence: PublicationObject[],
  handlePageClick: (event: any) => void, 
  sortingStateSetter: Dispatch<SetStateAction<EvidenceSortState>>,
  setPubmedEvidence: Dispatch<SetStateAction<PublicationObject[]>>
) => {

  let sortedPubmedEvidence = cloneDeep(pubmedEvidence);
  let newSortingState: EvidenceSortState = { title: null, journal: null, date: null };
  switch (sortName) {
    case 'titleLowHigh':
      sortedPubmedEvidence = sortNameLowHigh(sortedPubmedEvidence) as PublicationObject[];
      newSortingState.title = true;
      newSortingState.journal = null;
      newSortingState.date = null;
      break;
    case 'titleHighLow':
      sortedPubmedEvidence = sortNameHighLow(sortedPubmedEvidence) as PublicationObject[];
      newSortingState.title = false;
      newSortingState.journal = null;
      newSortingState.date = null;
      break;
    case 'journalLowHigh':
      sortedPubmedEvidence = sortJournalLowHigh(sortedPubmedEvidence);
      newSortingState.title = null;
      newSortingState.journal = true;
      newSortingState.date = null;
      break;
    case 'journalHighLow':
      sortedPubmedEvidence = sortJournalHighLow(sortedPubmedEvidence);
      newSortingState.title = null;
      newSortingState.journal = false;
      newSortingState.date = null;
      break;
    case 'dateLowHigh':
      sortedPubmedEvidence = sortDateYearLowHigh(sortedPubmedEvidence);
      newSortingState.title = null;
      newSortingState.journal = null;
      newSortingState.date = false;
      break;
    case 'dateHighLow':
      sortedPubmedEvidence = sortDateYearHighLow(sortedPubmedEvidence);
      newSortingState.title = null;
      newSortingState.journal = null;
      newSortingState.date = true;
      break;
    default:
      break;
  }

  sortingStateSetter(newSortingState);
  setPubmedEvidence(sortedPubmedEvidence);

  // reset to page one.
  handlePageClick({selected: 0});
}

/**
 * Checks if two edges are non-null and have matching IDs.
 *
 * @param {ResultEdge | null} edgeOne - The first edge to compare.
 * @param {ResultEdge | null} edgeTwo - The second edge to compare.
 * @returns {boolean} - `true` if both edges are non-null and have the same ID, otherwise `false`.
 */
export const checkForEdgeMatch = (edgeOne: ResultEdge | null, edgeTwo: ResultEdge | null) => {
  return (!!edgeOne && !!edgeTwo &&  edgeOne.id === edgeTwo?.id);
}

export const updateJournal = (element: PublicationObject, data: any) => {
  if(!element.journal && element.id)
    element.journal = capitalizeAllWords(data[element.id].journal_name);
}
export const updateTitle = (element: PublicationObject, data: any) => {
  if(!element.title && element.id)
    element.title = capitalizeAllWords(data[element.id].article_title.replace('[', '').replace(']',''));
}
export const updateSnippet = (element: PublicationObject, data: any) => {
  if(!element.snippet && element.id)
    element.snippet = data[element.id].abstract;
}
export const updatePubdate = (element: PublicationObject, data: any) => {
  if(!element.pubdate && element.id) {
    let year = (data[element.id].pub_year) ? data[element.id].pub_year: 0;
    element.pubdate = year;
  }
}

/**
 * Converts a knowledge level identifier into a human-readable string.
 *
 * @param {string} knowledgeLevel - The raw knowledge level identifier (e.g., "trusted", "ml").
 * @returns {string} - A human-readable knowledge level string.
 */
export const getKnowledgeLevelString = (knowledgeLevel: string): string => {
  let knowledgeLevelString;
  switch (knowledgeLevel) {
    case 'trusted':
      knowledgeLevelString = 'Curated'
      break;
    case 'ml':
      knowledgeLevelString = 'Text-Mined'
      break;
    default:
      knowledgeLevelString = 'Unknown';
      break;
  }
  return knowledgeLevelString;
}

/**
 * Generates a PubMed or PubMed Central (PMC) URL based on a given identifier.
 *
 * @param {string} id - The publication identifier (e.g., "PMC123456", "PMID:7891011").
 * @returns {string} - The corresponding PubMed or PMC URL, or an empty string if the ID is unrecognized.
 *
 */
export const generatePubmedURL = (id: string): string => {
  if(id.includes("PMC")) 
    return `https://www.ncbi.nlm.nih.gov/pmc/${id}`;
  if(id.includes("PMID"))
    return `http://www.ncbi.nlm.nih.gov/pubmed/${id.replace("PMID:", "")}`;

  return "";
}

/**
 * Retrieves and flattens publication objects from a structured publication list.
 *
 * Fetches publication details from the result set based on the provided raw publication list, 
 * organizing them into a flat array while preserving their associated knowledge levels.
 *
 * @param {ResultSet | null} resultSet - The dataset containing publication information.
 * @param {RawPublicationList} pubs - A structured object mapping knowledge levels to publication entries.
 * @returns {PublicationObject[]} - An array of publication objects with relevant metadata.
 *
 */
export const flattenPublicationObject = (resultSet: ResultSet | null, pubs: RawPublicationList): PublicationObject[] => {
  const pubArray: PublicationObject[] = [];
  if(!resultSet)
    return pubArray;

  for (const key in pubs) {
    const entries = pubs[key];
    for (const entryID of entries) {
      const pub = getPubById(resultSet, entryID.id);
      if(!!pub) {
        pubArray.push({
          knowledgeLevel: key, 
          id: entryID.id,
          source: pub.source,
          support: pub.support || null,
          type: pub.type,
          url: pub.url
        });
      }
    }
  }
  return pubArray;
}

/**
 * Retrieves and flattens trial objects from a list of trial IDs.
 *
 * Fetches trial objects associated with the given trial IDs from the result set and 
 * returns them as a flattened array. Skips any IDs that do not have a corresponding trial.
 *
 * @param {ResultSet | null} resultSet - The dataset containing trial information.
 * @param {string[]} trialIDs - An array of trial IDs to look up.
 * @returns {TrialObject[]} - An array of trial objects, excluding any missing trials.
 *
 */
export const flattenTrialObject = (resultSet: ResultSet | null, trialIDs: string[]): TrialObject[] => {
  const trialArray: TrialObject[] = [];
  if(!trialIDs)
    return trialArray;
  for (const id of trialIDs) {
    const trial = getTrialById(resultSet, id);
    if(!!trial) 
      trialArray.push(trial);
  }

  return trialArray;
}

/**
 * Generates a hierarchical path dictionary and an ID lookup map.
 *
 * This function organizes paths into a structured dictionary with hierarchical keys 
 * (e.g., "1.a", "1.b.i") and creates a lookup map linking path IDs to their keys. 
 * It recursively processes support paths, applying filtering as needed.
 *
 * @param {ResultSet | null} resultSet - The dataset containing paths and edges. Returns an empty dictionary if null.
 * @param {Path[]} paths - The array of base paths to process.
 * @param {PathFilterState | null} pathFilterState - The filter state used to determine included support paths.
 * @returns {{
*   pathDictionary: Map<string, Path>,
*   pathIdLookup: Map<string, string>
* }} - An object containing:
*   - `pathDictionary`: A hierarchical map of structured path keys to Path objects.
*   - `pathIdLookup`: A map linking path IDs to their corresponding hierarchical keys.
*
* @example
* const { pathDictionary, pathIdLookup } = createPathDictionaryAndLookup(resultSet, paths, filterState);
* console.log(pathDictionary.get("1.a.i")); // Retrieves the nested support path.
* console.log(pathIdLookup.get("P001")); // Retrieves the hierarchical key for path ID "P001".
*/
export const createPathDictionaryAndLookup = (
  resultSet: ResultSet | null,
  paths: Path[],
  pathFilterState: PathFilterState | null
): { pathDictionary: Map<string, Path>; pathIdLookup: Map<string, string> } => {
  const pathDictionary = new Map<string, Path>();
  const pathIdLookup = new Map<string, string>();

  if (!resultSet)
    return { pathDictionary, pathIdLookup };

  const processPath = (path: Path, keyPrefix: string, depth: number) => {
    if (pathDictionary.has(keyPrefix)) 
      return;
    pathDictionary.set(keyPrefix, path);
    if (path.id) 
      pathIdLookup.set(path.id, keyPrefix);

    for (let i = 1; i < path.subgraph.length; i += 2) {
      const edgeID = path.subgraph[i];
      if (typeof edgeID === "string") {
        const edge = getEdgeById(resultSet, edgeID);
        if (!!edge && hasSupport(edge)) {
          let supportPaths = getPathsWithSelectionsSet(resultSet, edge.support, pathFilterState ? pathFilterState : {}, null);
          for (const [supportIndex, supportPath] of supportPaths.entries()) {
            const suffix = (depth === 2)
              ? intToNumeral(supportIndex + 1)  
              : intToChar(supportIndex + 1);
            const supportKey = `${keyPrefix}.${suffix}`;
            processPath(supportPath, supportKey, depth + 1);
          }
        }
      }
    }
  };

  for (const [pathIndex, path] of paths.entries()) {
    processPath(path, (pathIndex + 1).toString(), 1);
  }
  return { pathDictionary, pathIdLookup };
}

/**
 * Finds a path in the dictionary by its path ID.
 *
 * Uses a precomputed lookup map to efficiently retrieve the hierarchical key 
 * and corresponding path object from the path dictionary.
 *
 * @param {Map<string, Path>} pathDict - The hierarchical dictionary of paths.
 * @param {Map<string, string>} pathIdLookup - A map linking path IDs to their hierarchical keys.
 * @param {string} pathID - The ID of the path to find.
 * @returns {{ key: string; path: Path } | null} - The matched path and its key, or null if not found.
 *
 */
export const findPathInDictionary = (
  pathDict: Map<string, Path>,
  pathIdLookup: Map<string, string>,
  pathID: string
): { key: string; path: Path } | null => {
  const key = pathIdLookup.get(pathID);
  if (!key) return null;
  const path = pathDict.get(key);
  return path ? { key, path } : null;
};