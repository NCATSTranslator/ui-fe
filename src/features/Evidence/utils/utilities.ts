//  Focus: General evidence processing and data analysis

import { PublicationObject, RawPublicationList, TrialObject, PubmedMetadataMap, PublicationSupport } from "@/features/Evidence/types/evidence";
import { isPublication } from "@/features/Evidence/types/checkers";
import { capitalizeAllWords } from '@/features/Core/utils/stringFormatters';
import { getNodeById, getEdgeById, getPubById, getPathById, getTrialById, getPublicationSource } from "@/features/ResultList/slices/resultsSlice";
import { ResultSet, ResultEdge, ResultNode, Result, Path } from "@/features/ResultList/types/results.d";
import { EvidenceCountsContainer } from "@/features/Evidence/types/evidence";
import { getCompressedEdge } from "@/features/Core/utils/resultHelpers";
import { isResultEdge } from "@/features/ResultList/types/checkers";

interface EvidenceAccumulator {
  pubs: Set<string>;
  cts: Set<string>;
  sources: Set<string>;
  misc: Set<string>;
  visitedPathIds: Set<string>;
}

const addEdgePublications = (resultSet: ResultSet, edge: ResultEdge, acc: EvidenceAccumulator) => {
  for (const key in edge.publications) {
    const pubArray = edge.publications[key];
    if (!Array.isArray(pubArray)) continue;
    for (const pubData of pubArray) {
      const pub = getPubById(resultSet, pubData.id);
      if (!pub) continue;
      if (isPublication(pub, false))
        acc.pubs.add(pub.url);
      else
        acc.misc.add(pub.url);
    }
  }
};

const addEdgeTrials = (edge: ResultEdge, acc: EvidenceAccumulator) => {
  if (Array.isArray(edge.trials)) {
    for (const trialId of edge.trials) {
      acc.cts.add(trialId);
    }
  }
};

const addEdgeSources = (edge: ResultEdge, acc: EvidenceAccumulator) => {
  if (edge.provenance && !edge.inferred) {
    for (const source of edge.provenance) {
      acc.sources.add(source.infores);
    }
  }
};

const collectSupportPathEvidence = (resultSet: ResultSet, supportPath: Path, pathId: string, acc: EvidenceAccumulator) => {
  if (pathId && acc.visitedPathIds.has(pathId)) return;
  if (pathId) acc.visitedPathIds.add(pathId);
  try {
    for (let j = 1; j < supportPath.subgraph.length; j += 2) {
      collectEvidenceFromEdge(resultSet, supportPath.subgraph[j], true, acc);
    }
  } finally {
    if (pathId) acc.visitedPathIds.delete(pathId);
  }
};

const collectSupportEvidence = (resultSet: ResultSet, edge: ResultEdge, acc: EvidenceAccumulator) => {
  if (!edge.inferred || !edge.support) return;
  for (const sp of edge.support) {
    const supportPath = (typeof sp === "string") ? getPathById(resultSet, sp) : sp;
    if (!supportPath) continue;
    const pathId = supportPath.id ?? (typeof sp === "string" ? sp : "");
    collectSupportPathEvidence(resultSet, supportPath, pathId, acc);
  }
};

const collectEvidenceFromEdge = (
  resultSet: ResultSet,
  edge: ResultEdge | string,
  includeSupport: boolean,
  acc: EvidenceAccumulator
) => {
  const resultEdge = (typeof edge === "string") ? getEdgeById(resultSet, edge) : edge;
  if (!resultEdge) return;

  addEdgePublications(resultSet, resultEdge, acc);
  addEdgeTrials(resultEdge, acc);
  addEdgeSources(resultEdge, acc);

  if (includeSupport) {
    collectSupportEvidence(resultSet, resultEdge, acc);
  }
};

/**
 * Generates evidence ids for a provided edge, optionally including support edges
 *
 * @param {ResultSet} resultSet - Result Set to fetch data from.
 * @param {ResultEdge | string} edge - Edge or edge ID to generate counts for.
 * @param {boolean} includeSupport - Whether to include evidence from support edges (default: false).
 * @returns {{pubs: Set<string>, cts: Set<string>, sources: Set<string>, misc: Set<string>}} Returns an object with the evidence Sets.
 */
