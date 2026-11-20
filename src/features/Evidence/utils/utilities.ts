//  Focus: General evidence processing and data analysis

import { PublicationObject, RawPublicationList, TrialObject, PubmedMetadataMap, PublicationSupport, ProvenanceCatalogEntry, Provenance } from "@/features/Evidence/types/evidence";
import { isPublication } from "@/features/Evidence/types/checkers";
import { capitalizeAllWords } from '@/features/Core/utils/stringFormatters';
import { getNodeById, getEdgeById, getPubById, getPathById, getTrialById, getPublicationSource } from "@/features/ResultList/slices/resultsSlice";
import { ResultSet, ResultEdge, ResultNode, Result, Path } from "@/features/ResultList/types/results.d";
import { EvidenceCountsContainer } from "@/features/Evidence/types/evidence";
import { getCompressedEdge, getPathSequenceKey } from "@/features/Core/utils/resultHelpers";
import { isResultEdge } from "@/features/ResultList/types/checkers";
import { EVIDENCE_COUNT_KEYS } from "@/features/Evidence/utils/evidenceSegments";

interface EvidenceAccumulator {
  pubs: Set<string>;
  cts: Set<string>;
  sources: Set<string>;
  misc: Set<string>;
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
  if (edge.provenance) {
    for (const source of edge.provenance) {
      acc.sources.add(source.infores);
    }
  }
};

const collectEvidenceFromEdge = (
  resultSet: ResultSet,
  edge: ResultEdge | string,
  acc: EvidenceAccumulator
) => {
  const resultEdge = (typeof edge === "string") ? getEdgeById(resultSet, edge) : edge;
  if (!resultEdge) return;

  addEdgePublications(resultSet, resultEdge, acc);
  addEdgeTrials(resultEdge, acc);
  addEdgeSources(resultEdge, acc);
};

/**
 * Generates evidence ids for a provided edge
 *
 * @param {ResultSet} resultSet - Result Set to fetch data from.
 * @param {ResultEdge | string} edge - Edge or edge ID to generate counts for.
 * @returns {{pubs: Set<string>, cts: Set<string>, sources: Set<string>, misc: Set<string>}} Returns an object with the evidence Sets.
 */
export const getEvidenceFromEdge = (
  resultSet: ResultSet,
  edge: ResultEdge | string
) => {
  const acc: EvidenceAccumulator = {
    pubs: new Set(), cts: new Set(), sources: new Set(), misc: new Set(),
  };
  collectEvidenceFromEdge(resultSet, edge, acc);
  const { pubs, cts, sources, misc } = acc;
  return { pubs, cts, sources, misc };
};

/**
 * Checks if an edge is an accepted ontology edge.
 *
 * @param {ResultEdge} edge - The edge object.
 * @returns {boolean} - Whether the edge is an accepted ontology edge.
 */
export const isAcceptedOntologyEdge = (edge: ResultEdge) => {
  return edge.predicate === "subclass of" || edge.predicate === "superclass of";
}

export const EMPTY_EVIDENCE_COUNTS: EvidenceCountsContainer = {
  acceptedOntologyCount: 0, clinicalTrialCount: 0, miscCount: 0, productLabelCount: 0, publicationCount: 0, sourceCount: 0,
};

/**
 * Generates evidence counts for a provided list of paths
 *
 * @param {ResultSet} resultSet - Result Set to fetch data from.
 * @param {Path[]} paths - Array of paths to generate counts for.
 * @returns {EvidenceCountsContainer} Returns an EvidenceCountsContainer object with the requested counts.
 */
