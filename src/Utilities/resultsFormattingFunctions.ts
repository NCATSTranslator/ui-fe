import { capitalizeAllWords, capitalizeFirstLetter, formatBiolinkEntity, isClinicalTrial, isFormattedEdgeObject, 
  isPublication, isPublicationObjectArray, mergeObjectArrays, combineObjectArrays } from './utilities';
import { cloneDeep } from "lodash";
import { score } from "./scoring";
import { RawResultsContainer, FormattedPathObject, PathObjectContainer, RawPathObject, SubgraphObject, FormattedNodeObject, 
  FormattedEdgeObject, EdgePredicateObject, RawEdge, RawNode } from '../Types/results';
import { rawAttachedPublications, PublicationObject, EvidenceCountsContainer } from '../Types/evidence';

export const hasSupport = (item: RawPathObject | FormattedEdgeObject | RawEdge | null): boolean => {
  return !!item && Array.isArray(item.support) && item.support.length > 0;
};
  
/**
 * Retrieves a publication from the results object based on its ID and returns a new publication object.
 * @param {string} id - The ID of the publication to retrieve.
 * @param {RawResultsContainer} results - The results object containing publication information.
 * @returns {Object} The new publication object.
*/
const getPubByID = (id: string , results: RawResultsContainer): PublicationObject | null => {
  if(results.publications[id] === undefined)
    return null;

  return cloneDeep(results.publications[id]);
}

/**
 * Retrieves a node from the results object based on its CURIE (Compact URI) and returns a new node object.
 * @param {string} curie - The CURIE of the node to retrieve.
 * @param {RawResultsContainer} results - The results object containing node information.
 * @returns {Object} The new node object.
*/
const getNodeByCurie = (curie: string | null, results: RawResultsContainer): RawNode | null => {
  if(curie === null || results.nodes[curie] === undefined)
    return null;

  const res = cloneDeep(results.nodes[curie]);

  if(res.synonyms && res.synonyms.length > 0)
    res.synonyms = null;

  if(res.sameAs && res.sameAs.length > 0)
    res.sameAs = null;

  res.id = curie;
  return res;
}

/**
 * Retrieves an edge from the results object based on its ID and returns a new edge object
 * with additional information about the edge's object and subject nodes.
 * @param {string} id - The ID of the edge to retrieve.
 * @param {RawResultsContainer} results - The results object containing edge information.
 * @returns {EdgeObject} The new edge object with object and subject nodes information.
*/
const getEdgeByID = (id: string, results: RawResultsContainer): RawEdge | null => {
  if(results.edges[id] === undefined)
    return null;
  let newEdge = cloneDeep(results.edges[id]);

  let tempObj = getNodeByCurie(newEdge.object, results);
  if(tempObj) {
    newEdge.object = {
      name: tempObj.names[0],
      id: tempObj.id,
    };
  }
  let tempSub = getNodeByCurie(newEdge.subject, results);
  if(tempSub) {
    newEdge.subject = {
      name: tempSub.names[0],
      id: tempSub.id
    };
  }

  return newEdge;
}

/**
 * Checks for node uniformity between two paths by comparing the names of nodes in each path.
 * @param {FormattedPathObject} pathOne - The first path to compare.
 * @param {FormattedPathObject} pathTwo - The second path to compare.
 * @param {boolean} respectKnowledgeLevel - Whether to consider knowledge level when comparing the two paths.
 * @returns {boolean} True if the nodes match, false otherwise.
*/
const checkForNodeUniformity = (pathOne: FormattedPathObject, pathTwo: FormattedPathObject, respectKnowledgeLevel: boolean): boolean => {
  // if the lengths of the paths are different, they cannot have the same nodes
  if(pathOne.subgraph.length !== pathTwo.subgraph.length)
    return false;

  let nodesMatch = true;

  for(const [i, item] of pathOne.subgraph.entries()) {
    const pathTwoItem = pathTwo.subgraph[i];
    // if we're at an odd index, it's a predicate
    if(i % 2 !== 0) {
      // check for same knowledge level. If different, return false
      if (
        respectKnowledgeLevel &&
        typeof item.provenance[0] !== 'string' &&
        typeof pathTwoItem.provenance[0] !== 'string' && 
        item.provenance[0]?.knowledge_level !== pathTwoItem.provenance[0]?.knowledge_level
      ) {
        nodesMatch = false;
        break; 
      }
    } else {
      // if the names of the nodes don't match, set nodesMatch to false
      if ('name' in item && 'name' in pathTwoItem && item.name !== pathTwoItem.name) {
        nodesMatch = false;
        break; 
      }
    }
  }

  return nodesMatch;
}