export const getEvidenceFromEdge = (
  resultSet: ResultSet,
  edge: ResultEdge | string,
  includeSupport: boolean = false
) => {
  const acc: EvidenceAccumulator = {
    pubs: new Set(), cts: new Set(), sources: new Set(), misc: new Set(), visitedPathIds: new Set(),
  };
  collectEvidenceFromEdge(resultSet, edge, includeSupport, acc);
  const { pubs, cts, sources, misc } = acc;
  return { pubs, cts, sources, misc };
};

/**
 * Generates evidence counts for a provided list of paths
 *
 * @param {ResultSet} resultSet - Result Set to fetch data from.
 * @param {Path[]} paths - Array of paths to generate counts for.
 * @returns {EvidenceCountsContainer} Returns an EvidenceCountsContainer object with the requested counts.
 */
const getEvidenceCountsFromPaths = (resultSet: ResultSet, paths: Path[]): EvidenceCountsContainer => {
  let allPubs = new Set<string>();
  let allCTs = new Set<string>();
  let allSources = new Set<string>();
  let allMisc = new Set<string>();

  const processPathEdges = (path: Path) => {
    for(let i = 1; i < path.subgraph.length; i += 2) {
      let edgeEvidence = getEvidenceFromEdge(resultSet, path.subgraph[i], true);
      if(edgeEvidence.pubs.size > 0)
        allPubs = allPubs.union(edgeEvidence.pubs);
      if(edgeEvidence.cts.size > 0)
        allCTs = allCTs.union(edgeEvidence.cts);
      if(edgeEvidence.sources.size > 0)
        allSources = allSources.union(edgeEvidence.sources);
      if(edgeEvidence.misc.size > 0)
        allMisc = allMisc.union(edgeEvidence.misc);
    }
  };

  // Process all paths
  for (const path of paths) {
    processPathEdges(path);
  }

  return {
    clinicalTrialCount: allCTs.size,
    miscCount: allMisc.size,
    publicationCount: allPubs.size,
    sourceCount: allSources.size,
  };
};

/**
 * Calculates the evidence counts from all paths on a single provided result.
 *
 * @param {ResultSet | null} resultSet - ResultSet object.
 * @param {Result | undefined} resultSet - Result object.
 * @returns {EvidenceCountsContainer} - EvidenceCountsContainer object. 
 *
 */
export const getEvidenceCounts = (resultSet: ResultSet | null, result: Result | undefined): EvidenceCountsContainer => {
  if (!resultSet || !result) {
    return { publicationCount: 0, sourceCount: 0, clinicalTrialCount: 0, miscCount: 0 };
  }

  const paths: Path[] = [];
  for (const p of result.paths) {
    const path = (typeof p === "string") ? getPathById(resultSet, p) : p;
    if (path) paths.push(path);
  }

  return getEvidenceCountsFromPaths(resultSet, paths);
};

/**
 * Sums the evidence counts from a provided EvidenceCountsContainer object.
 *
 * @param {EvidenceCountsContainer} countObj - EvidenceCountsContainer object.
 * @returns {number} - Sum of all evidence counts. 
 *
 */
export const calculateTotalEvidence = (countObj: EvidenceCountsContainer): number => {
  return (
    countObj.clinicalTrialCount +
    countObj.miscCount +
    countObj.publicationCount +
    countObj.sourceCount
  );
}

/**
 * Returns a formatted name for a publication source based on a provided string.
 *
 * @param {string} sourceName - The publication source name to format.
 * @returns {string} - The formatted source name. 
 */
export const formatPublicationSourceName = (sourceName: string): string => {
  let newSourceName = sourceName;
  if(typeof sourceName === 'string') {
    if(sourceName.toLowerCase() === "semantic medline database") {
      newSourceName = "SemMedDB"
    }
  }
  return newSourceName;
}