const getEvidenceCountsFromPaths = (resultSet: ResultSet, paths: Path[]): EvidenceCountsContainer => {
  const acc: EvidenceAccumulator = {
    pubs: new Set(), cts: new Set(), sources: new Set(), misc: new Set(),
  };
  // Edge slots, keyed by node sequence and position, holding an accepted ontology edge
  const ontologySlots = new Set<string>();

  for (const path of paths) {
    // Paths sharing a node sequence display as one path, with the edges at each position merged
    // into a single predicate. Each displayed predicate with an accepted ontology edge among its
    // edges counts once, so an edge shared by several displayed paths counts once per path.
    const sequenceKey = getPathSequenceKey(resultSet, path);

    for (let i = 1; i < path.subgraph.length; i += 2) {
      const edge = getEdgeById(resultSet, path.subgraph[i]);
      if (!edge)
        continue;
      if (sequenceKey && isAcceptedOntologyEdge(edge))
        ontologySlots.add(`${sequenceKey}|${i}`);
      collectEvidenceFromEdge(resultSet, edge, acc);
    }
  }

  return {
    acceptedOntologyCount: ontologySlots.size,
    clinicalTrialCount: acc.cts.size,
    miscCount: acc.misc.size,
    productLabelCount: 0,
    publicationCount: acc.pubs.size,
    sourceCount: acc.sources.size,
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
    return { ...EMPTY_EVIDENCE_COUNTS };
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
  // Counts saved before a type existed (e.g. on older bookmarks) may lack its field
  return EVIDENCE_COUNT_KEYS.reduce((total, [, countKey]) => total + (countObj[countKey] ?? 0), 0);
}

const maxEvidenceTotalCache = new WeakMap<ResultSet, number>();

/**
 * Finds the largest total evidence count of any result in a result set. Used to size a result's
 * evidence bar relative to the other results in its query. Cached per result set object.
 *
 * @param {ResultSet | null} resultSet - ResultSet object.
 * @returns {number} - The largest total evidence count, or 0 without results.
 */
export const getMaxEvidenceTotal = (resultSet: ResultSet | null): number => {
  if (!resultSet?.data?.results) return 0;
  const cached = maxEvidenceTotalCache.get(resultSet);
  if (cached !== undefined) return cached;

  let max = 0;
  for (const result of resultSet.data.results) {
    const total = calculateTotalEvidence(result.evidenceCount ?? getEvidenceCounts(resultSet, result));
    if (total > max) max = total;
  }
  maxEvidenceTotalCache.set(resultSet, max);
  return max;
};

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
export const getEvidenceCountsFromCanvasEdge = (
  edge: { publications?: Record<string, unknown[]>; trials?: unknown[] },
): { pubCount: number; ctCount: number } => {
  let pubCount = 0;
  for (const entries of Object.values(edge.publications ?? {})) {
    pubCount += entries.length;
  }
  return { pubCount, ctCount: edge.trials?.length ?? 0 };
};

export const getFormattedEdgeLabel = (resultSet: ResultSet, edge: ResultEdge): string => {
  const subjectNode = getNodeById(resultSet, edge.subject);
  const subjectNodeName = (!!subjectNode) ? subjectNode.names[0] : "";
  const objectNode = getNodeById(resultSet, edge.object);
  const objectNodeName = (!!objectNode) ? objectNode.names[0] : "";

  return `${capitalizeAllWords(subjectNodeName)}|${edge.predicate.toLowerCase()}|${capitalizeAllWords(objectNodeName)}`;
}

export const getFormattedEdgeLabelWithNames = (
  edge: ResultEdge,
  nodeNames: Record<string, string>,
): string => {
  const subjectNodeName = nodeNames[edge.subject] ?? edge.subject;
  const objectNodeName = nodeNames[edge.object] ?? edge.object;
  return `${capitalizeAllWords(subjectNodeName)}|${edge.predicate.toLowerCase()}|${capitalizeAllWords(objectNodeName)}`;
};

export const formatEvidenceEdgeLabel = (
  edge: ResultEdge,
  resultSet: ResultSet | null,
  nodeNameLookup: Record<string, string> = {},
): string => {
  const raw = resultSet
    ? getFormattedEdgeLabel(resultSet, edge)
    : getFormattedEdgeLabelWithNames(edge, nodeNameLookup);
  return raw.replaceAll('|', ' ');
};

/**
 * Finds the publication entry (with its support data) matching a given publication ID on an edge.
 *
 * @param {string} pubID - The publication ID to look for.
 * @param {ResultEdge} edge - The edge whose publications should be searched.
 * @returns {{id: string; support: PublicationSupport | null;} | false} - The matching publication entry, or false if none is found.
 */
export const findPublicationOnEdge = (pubID: string, edge: ResultEdge): {id: string; support: PublicationSupport | null;} | false => {
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
    element.journal = capitalizeAllWords(data[element.id]?.journal_name ?? '');
}

/**
 * Updates the title of a publication object with data from PubMed metadata.
 *
 * @param {PublicationObject} element - The publication object to update.
 * @param {PubmedMetadataMap} data - The PubMed metadata map containing article title information.
 */
export const updateTitle = (element: PublicationObject, data: PubmedMetadataMap) => {
  if(!element.title && element.id)
    element.title = capitalizeAllWords((data[element.id]?.article_title ?? '').replace('[', '').replace(']',''));
}

/**
 * Updates the snippet/abstract of a publication object with data from PubMed metadata.
 *
 * @param {PublicationObject} element - The publication object to update.
 * @param {PubmedMetadataMap} data - The PubMed metadata map containing abstract information.
 */
export const updateSnippet = (element: PublicationObject, data: PubmedMetadataMap) => {
  if(!element.snippet && element.id)
    element.snippet = data[element.id]?.abstract ?? '';
}

/**
 * Updates the publication date of a publication object with data from PubMed metadata.
 *
 * @param {PublicationObject} element - The publication object to update.
 * @param {PubmedMetadataMap} data - The PubMed metadata map containing publication year information.
 */
export const updatePubdate = (element: PublicationObject, data: PubmedMetadataMap) => {
  if(!element.pubdate && element.id) {
    const year = data[element.id]?.pub_year || "0";
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

const buildTrialUrl = (id: string): string => {
  const nctMatch = id.match(/NCT\d+/i);
  if (nctMatch) {
    return `https://clinicaltrials.gov/study/${nctMatch[0].toUpperCase()}`;
  }
  return getUrlByType(id, getTypeFromPub(id));
};

const publicationObjectFromRef = (
  pubEntry: { id: string; support: PublicationSupport | null; infores: string },
  knowledgeLevel: string,
  edge?: ResultEdge,
  provenanceCatalog?: Record<string, ProvenanceCatalogEntry>,
): PublicationObject => {
  const type = getTypeFromPub(pubEntry.id);
  return {
    knowledgeLevel,
    id: pubEntry.id,
    source: getPublicationSource(null, pubEntry.infores, edge, provenanceCatalog),
    support: pubEntry.support || null,
    type,
    url: getUrlByType(pubEntry.id, type),
  };
};

const trialObjectFromRef = (id: string): TrialObject => ({
  child: false,
  id,
  phase: 0,
  size: 0,
  start_date: '',
  status: 'UNKNOWN',
  url: buildTrialUrl(id),
});

/**
 * Retrieves and flattens publication objects from a structured publication list.
 *
 * Fetches publication details from the result set based on the provided raw publication list, 
 * organizing them into a flat array while preserving their associated knowledge levels.
 *
 * @param {ResultSet | null} resultSet - The dataset containing publication information.
 * @param {RawPublicationList} pubs - A structured object mapping knowledge levels to publication entries.
 * @param {ResultEdge} [edge] - The edge the publications belong to, used to resolve per source record links.
 * @param {Record<string, ProvenanceCatalogEntry>} [provenanceCatalog] - Infores catalog entries used to name sources when there is no result set.
 * @returns {PublicationObject[]} - An array of publication objects with relevant metadata.
 */
export const flattenPublicationObject = (
  resultSet: ResultSet | null,
  pubs: RawPublicationList,
  edge?: ResultEdge,
  provenanceCatalog?: Record<string, ProvenanceCatalogEntry>,
): PublicationObject[] => {
  const pubArray: PublicationObject[] = [];

  for (const kl in pubs) {
    const pubEntries = pubs[kl];
    for (const pubEntry of pubEntries) {
      const pub = resultSet ? getPubById(resultSet, pubEntry.id) : undefined;
      if (pub) {
        pubArray.push({
          knowledgeLevel: kl,
          id: pubEntry.id,
          source: getPublicationSource(resultSet, pubEntry.infores, edge),
          support: pub.support || null,
          type: pub.type,
          url: pub.url
        });
      } else {
        pubArray.push(publicationObjectFromRef(pubEntry, kl, edge, provenanceCatalog));
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
    const trial = resultSet ? getTrialById(resultSet, id) : undefined;
    trialArray.push(trial ?? trialObjectFromRef(id));
  }

  return trialArray;
}

export interface FormattedMiscEvidence {
  id: string;
  url: string;
}

/**
 * Formats the misc evidence by removing duplicates and adding the id to the url.
 * If no url, get the url from the source
 * If item with that source url already exists, don't add it
 * @param miscEvidence {PublicationObject[]} - The misc evidence to format
 * @returns {FormattedMiscEvidence[]} - The formatted misc evidence
 */
export const formatMiscEvidence = (miscEvidence: PublicationObject[]): FormattedMiscEvidence[] => {
  const seen = new Set<string>();
  const formattedMiscEvidence: FormattedMiscEvidence[] = [];

  for (const item of miscEvidence) {
    const url = item.url || item.source?.url || '';
    if (!url || seen.has(url)) continue;

    seen.add(url);
    formattedMiscEvidence.push({
      id: item.id || url,
      url,
    });
  }

  return formattedMiscEvidence;
};

export interface GroupedSource {
  name: string;
  wiki?: string;
  urls: string[];
  infores: string[];
  knowledgeLevels: string[];
}

const addUnique = (list: string[], value: string | null | undefined): void => {
  if (value && !list.includes(value)) list.push(value);
};

/**
 * Collapses knowledge sources that share a name into one entry, keeping every
 * distinct URL, infores id, and knowledge level. Sources without a name are dropped.
 */
export const groupSourcesByName = (sources: Provenance[]): GroupedSource[] => {
  const byName = new Map<string, GroupedSource>();

  for (const src of sources) {
    const key = src.name?.trim();
    if (!key) continue;

    let group = byName.get(key);
    if (!group) {
      group = { name: key, urls: [], infores: [], knowledgeLevels: [] };
      byName.set(key, group);
    }

    if (!group.wiki && src.wiki) group.wiki = src.wiki;
    addUnique(group.knowledgeLevels, src.knowledge_level);
    addUnique(group.urls, src.url);
    addUnique(group.infores, src.infores);
  }

  return Array.from(byName.values());
};

/**
 * An edge's evidence in the form the evidence view shows and exports:
 * miscellaneous links deduplicated by URL and knowledge sources grouped by name.
 */
export interface EdgeEvidence {
  publications: PublicationObject[];
  clinicalTrials: TrialObject[];
  miscEvidence: FormattedMiscEvidence[];
  sources: GroupedSource[];
}

/**
 * Derives the displayable evidence for an edge from its raw collections, so the
 * tabs, the tables, and the CSV export all work from the same lists.
 */
export const buildEdgeEvidence = (raw: {
  publications: PublicationObject[];
  clinicalTrials: TrialObject[];
  miscEvidence: PublicationObject[];
  sources: Provenance[];
}): EdgeEvidence => ({
  publications: raw.publications,
  clinicalTrials: raw.clinicalTrials,
  miscEvidence: formatMiscEvidence(raw.miscEvidence),
  sources: groupSourcesByName(raw.sources),
});

/** True when the edge has at least one piece of evidence to show or export. */
export const hasEdgeEvidence = (evidence: EdgeEvidence): boolean =>
  evidence.publications.length > 0
  || evidence.clinicalTrials.length > 0
  || evidence.miscEvidence.length > 0
  || evidence.sources.length > 0;

/**
 * The edge's own supporting text for a publication, or null when the edge has
 * none worth showing. Support with blank text counts as missing, so callers
 * fall back to the publication's snippet instead of showing nothing.
 */
export const getPublicationEdgeSupport = (
  pub: PublicationObject,
  edge: ResultEdge | null,
): PublicationSupport | null => {
  const matchingEdgePub = pub.id && edge ? findPublicationOnEdge(pub.id, edge) : false;
  if (!matchingEdgePub || !matchingEdgePub.support?.text.trim())
    return null;
  return matchingEdgePub.support;
};

/**
 * Plain-text snippet for a publication, matching PublicationRow: prefer the
 * edge's support text, otherwise fall back to the publication snippet.
 */
export const getPublicationDisplaySnippet = (
  pub: PublicationObject,
  edge: ResultEdge | null,
): string => getPublicationEdgeSupport(pub, edge)?.text ?? pub.snippet ?? '';
