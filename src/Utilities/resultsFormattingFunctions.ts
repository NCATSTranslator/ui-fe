import { capitalizeAllWords, capitalizeFirstLetter, formatBiolinkEntity, mergeObjects, removeDuplicateObjects } from './utilities';
import { cloneDeep } from "lodash";
import { score } from "./scoring";
import { RawResults, FormattedPathObject, PathObjectContainer, RawPathObject, SubgraphObject, FormattedNodeObject, 
  FormattedEdgeObject, ResultItem, EdgePredicateObject, RawEdge, RawNode,  } from '../Types/results';
import { EvidenceContainer, EvidenceObjectContainer, EvidenceItem,
  SourceObject, PublicationObject, PublicationsList } from '../Types/evidence';

export const hasSupport = (item: RawPathObject | FormattedEdgeObject | RawEdge | null): boolean => {
  return !!item && Array.isArray(item.support) && item.support.length > 0;
};
  
/**
 * Formats the evidence information for the provided paths by extracting and organizing publications and sources.
 * @param {PathObjectContainer[]} paths - The paths for which evidence is being formatted.
 * @param {RawResult[]} results - The results object.
 * @returns {EvidenceContainer} The formatted evidence object containing publications, sources, distinct sources, and length.
*/
const getFormattedEvidence = (paths: PathObjectContainer[], results: RawResults): EvidenceContainer => {
  // fix this, come up with better type for obj and constructor 
  const formatObj = (obj: object, getId: (item: any) => string, item: EvidenceItem, constructor: Function, container: EvidenceObjectContainer) => {
    const id = getId(obj);
    let evidenceObj: EvidenceItem = container[id];
    if (evidenceObj === undefined) {
      evidenceObj = constructor(obj);
      // evidenceObj.edges = {};
      container[id] = evidenceObj;
    }
    if (!evidenceObj.edges) 
      evidenceObj.edges = {};

    const eid: string = item.edges[0].id;
    const edgeLabel: string = (
      item.edges[0].subject !== undefined && 
      item.edges[0].predicate !== undefined && 
      item.edges[0].object !== undefined)
      ? `${item.edges[0].subject.name}|${item.edges[0].predicate.predicate}|${item.edges[0].object.name}`
      : "";
    evidenceObj.edges[eid] = {
      id: eid,
      label: edgeLabel
    };
  }
  // fix this, come up with better type for objs, obj, and constructor
  const formatEvidenceObjs = (objs: {[key: string]: any[]}, getId: (item: any) => string, item: EvidenceItem, constructor: Function, container: EvidenceObjectContainer) => {
    for (const objArray of Object.values(objs)) {
      if (!Array.isArray(objArray)) {
        formatObj(objArray, getId, item, constructor, container);
        continue;
      }
  
      for (const obj of objArray) {
        formatObj(obj, getId, item, constructor, container);
      }
    }
  };

  // fix this, better type for publications
  const formatPublications = (publications: any, item: EvidenceItem, container: EvidenceObjectContainer) => {
    formatEvidenceObjs(
      publications,
      (id: string) => { return id; },
      item,
      (id: string) => {
        const publication = getPubByID(id, results);
        if(publication !== null) {
          publication.id = id;
          publication.journal = '';
          publication.title = '';
        }
        return publication;
      },
      container);
  };

  const formatSources = (sources: any, item: EvidenceItem, container: EvidenceObjectContainer) => {
    formatEvidenceObjs(
      sources,
      (src: SourceObject) => { 
        if(item?.edges[0]?.subject === undefined || item?.edges[0]?.object === undefined)
          return "";
        return `${item.edges[0].subject.name}${src.name}${item.edges[0].object.name}`; 
      },
      item,
      (src: SourceObject) => { return src; },
      container);
  };

  const processSourcesAndPublications = (paths: PathObjectContainer[] | undefined, formattedPublications: any, formattedSources: any) => {
    if(paths === undefined)
      return;
    for(const path of paths) {
      for(const item of path.path.subgraph) {
        if('publications' in item) {
          formatPublications(item.publications, item, formattedPublications);
          formatSources(item.provenance, item, formattedSources);
          // recursively call processSourcesAndPublications to fill out pubs and sources from support edges
          if(hasSupport(item))
            processSourcesAndPublications(item.support, formattedPublications, formattedSources);
        }
      }
    }
  }

  const formattedPublications = {};
  const formattedSources = {};
  processSourcesAndPublications(paths, formattedPublications, formattedSources);

  const publications: PublicationsList = formattedPublications;
  const sources: SourceObject[] = Object.values(formattedSources);
  const distinctSources: {[key: string]: SourceObject;} = {};
  for(const source of sources) {
    distinctSources[source.name] = source;
  }

  const evidenceObject: EvidenceContainer = {
    publications: publications,
    sources: sources,
    distinctSources: Object.values(distinctSources),
    length: sources.length + Object.values(publications).length
  };
  return evidenceObject;
}