/**
 * Returns a formatted string based on the type of the provided publication ID. 
 *
 * @param {string} publicationID - The publication id.
 * @returns {string} - The formatted type string. 
 */
export const getTypeFromPub = (publicationID: string): string => {
  if(publicationID.toLowerCase().includes("pmid"))
    return "PMID";
  if(publicationID.toLowerCase().includes("pmc"))
    return "PMC";
  if(publicationID.toLowerCase().includes("clinicaltrials"))
    return "NCT";
  return "other";
}

/**
 * Returns url that based on the type of the provided publication ID. 
 *
 * @param {string} publicationID - The publication id.
 * @param {string} type - The publication's type.
 * @returns {string} - The formatted url (or the provided id if the type is not recognized). 
 */
export const getUrlByType = (publicationID: string, type: string): string => {
  let url;
  switch (type) {
    case "PMID":
      url = `http://www.ncbi.nlm.nih.gov/pubmed/${publicationID.replace("PMID:", "")}`;
      break;
    case "PMC":
      url = `https://www.ncbi.nlm.nih.gov/pmc/articles/${publicationID.replace(":", "")}`;
      break;
    case "NCT":
      url = `https://clinicaltrials.gov/ct2/show/${publicationID.replace("clinicaltrials", "").replace(":", "")}`
      break;
    default:
      url = publicationID;
      break;
  }
  return url;
}

/**
 * Returns a string label that represents the provided ResultEdge object.  
 *
 * @param {ResultSet} resultSet - ResultSet object.
 * @param {ResultEdge} edge - The edge to generate a label for.
 * @returns {string} - A label containing the subject node name, predicate, and object node name
 * separated by pipe characters. 
 */
export const getFormattedEdgeLabel = (resultSet: ResultSet, edge: ResultEdge): string => {
  const subjectNode = getNodeById(resultSet, edge.subject);
  const subjectNodeName = (!!subjectNode) ? subjectNode.names[0] : "";
  const objectNode = getNodeById(resultSet, edge.object);
  const objectNodeName = (!!objectNode) ? objectNode.names[0] : "";

  return `${capitalizeAllWords(subjectNodeName)}|${edge.predicate.toLowerCase()}|${capitalizeAllWords(objectNodeName)}`;
}

/**
 * Finds the publication entry (with its support data) matching a given publication ID on an edge.
 *
 * @param {string} pubID - The publication ID to look for.
 * @param {ResultEdge} edge - The edge whose publications should be searched.
 * @returns {{id: string; support: PublicationSupport;} | false} - The matching publication entry, or false if none is found.
 */
export const findPublicationOnEdge = (pubID: string, edge: ResultEdge): {id: string; support: PublicationSupport;} | false => {
  for (const pubTypeArr of Object.values(edge.publications)) {
    const match = pubTypeArr.find(publication => publication.id === pubID);
    if (match) return match;
  }
  return false;
};

/**
 * Resolves the edge that was clicked within a path's (optionally compressed) subgraph.
 *
 * When a compressed subgraph is available, the matching edge is located within it (handling
 * grouped/compressed edges). Otherwise, a freshly compressed edge is built from the provided IDs.
 *
 * @param {ResultSet} resultSet - Result Set used to build a compressed edge when no subgraph is available.
 * @param {(ResultNode | ResultEdge | ResultEdge[])[] | false} compressedSubgraph - The compressed subgraph to search, or false if unavailable.
 * @param {string[]} edgeIDs - The clicked edge IDs (the first is used to match within the subgraph).
 * @returns {ResultEdge | undefined} - The resolved edge, or undefined if none could be resolved.
 */