const removeDuplicatePubIds = (publications: rawAttachedPublications | null): rawAttachedPublications => {
  if (publications === null) return {};

  let uniquePublications: rawAttachedPublications = {};
  for (let key in publications) {
      if (publications.hasOwnProperty(key)) {
          const value = publications[key];
          if (Array.isArray(value)) {
              // If the value is an array, remove duplicates and assign
              uniquePublications[key] = Array.from(new Set(value));
          }
      }
  }

  return uniquePublications;
};

const getFormattedNode = (
  id: string, 
  index: number, 
  subgraph: SubgraphObject[], 
  results: RawResultsContainer): FormattedNodeObject | null => {
  let node = getNodeByCurie(id, results);
  if(node === null)
    return null;
  let name = (node.names) ? node.names[0]: '';
  let type = (node.types) ? node.types[0]: '';
  let desc = (node.descriptions) ? node.descriptions[0]: '';
  let category = (index === subgraph.length - 1) ? 'target' : 'object';
  let newNode: FormattedNodeObject = {
    id: id,
    category: category,
    name: name,
    type: type,
    description: desc,
    curies: node.curies,
    provenance: []
  };
  if(node.provenance !== undefined)
    newNode.provenance = node.provenance;

  return newNode;
}

// for all the publication IDs attached to a result, fill out the objects with
// the information from the publications list in the result
const fillOutPublications = (publicationIDs: rawAttachedPublications, results: RawResultsContainer) => {
  let filledPublicationsContainer: PublicationObject[] = [];
  for (let knowledgeLevelKey in publicationIDs) {
    if (publicationIDs.hasOwnProperty(knowledgeLevelKey)) {
      const knowledgeLevel = publicationIDs[knowledgeLevelKey];
      knowledgeLevel.forEach(rawPub => {
        let publication = getPubByID(rawPub.id, results);
        if(publication != null) {
          publication.id = rawPub.id;
          publication.support = rawPub.support;
          publication.knowledgeLevel = knowledgeLevelKey;
          filledPublicationsContainer.push(publication);
        }
      })
    }
  }
  return filledPublicationsContainer;
}

const getFormattedEdge = (id: string, results: RawResultsContainer, supportStack: any[]): FormattedEdgeObject => {
  supportStack.push(id);
  let edge = getEdgeByID(id, results);
  if(edge !== null)
    edge.id = id;
  let pred: EdgePredicateObject | null = null;

  if(edge !== null && edge.predicate) {
    let formattedPredicate = (typeof edge.predicate === "string") ? formatBiolinkEntity(edge.predicate) : formatBiolinkEntity(edge.predicate.predicate);
    pred = {
      predicate: formattedPredicate,
      url: edge?.predicate_url ? edge.predicate_url : null
    };
    edge.predicate = pred;
  }
  let rawPublications: rawAttachedPublications = removeDuplicatePubIds((edge !== null) ? edge.publications : null);
  let publications: PublicationObject[] = fillOutPublications(rawPublications, results);
  let newEdge: FormattedEdgeObject = {
    category: 'predicate',
    compressedEdges: [],
    id: id,
    predicates: (pred === null) ? null : [pred],
    edges: edge === null ? null : [edge],
    publications: publications,
    inferred: false
  };
  // if the edge has support, recursively call getFormattedPaths to fill out the support paths
  if(hasSupport(edge)) {
    const validSupport = (edge === null) ? [] : edge.support.filter(p => !supportStack.includes(p));
    if (validSupport.length > 0) {
      newEdge.support = getFormattedPaths(validSupport, results, supportStack);
    }
    newEdge.inferred = true;
  }

  newEdge.provenance = (edge !== null && edge.provenance !== undefined) ? edge.provenance : [];
  if((!Array.isArray(newEdge.provenance) && Object.keys(newEdge.provenance).length === 0))
    newEdge.provenance = [];

  supportStack.pop();
  return newEdge;
}