/**
 * Retrieves a publication from the results object based on its ID and returns a new publication object.
 * @param {string} id - The ID of the publication to retrieve.
 * @param {RawResults} results - The results object containing publication information.
 * @returns {Object} The new publication object.
*/
const getPubByID = (id: string , results: RawResults): PublicationObject | null => {
  if(results.publications[id] === undefined)
    return null;

  return cloneDeep(results.publications[id]);
}

/**
 * Retrieves a node from the results object based on its CURIE (Compact URI) and returns a new node object.
 * @param {string} curie - The CURIE of the node to retrieve.
 * @param {RawResults} results - The results object containing node information.
 * @returns {Object} The new node object.
*/
const getNodeByCurie = (curie: string | null, results: RawResults): RawNode | null => {
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
 * @param {RawResults} results - The results object containing edge information.
 * @returns {EdgeObject} The new edge object with object and subject nodes information.
*/
const getEdgeByID = (id: string, results: RawResults): RawEdge | null => {
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

const removeDuplicatePubIds = (publications: {[key: string]: string[]} | null): {[key: string]: string[]} => {
  if (publications === null) return {};

  let uniquePublications: {[key: string]: string[]} = {};

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
  results: RawResults): FormattedNodeObject | null => {
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

const getFormattedEdge = (id: string, results: RawResults, supportStack: any[]): FormattedEdgeObject => {
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
  let publications = removeDuplicatePubIds((edge !== null) ? edge.publications : null);
  let newEdge: FormattedEdgeObject = {
    category: 'predicate',
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
 * @param {RawResults} results - The results object containing paths and node/edge information.
 * @returns {PathObjectContainer[]} The formatted paths array.
*/
const getFormattedPaths = (rawPathIds: string[], results: RawResults, supportStack: string[]): PathObjectContainer[] => {
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

    // loop through the current path's items
    for (const [i, subgraphItem] of pathObj.path.subgraph.entries()) {
      if(displayPath) {
        break;
      }
      // confirm we're looking at an edge, ignore nodes
      if(
        'predicates' in subgraphItem && 
        'edges' in subgraphItem && 
        'support' in subgraphItem && 
        'publications' in subgraphItem && 
        pathToDisplay &&
        nextPath != null
        ) {
        let edgeItem = subgraphItem as FormattedEdgeObject;
        let nextEdgeItem = nextPath.path.subgraph[i] as FormattedEdgeObject;
        // if theres another path after the current one, and the nodes of each are equal
        if(nextPath && nodesEqual) {
  
          if(!nextPath.path.subgraph[i])
            continue;
  
          // add the contents of the nextPath's edge object to the pathToDisplay edge's object
          // combine predicates (uses set to prevent duplicates)
          let combinedPredicates = [];
          if(!!edgeItem.predicates){
            combinedPredicates.push(edgeItem.predicates);
          }
          if(!!nextEdgeItem.predicates){
            combinedPredicates.push(nextEdgeItem.predicates);
          }
          edgeItem.predicates = removeDuplicateObjects(combinedPredicates, 'predicate');
          // edges
          if(edgeItem.edges !== null && nextEdgeItem.edges !== null)
            edgeItem.edges = [...edgeItem.edges, ...nextEdgeItem.edges];
          // support paths
          if(edgeItem.support && nextEdgeItem.support) {
            edgeItem.support = [...edgeItem.support, ...nextEdgeItem.support].sort((a, b) => {
              const nameA = a.path.stringName ?? '';
              const nameB = b.path.stringName ?? '';
              // Compare the existence of stringName, then sort alphabetically
              return (nameB ? 1 : 0) - (nameA ? 1 : 0) || nameA.localeCompare(nameB);
            });    
          }
          // provenance
          edgeItem.provenance = [...edgeItem.provenance, ...nextEdgeItem.provenance];
          // publications
          edgeItem.publications = mergeObjects(edgeItem.publications, nextEdgeItem.publications);
        }
        // compress support paths for the edge, if they exist
        if(!!edgeItem.support && hasSupport(edgeItem)) {
          edgeItem.support = getCompressedPaths(
            edgeItem.support.sort((a: PathObjectContainer, b: PathObjectContainer) => {
              const nameA = a.path.stringName ?? '';
              const nameB = b.path.stringName ?? '';
            
              // Sort by the existence of stringName, then alphabetically
              return (nameB ? 1 : 0) - (nameA ? 1 : 0) || nameA.localeCompare(nameB);
            }),
            false
          );
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
// fix this, improve bookmarksSet type
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

// fix this, improve bookmarksSet type
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
 * Generates summarized results from the given results array. It processes each individual result item
 * to extract relevant information such as node names, descriptions, FDA approval status, paths, evidence,
 * scores, and tags. The summarized results are returned as an array.
 * @param {RawResults} results - The results array to be summarized.
 * @param {number} confidenceWeight - value representing a parameter for weighted scoring
 * @param {number} noveltyWeight - value representing a parameter for weighted scoring
 * @param {number} clinicalWeight - value representing a parameter for weighted scoring
 * @param {Set} bookmarks - Set of bookmarked items for a given query
 * @returns {Array} The summarized results array.
*/
// fix this, improve bookmarks type
export const getSummarizedResults = (results: RawResults, confidenceWeight: number, noveltyWeight: number, clinicalWeight: number, bookmarks: any = null) => {
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
    // let compressedPaths = formattedPaths;
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
      evidence: getFormattedEvidence(formattedPaths, results),
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
      url = `https://clinicaltrials.gov/ct2/show/${publicationID.replace("clinicaltrials:", "")}`
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

/**
 * Extracts and formats the evidence data from a given result object.
 *
 * This function parses through the evidence information within the result object,
 * extracting distinct sources, general sources, and formatting publication data.
 * It handles cases where certain pieces of evidence may not be present and formats
 * the publications into a consumable array of objects.
 *
 * @param {ResultsItem} result - The result object from which to extract evidence.
 * @returns {EvidenceContainer} An evidenceObject containing arrays of distinctSources, sources,
 *                   and a publications array populated with formatted evidence data.
 *                   Returns an empty object if the input is invalid or lacks evidence.
 */
export const getEvidenceFromResult = (result: ResultItem): EvidenceContainer => {
  let evidenceObject: EvidenceContainer = {
    distinctSources: [],
    sources: [],
    publications: [],
  };
  if(!result || !result.evidence)
    return evidenceObject;

  evidenceObject.distinctSources = (result.evidence.distinctSources) ? result.evidence.distinctSources : [];
  evidenceObject.sources = (result.evidence.sources) ? result.evidence.sources : [];

  const pubIds = new Set();
  // fix this, improve typing for all params
  const addItemToPublications = (item: any, items: any, arr: any) => {
    if (!!item && !items.has(item.id)) {
        items.add(item.id);
        arr.push(item);
    }
  }

  const createNewPub = (result: ResultItem, pubID: string, edgeObject: FormattedEdgeObject, key: string) => {
    let newPub;
    let type;
    // this is to deal with the old bookmark format, which removed publications from the result's evidence obj
    if(!result.evidence.publications) {
      type = getTypeFromPub(pubID);
      newPub = {
        type: getTypeFromPub(pubID),
        url: getUrlByType(pubID, type),
        id: pubID,
        journal: '',
        pubdate: '',
        snippet: '',
        title: '',
        knowledgeLevel: key,
        edges: (edgeObject.edges == null) ? [] : edgeObject.edges.reduce((obj, item) => {
            obj[item.id] = item;
            return obj;
        }, {}),
        source: {
          name: "unknown",
          url: null,
        }
      }
    // this is for the current format
    } else {
      newPub = result.evidence.publications[pubID];
      if(!!newPub) {
        newPub.knowledgeLevel = key;
        type = getTypeFromPub(pubID);
        newPub.url = getUrlByType(pubID, type);
        newPub.source.name = formatPublicationSourceName(newPub.source.name);
      } else {
        console.log("pubID not found within result publications list: ", pubID, result.evidence.publications);
      }
    }
    return newPub;
  }

  const fillInPublications = (edgeItem: FormattedEdgeObject, result: ResultItem, evidenceObj: EvidenceContainer) => {
    // if subgraphItem.publications is an array, we're in the Workspace dealing with an old bookmark
    if(Array.isArray(edgeItem.publications)) {
      for(const pubID of edgeItem.publications) {
        let knowledgeLevel = ""
        let newPub = createNewPub(result, pubID, edgeItem, knowledgeLevel);
        addItemToPublications(newPub, pubIds, evidenceObj.publications);
      }
      // if it's not it's an object, and we're on the results page
    } else {
      // key here is the knowledge level, i.e. "trusted", "ml", etc
      if(!!edgeItem.publications) {
        Object.keys(edgeItem.publications).forEach(key => {
          for(const pubID of edgeItem.publications[key]) {
            if(typeof pubID === 'string') {
              let newPub = createNewPub(result, pubID, edgeItem, key);
              addItemToPublications(newPub, pubIds, evidenceObj.publications);
            }
          }
        })
      }
    }
  }

  const loopPathsAndFillInPubs = (result: ResultItem, paths: PathObjectContainer[], evidenceObj: EvidenceContainer) => {
    for(const path of paths) {
      for(const subgraphItem of path.path.subgraph) {
        if(!('predicates' in subgraphItem))
          continue;
        let edgeItem = subgraphItem as FormattedEdgeObject;
        fillInPublications(edgeItem, result, evidenceObj);
        if(edgeItem.support !== undefined && hasSupport(edgeItem)) {
          loopPathsAndFillInPubs(result, edgeItem.support, evidenceObj);
        }
      }
    }
  }

  loopPathsAndFillInPubs(result, result.compressedPaths, evidenceObject);

  return evidenceObject;
}