export const resolveClickedEdge = (
  resultSet: ResultSet,
  compressedSubgraph: (ResultNode | ResultEdge | ResultEdge[])[] | false,
  edgeIDs: string[]
): ResultEdge | undefined => {
  if (!compressedSubgraph) {
    const edge = getCompressedEdge(resultSet, edgeIDs);
    return isResultEdge(edge) ? edge : undefined;
  }
  for (let i = 1; i < compressedSubgraph.length; i += 2) {
    const edgeItem = compressedSubgraph[i];
    if (Array.isArray(edgeItem)) {
      const found = edgeItem.find(e => e.id === edgeIDs[0]);
      if (found) return found;
    } else if (isResultEdge(edgeItem) && edgeItem.id === edgeIDs[0]) {
      return edgeItem;
    }
  }
  return undefined;
};

/**
 * Checks if any edge in the provided array has clinical trials attached.
 *
 * @param {ResultEdge[]} edges - Array of edges to check for clinical trials.
 * @returns {boolean} - Returns true if any edge has clinical trials, otherwise false.
 */
export const checkEdgesForClinicalTrials = (edges: ResultEdge[]): boolean => {
  for(const edge of edges) {
    if(edge.trials.length > 0)
      return true;
  }
  return false;
}

/**
 * Checks if any edge in the provided array has publications attached.
 *
 * @param {ResultEdge[]} edges - Array of edges to check for publications.
 * @returns {boolean} - Returns true if any edge has publications, otherwise false.
 */
export const checkEdgesForPubs = (edges: ResultEdge[]): boolean => {
  for(const edge of edges) {
    const publications = Object.values(edge.publications);
    for(const publication of publications) {
      if(publication.some(pub => isPublication(pub, false)))
        return true;
    }
  }
  return false;
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

/**
 * Updates the journal name of a publication object with data from PubMed metadata.
 *
 * @param {PublicationObject} element - The publication object to update.
 * @param {PubmedMetadataMap} data - The PubMed metadata map containing journal information.
 */
export const updateJournal = (element: PublicationObject, data: PubmedMetadataMap) => {
  if(!element.journal && element.id)
    element.journal = capitalizeAllWords(data[element.id].journal_name);
}

/**
 * Updates the title of a publication object with data from PubMed metadata.
 *
 * @param {PublicationObject} element - The publication object to update.
 * @param {PubmedMetadataMap} data - The PubMed metadata map containing article title information.
 */
export const updateTitle = (element: PublicationObject, data: PubmedMetadataMap) => {
  if(!element.title && element.id)
    element.title = capitalizeAllWords(data[element.id].article_title.replace('[', '').replace(']',''));
}

/**
 * Updates the snippet/abstract of a publication object with data from PubMed metadata.
 *
 * @param {PublicationObject} element - The publication object to update.
 * @param {PubmedMetadataMap} data - The PubMed metadata map containing abstract information.
 */
export const updateSnippet = (element: PublicationObject, data: PubmedMetadataMap) => {
  if(!element.snippet && element.id)
    element.snippet = data[element.id].abstract;
}

/**
 * Updates the publication date of a publication object with data from PubMed metadata.
 *
 * @param {PublicationObject} element - The publication object to update.
 * @param {PubmedMetadataMap} data - The PubMed metadata map containing publication year information.
 */
export const updatePubdate = (element: PublicationObject, data: PubmedMetadataMap) => {
  if(!element.pubdate && element.id) {
    let year = (data[element.id].pub_year) ? data[element.id].pub_year: "0";
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
    return `https://pmc.ncbi.nlm.nih.gov/articles/${id}`;
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
 * @param {ResultEdge} [edge] - The edge the publications belong to, used to resolve per source record links.
 * @returns {PublicationObject[]} - An array of publication objects with relevant metadata.
 */
export const flattenPublicationObject = (resultSet: ResultSet | null, pubs: RawPublicationList, edge?: ResultEdge): PublicationObject[] => {
  const pubArray: PublicationObject[] = [];
  if(!resultSet)
    return pubArray;

  for (const kl in pubs) {
    const pubEntries = pubs[kl];
    for (const pubEntry of pubEntries) {
      const pub = getPubById(resultSet, pubEntry.id);
      if (!!pub) {
        pubArray.push({
          knowledgeLevel: kl,
          id: pubEntry.id,
          source: getPublicationSource(resultSet, pubEntry.infores, edge),
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