const checkPathForSupport = (path: FormattedPathObject): boolean => {
  const hasInferredEdge = (element: FormattedNodeObject | FormattedEdgeObject, index: number) => {
    return 'inferred' in element && element.inferred;
  };

  return !!path?.subgraph?.some(hasInferredEdge);
}

const getStringNameFromPath = (path: FormattedPathObject): string => {
  let stringName = "";
  for(const pathItem of path.subgraph) {
    if('name' in pathItem)
      stringName += `${pathItem.name} `;
    else if('predicates' in pathItem && !!pathItem.predicates && pathItem.predicates.length > 0)
      stringName += `${pathItem.predicates[0].predicate} `;
  }
  return stringName.trimEnd();
}

/**
 * Formats the raw path IDs into an array of formatted paths with node and edge information.
 * The formatted paths are extracted from the provided results object.
 * @param {string[]} rawPathIds - The raw path IDs to be formatted.
 * @param {RawResultsContainer} results - The results object containing paths and node/edge information.
 * @returns {PathObjectContainer[]} The formatted paths array.
*/
const getFormattedPaths = (rawPathIds: string[], results: RawResultsContainer, supportStack: string[]): PathObjectContainer[] => {
  let formattedPaths: PathObjectContainer[] = [];
  for(const id of rawPathIds) {
    let formattedPath = cloneDeep(results.paths[id]);
    if(formattedPath) {
      supportStack.push(id);
      for(const [i] of formattedPath.subgraph.entries()) {
        if(i % 2 === 0) {
          formattedPath.subgraph[i] = getFormattedNode(formattedPath.subgraph[i], i, formattedPath.subgraph, results);
        } else {
          formattedPath.subgraph[i] = getFormattedEdge(formattedPath.subgraph[i], results, supportStack);
        }
      }
      formattedPath.inferred = checkPathForSupport(formattedPath);
      formattedPath.stringName = getStringNameFromPath(formattedPath);
      let newPathObject: PathObjectContainer = {id: id, highlighted: false, path: formattedPath};
      formattedPaths.push(newPathObject);
      supportStack.pop();
    }
  }

  return formattedPaths;
}

/**
 * Merges and compresses the properties of two FormattedEdgeObject instances.
 *
 * This function handles the merging of various properties of the given `subgraphItem` and `nextEdgeItem`
 * if they share the same predicate and inferred properties. If they do not share these properties,
 * it will handle the merging or compression of predicates and compressed edges.
 *
 * @param {FormattedEdgeObject} subgraphItem - The primary edge object to be merged and compressed.
 * @param {FormattedEdgeObject} nextEdgeItem - The secondary edge object used for merging and compression.
 * @returns {FormattedEdgeObject} - The updated `subgraphItem` after merging and compression.
 **/
