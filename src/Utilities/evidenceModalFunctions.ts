import { Dispatch, SetStateAction } from 'react';
import { sortNameHighLow, sortNameLowHigh, sortJournalHighLow, sortJournalLowHigh,
  sortDateYearHighLow, sortDateYearLowHigh } from './sortingFunctions';
import { cloneDeep, isEqual } from 'lodash';
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
 * Constructs a hierarchical dictionary of paths and a lookup map with full ancestry-based disambiguation.
 *
 * This function processes a list of paths (and their recursive support paths) to build:
 * - A hierarchical `pathDictionary` using structured keys like "1.a.i"
 * - A `pathIdLookup` that maps each Path.id to all of its hierarchical keys,
 *   along with the full ancestry chain of path IDs from root to that node
 *
 * This ensures each occurrence of a path is uniquely identified by its ancestry, 
 * even when the same path ID appears multiple times under shared or repeated parents.
 *
 * @param {ResultSet | null} resultSet - The graph dataset containing edges and support path relationships.
 * @param {Path[]} paths - The base set of top-level paths to process.
 * @param {PathFilterState | null} pathFilterState - Optional filter criteria to apply when retrieving support paths.
 *
 * @returns {{
 *   pathDictionary: Map<string, Path>,
 *   pathIdLookup: Map<string, { key: string, ancestry: string[] }[]>
 * }} - An object containing:
 *   - `pathDictionary`: A map of hierarchical keys (e.g., "1.a.i") to their corresponding `Path` objects
 *   - `pathIdLookup`: A map of `Path.id` to all its hierarchical key instances and their ancestry chains
 *
 * @example
 * const { pathDictionary, pathIdLookup } = createPathDictionaryAndLookup(resultSet, paths, filterState);
 * const match = findPathByAncestry(pathDictionary, pathIdLookup, "P007", ["P001", "P002", "P007"]);
 * console.log(match?.key); // e.g. "2.a.i"
*/
export const createPathDictionaryAndLookup = (
  resultSet: ResultSet | null,
  paths: Path[],
  pathFilterState: PathFilterState | null
): {
  pathDictionary: Map<string, Path>;
  pathIdLookup: Map<string, { key: string; ancestry: string[] }[]>;
} => {
  const pathDictionary = new Map<string, Path>();
  const pathIdLookup = new Map<string, { key: string; ancestry: string[] }[]>();

  if (!resultSet) return { pathDictionary, pathIdLookup };

  const processPath = (
    path: Path,
    keyPrefix: string,
    depth: number,
    ancestry: string[]
  ) => {
    if (pathDictionary.has(keyPrefix)) return;
    pathDictionary.set(keyPrefix, path);

    if (path.id) {
      const fullAncestry = [...ancestry, path.id];
      const existing = pathIdLookup.get(path.id) || [];
      existing.push({ key: keyPrefix, ancestry: fullAncestry });
      pathIdLookup.set(path.id, existing);
    }

    for (let i = 1; i < path.subgraph.length; i += 2) {
      const edgeID = path.subgraph[i];
      if (typeof edgeID === "string") {
        const edge = getEdgeById(resultSet, edgeID);
        if (!!edge && hasSupport(edge)) {
          const supportPaths = getPathsWithSelectionsSet(resultSet, edge.support, pathFilterState ?? {}, null);
          for (const [supportIndex, supportPath] of supportPaths.entries()) {
            const suffix = (depth === 2)
              ? intToNumeral(supportIndex + 1)
              : intToChar(supportIndex + 1);
            const supportKey = `${keyPrefix}.${suffix}`;
            if(!!path?.id)
              processPath(supportPath, supportKey, depth + 1, [...ancestry, path.id]);
          }
        }
      }
    }
  };

  for (const [pathIndex, path] of paths.entries()) {
    const rootKey = (pathIndex + 1).toString();
    processPath(path, rootKey, 1, []);
  }

  return { pathDictionary, pathIdLookup };
};

/**
 * Resolves a specific occurrence of a path by its ID and full ancestry chain.
 *
 * This function uses a path's full ancestry (from root to target node) to 
 * precisely locate a unique instance of a path in the dictionary, even if 
 * the same path ID appears in multiple branches of the hierarchy.
 *
 * @param {Map<string, Path>} pathDict - The hierarchical dictionary of paths keyed by structured strings like "1.a.i".
 * @param {Map<string, { key: string, ancestry: string[] }[]>} pathIdLookup - A map of path IDs to all known key/ancestry pairs.
 * @param {string} pathID - The ID of the path to resolve.
 * @param {string[]} fullAncestry - The full chain of path IDs from root to the target path (inclusive).
 *
 * @returns {{ key: string, path: Path } | null} - The resolved path and its hierarchical key, or null if not found.
 *
 * @example
 * const result = findPathByAncestry(pathDict, pathIdLookup, "P007", ["P001", "P002", "P007"]);
 * console.log(result?.key); // → "2.a.i"
 */
export const findPathByAncestry = (
  pathDict: Map<string, Path>,
  pathIdLookup: Map<string, { key: string; ancestry: string[] }[]>,
  pathID: string,
  fullAncestry: string[]
): { key: string; path: Path } | null => {
  const matches = pathIdLookup.get(pathID);
  if (!matches) return null;

  const match = matches.find(m =>  isEqual(m.ancestry, fullAncestry));
  if (!match) return null;

  const path = pathDict.get(match.key);
  return path ? { key: match.key, path } : null;
};