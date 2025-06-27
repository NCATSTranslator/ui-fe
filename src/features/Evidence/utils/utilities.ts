import { PublicationObject, RawPublicationObject } from "../types/evidence";
import { capitalizeAllWords, hasSupport } from "@/features/Common/utils/utilities";
import { getNodeById, getEdgeById, getPubById, getPathById } from "@/features/ResultList/slices/resultsSlice";
import { ResultSet, ResultEdge, Result, Path, isResultEdge } from "@/features/ResultList/types/results.d";
import { EvidenceCountsContainer } from "../types/evidence";

/**
 * Generates evidence ids for a provided edge, optionally including support edges
 *
 * @param {ResultSet} resultSet - Result Set to fetch data from.
 * @param {ResultEdge | string} edge - Edge or edge ID to generate counts for.
 * @param {boolean} includeSupport - Whether to include evidence from support edges (default: false).
 * @param {Set<string>} allPubs - Optional Set to add publication URLs to (if not provided, creates new Set).
 * @param {Set<string>} allCTs - Optional Set to add clinical trial IDs to (if not provided, creates new Set).
 * @param {Set<string>} allSources - Optional Set to add source names to (if not provided, creates new Set).
 * @param {Set<string>} allMisc - Optional Set to add miscellaneous URLs to (if not provided, creates new Set).
 * @returns {{pubs: Set<string>, cts: Set<string>, sources: Set<string>, misc: Set<string>}} Returns an object with the evidence Sets.
 */
export const getEvidenceFromEdge = (
  resultSet: ResultSet, 
  edge: ResultEdge | string,
  includeSupport: boolean = false,
  allPubs?: Set<string>,
  allCTs?: Set<string>,
  allSources?: Set<string>,
  allMisc?: Set<string>
) => {
  // Initialize Sets if not provided
  const pubs = allPubs || new Set<string>();
  const cts = allCTs || new Set<string>();
  const sources = allSources || new Set<string>();
  const misc = allMisc || new Set<string>();

  // Helper function to process a single edge
  const processEdge = (edgeToProcess: ResultEdge) => {
    // Process publications
    for(const key in edgeToProcess.publications) {
      const pubArray = edgeToProcess.publications[key];
      for(const pubData of pubArray) {
        const pub = getPubById(resultSet, pubData.id);
        if(!pub) 
          continue;
        const url = pub.url;
        if(isPublication(pub)) 
          pubs.add(url);
        else 
          misc.add(url);
      }
    }

    // Process clinical trials
    for(const trial in edgeToProcess.trials) 
      cts.add(trial);

    // Process sources
    if(edgeToProcess.provenance) {
      for(const source of edgeToProcess.provenance)
        sources.add(source.name);
    }
  };

  // Get the edge object
  let resultEdge = (isResultEdge(edge)) ? edge : getEdgeById(resultSet, edge);
  
  if(!!resultEdge) {
    // Process the main edge
    processEdge(resultEdge);
    
    // Process support edges if requested
    if(includeSupport && hasSupport(resultEdge) && resultEdge.support) {
      for(const sp of resultEdge.support) {
        const supportPath = (typeof sp === "string") ? getPathById(resultSet, sp): sp;
        if(!supportPath) 
          continue;
        for(let j = 1; j < supportPath.subgraph.length; j += 2) {
          const supportEdge = getEdgeById(resultSet, supportPath.subgraph[j]);
          if(isResultEdge(supportEdge)) 
            processEdge(supportEdge);
        }
      }
    }
  }

  return {
    pubs,
    cts,
    sources,
    misc
  };
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
  if(typeof sourceName === 'string')
  switch (sourceName.toLowerCase()) {
    case "semantic medline database":
      newSourceName = "SemMedDB"
      break;

    default:
      break;
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
 * Type guard to check if an object is a PublicationObject.
 *
 * @param obj - The object to check.
 * @returns {boolean} True if the object is a PublicationObject, otherwise false.
 */
export const isPublicationObject = (obj: any): obj is PublicationObject => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.source === 'object' &&
    typeof obj.type === 'string' &&
    typeof obj.url === 'string'
  );
}

/**
 * Type guard to check if an object is an array of PublicationObjects.
 *
 * @param obj - The object to check.
 * @returns {boolean} True if the object is a PublicationsList, otherwise false.
 */
export const isPublicationObjectArray = (arr: any): arr is PublicationObject[] => {

  return Array.isArray(arr) && 
    arr.every(item => isPublicationObject(item));
}

export const checkPublicationsType = (edgeObject: ResultEdge): string => {
  if (isPublicationObjectArray(edgeObject.publications)) {
    return "PublicationObject[]";
  } else if (isPublicationDictionary(edgeObject.publications)) {
    return "{[key: string]: string[]}";
  } else {
    return "Unknown type";
  }
}

/**
 * Type guard to check if an object is a PublicationDictionary.
 *
 * @param obj - The object to check.
 * @returns {boolean} True if the object is a PublicationDictionary, otherwise false.
 */
export const isPublicationDictionary = (publications: any): publications is {[key: string]: string[]} => {
  return typeof publications === 'object' && !Array.isArray(publications) && Object.values(publications).every(value => Array.isArray(value) && value.every(item => typeof item === 'string'));
}

/**
 * Returns a boolean indicating whether an edge has any clinical trials attached
 *
 * @param {ResultEdge} edge - The edge in question
 * @returns {boolean} - Returns true if the edge has any clinical trials, otherwise false. 
 */
export const checkEdgesForClinicalTrials = (edges: ResultEdge[]): boolean => {
  for(const edge of edges) {
    if(edge.trials.length > 0)
      return true;
  }
  return false;
}

/**
 * Returns a boolean indicating whether an edge has any publications attached
 *
 * @param {ResultEdge} edge - The edge in question
 * @returns {boolean} - Returns true if the edge has any publications, otherwise false.  
 */
export const checkEdgesForPubs = (edges: ResultEdge[]): boolean => {
  for(const edge of edges) {
    if(Object.values(edge.publications).length > 0)
      return true;
  }
  return false;
}

/**
 * Returns a boolean based on if the provided PublicationObject or RawPublicationObject is categorized as a publication
 *
 * @param {PublicationObject | RawPublicationObject} publication - The object to check.
 * @returns {boolean} True if the object is a publication, false otherwise
 */
export const isPublication = (publication: PublicationObject | RawPublicationObject) => {
  if(isPublicationObject(publication) && (publication.type === "PMID" || publication.type === "PMC"))
    return true;
  else if(publication.id?.includes("PMID") || publication.id?.includes("PMC"))  {
    return true;
  }

  return false
}