const handleEdgePropMergingAndCompression = (subgraphItem: FormattedEdgeObject, nextEdgeItem: FormattedEdgeObject): FormattedEdgeObject => {
  const predicatesMatch = subgraphItem.predicates?.[0]?.predicate === nextEdgeItem.predicates?.[0]?.predicate;
  const inferredMatch = subgraphItem.inferred === nextEdgeItem.inferred;

  if (predicatesMatch && inferredMatch) {
    // Merge provenance
    subgraphItem.provenance = mergeObjectArrays(subgraphItem.provenance, nextEdgeItem.provenance, "name");
    
    // Merge publications
    if (isPublicationObjectArray(subgraphItem.publications) && isPublicationObjectArray(nextEdgeItem.publications)) {
      subgraphItem.publications = mergeObjectArrays(subgraphItem.publications, nextEdgeItem.publications, "id");
    }
  } else {
    // Combine predicates
    subgraphItem.predicates = combineObjectArrays(subgraphItem.predicates, nextEdgeItem.predicates, "predicate");

    // Handle compressed edges
    const matchingCompressedEdgeIndex = subgraphItem.compressedEdges.findIndex(
      item => item.predicates?.[0]?.predicate === nextEdgeItem.predicates?.[0]?.predicate && item.inferred === nextEdgeItem.inferred
    );

    if (matchingCompressedEdgeIndex !== -1) {
      const compressedEdgeMatch = subgraphItem.compressedEdges[matchingCompressedEdgeIndex];
      compressedEdgeMatch.provenance = mergeObjectArrays(compressedEdgeMatch.provenance, nextEdgeItem.provenance, "name");

      if (isPublicationObjectArray(compressedEdgeMatch.publications) && isPublicationObjectArray(nextEdgeItem.publications)) {
        compressedEdgeMatch.publications = mergeObjectArrays(compressedEdgeMatch.publications, nextEdgeItem.publications, "id");
      }
    } else if (!subgraphItem.compressedEdges.some(item => item.id === nextEdgeItem.id)) {
      nextEdgeItem.predicate = nextEdgeItem.predicates ? nextEdgeItem.predicates[0].predicate : "";
      subgraphItem.compressedEdges.push(nextEdgeItem);
    }
  }

  // Combine edges
  if (subgraphItem.edges && nextEdgeItem.edges) {
    subgraphItem.edges = combineObjectArrays(subgraphItem.edges, nextEdgeItem.edges, "id");
  }

  // Combine support paths
  if (subgraphItem.support && nextEdgeItem.support) {
    subgraphItem.support = [...subgraphItem.support, ...nextEdgeItem.support].sort((a, b) => {
      const nameA = a.path.stringName ?? '';
      const nameB = b.path.stringName ?? '';
      return (nameB ? 1 : 0) - (nameA ? 1 : 0) || nameA.localeCompare(nameB);
    });
  }

  return subgraphItem;
};

/**
 * Compresses paths in the graph by merging consecutive paths with identical nodes.
 * The compressed paths are returned as a new array.
 * @param {PathObjectContainer[]} graph - The graph containing paths to be compressed.
 * @param {boolean} respectKnowledgeLevel - Whether or not to merge based on knowledge level.
 * @returns {PathObjectContainer[]} The compressed paths.
*/
const getCompressedPaths = (graph: PathObjectContainer[], respectKnowledgeLevel: boolean = true): PathObjectContainer[] => {
  let newCompressedPaths = [];
  let pathToDisplay = null
  for(const [i, pathObj] of graph.entries()) {
    if(pathToDisplay === null)
      pathToDisplay = cloneDeep(pathObj);
    let displayPath = false;
    let nextPath = (graph[i+1] !== undefined) ? graph[i+1] : null;
    // if all nodes are equal
    let nodesEqual = (nextPath) ? checkForNodeUniformity(pathToDisplay.path, nextPath.path, respectKnowledgeLevel) : false;

    for (const [i, subgraphItem] of pathToDisplay.path.subgraph.entries()) {
      if (displayPath) break;

      if (isFormattedEdgeObject(subgraphItem) && pathToDisplay && nextPath != null) {
        const nextEdgeItem = nextPath.path.subgraph[i] as FormattedEdgeObject;

        const matchingInferredStatus = nextEdgeItem?.inferred === undefined || subgraphItem.inferred === nextEdgeItem.inferred;
        if(!matchingInferredStatus) {
          displayPath = true;
          continue;
        }

        if (nextPath && nodesEqual && matchingInferredStatus) {
          if (!nextEdgeItem || subgraphItem.id === nextEdgeItem.id) continue;

          handleEdgePropMergingAndCompression(subgraphItem, nextEdgeItem);
        }

        if (subgraphItem.support && hasSupport(subgraphItem)) {
          subgraphItem.support = getCompressedPaths(subgraphItem.support, false);
        }
      }
    }
    // if there's no nextPath or the nodes are different, display the path
    if(!nextPath || !nodesEqual) {
      displayPath = true;
    }

    if(displayPath) {
      newCompressedPaths.push(pathToDisplay);
      pathToDisplay = null;
    }
  }

  return newCompressedPaths;
}

/**
 * Checks if the given itemID exists in the bookmarks set and returns its ID if found.
 *
 * @param {string} itemID - The ID of the item to check.
 * @param {any} bookmarksSet - The set of bookmark objects to search in.
 * @returns {string|null} Returns the ID of the matching item if found in bookmarksSet, otherwise returns false.
 */
const checkBookmarksForItem = (itemID: string, bookmarksSet: any): string | null => {
  if(bookmarksSet && bookmarksSet.size > 0) {
    for(let val of bookmarksSet) {
      if(val.object_ref === itemID) {
        return val.id;
      }
    }
  }
  return null;
}

/**
 * Checks if the given bookmarkID exists in the bookmarks set and if it has notes attached.
 *
 * @param {string} itemID - The ID of the item to check.
 * @param {any} bookmarksSet - The set of bookmark objects to search in.
 * @returns {boolean} Returns true if the matching item is found in bookmarksSet and has notes, otherwise returns false.
 */
const checkBookmarkForNotes = (bookmarkID: string | null, bookmarksSet: any): boolean => {
  if(bookmarkID === null)
    return false;
  if(bookmarksSet && bookmarksSet.size > 0) {
    for(let val of bookmarksSet) {
      if(val.id === bookmarkID) {
        return (val.notes.length > 0) ? true : false;
      }
    }
  }
  return false;
}

/**
 * Generates evidence counts for a provided list of paths
 *
 * @param {PathObjectContainer[]} paths - Array of paths to generate counts for.
 * @returns {EvidenceCountsContainer} Returns an EvidenceCountsContainer object with the requested counts.
 */
const calculateEvidenceCounts = (paths: PathObjectContainer[]): EvidenceCountsContainer => {
  const addPubsAndCTsToSets = (edge: FormattedEdgeObject, pubSet: Set<string>, ctSet: Set<string>, miscSet: Set<string>) => {
    if(isPublicationObjectArray(edge.publications)) {
      for(const pub of edge.publications) {
        if(isPublication(pub)) {
          if(!pubSet.has(pub.id))
            pubSet.add(pub.id);
        } else if(isClinicalTrial(pub)) {
          if(!ctSet.has(pub.id))
            ctSet.add(pub.id);
        } else {
          if(!miscSet.has(pub.url))
            miscSet.add(pub.url);
        }
      }
    }
  }
  const addSourcesToSet = (edge: FormattedEdgeObject, sourceSet: Set<string>) => {
    if(!!edge.provenance) {
      for(const source of edge.provenance) {
        if(!sourceSet.has(source.name))
          sourceSet.add(source.name);
      }
    }
  }

  let allPubs: Set<string> = new Set<string>();
  let allCTs: Set<string> = new Set<string>();
  let allSources: Set<string> = new Set<string>();
  let allMisc: Set<string> = new Set<string>();
  for(const path of paths) {
    for(const subgraphItem of path.path.subgraph) {
      if(isFormattedEdgeObject(subgraphItem)) {
        // add edge pubs and sources to counts
        addPubsAndCTsToSets(subgraphItem, allPubs, allCTs, allMisc);
        addSourcesToSet(subgraphItem, allSources);
        if(hasSupport(subgraphItem) && subgraphItem.support !== undefined) {
          for(const supportPath of subgraphItem.support){
            for(const supportSubgraphItem of supportPath.path.subgraph){
              if(isFormattedEdgeObject(supportSubgraphItem)) {
                // add support edge pubs and sources to counts
                addPubsAndCTsToSets(supportSubgraphItem, allPubs, allCTs, allMisc);
                addSourcesToSet(supportSubgraphItem, allSources);
              }
            }
          }
        }
      }
    }
  }
  return { 
    clinicalTrialCount: allCTs.size,
    miscCount: allMisc.size, 
    publicationCount: allPubs.size, 
    sourceCount: allSources.size 
  };
}

/**
 * Generates summarized results from the given results array. It processes each individual result item
 * to extract relevant information such as node names, descriptions, FDA approval status, paths, evidence,
 * scores, and tags. The summarized results are returned as an array.
 * @param {RawResultsContainer} results - The results array to be summarized.
 * @param {number} confidenceWeight - value representing a parameter for weighted scoring
 * @param {number} noveltyWeight - value representing a parameter for weighted scoring
 * @param {number} clinicalWeight - value representing a parameter for weighted scoring
 * @param {Set} bookmarks - Set of bookmarked items for a given query
 * @returns {Array} The summarized results array.
*/
export const getSummarizedResults = (results: RawResultsContainer, confidenceWeight: number, noveltyWeight: number, clinicalWeight: number, bookmarks: any = null) => {
  if (results === null || results === undefined)
    return [];

  let newSummarizedResults = [];

  // for each individual result item
  for(const item of results.results) {
    // Get the object node
    let objectNode = getNodeByCurie(item.object, results);
    let objectNodeName = (objectNode !== null) ? capitalizeAllWords(objectNode.names[0]) : "";
    // Get the subject node
    let subjectNode = getNodeByCurie(item.subject, results);
    let subjectNodeName = (subjectNode !== null) ? capitalizeAllWords(subjectNode.names[0]) : "";
    // Get the subject node's description
    let description = (subjectNode !== null && subjectNode.descriptions) ? subjectNode.descriptions[0] : '';
    // Get the subject node's fda approval status
    let fdaInfo = (subjectNode !== null && subjectNode.fda_info) ? subjectNode.fda_info : false;
    // Get a list of properly formatted paths (turn the path ids into their actual path objects)
    let formattedPaths = getFormattedPaths(item.paths, results, []);
    let compressedPaths = getCompressedPaths(formattedPaths, true);
    let evidenceCounts = calculateEvidenceCounts(formattedPaths);
    let itemName = (item.drug_name !== null) ? capitalizeFirstLetter(item.drug_name) : capitalizeAllWords(subjectNodeName);
    let tags = (item.tags !== null) ? Object.keys(item.tags) : [];
    let itemID = item.id;
    let bookmarkID = (bookmarks === null) ? null : checkBookmarksForItem(itemID, bookmarks);
    let bookmarked = (!bookmarkID) ? false : true;
    let hasNotes =  checkBookmarkForNotes(bookmarkID, bookmarks);
    let type = (subjectNode !== null && subjectNode.types.length > 0) ? subjectNode.types[0] : [];
    let formattedItem = {
      id: itemID,
      subjectNode: subjectNode,
      type: type,
      name: itemName,
      paths: formattedPaths,
      compressedPaths: compressedPaths,
      object: objectNodeName,
      description: description,
      evidenceCounts: evidenceCounts,
      fdaInfo: fdaInfo,
      scores: item.scores,
      score: score(item.scores, confidenceWeight, noveltyWeight, clinicalWeight),
      tags: tags,
      rawResult: item,
      bookmarked: bookmarked,
      bookmarkID: bookmarkID,
      hasNotes: hasNotes
    }
    newSummarizedResults.push(formattedItem);
  }
  return newSummarizedResults;
}

export const getFormattedEdgeLabel = (subjectName: string, predicateName: string, objectName: string): string => {
  return `${subjectName}|${predicateName}|${objectName}`;
}

export const getUrlByType = (publicationID: string, type: string): string | null => {
  let url = null;
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

export const getTypeFromPub = (publicationID: string): string => {
  if(publicationID.toLowerCase().includes("pmid"))
    return "PMID";
  if(publicationID.toLowerCase().includes("pmc"))
    return "PMC";
  if(publicationID.toLowerCase().includes("clinicaltrials"))
    return "NCT";
  return "other";
}

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
