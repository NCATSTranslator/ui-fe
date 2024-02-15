import { capitalizeAllWords, capitalizeFirstLetter, formatBiolinkEntity, mergeObjects } from './utilities';
import { cloneDeep } from "lodash";
import { score } from "../Utilities/scoring";

export const hasSupport = (item) => {
  return (item?.support && Array.isArray(item.support) && item.support.length > 0);
}

/**
 * Formats the evidence information for the provided paths by extracting and organizing publications and sources.
 * @param {Array} paths - The paths for which evidence is being formatted.
 * @param {Object} results - The results object containing publication and source information.
 * @returns {Object} The formatted evidence object containing publications, sources, distinct sources, and length.
*/
const getFormattedEvidence = (paths, results) => {
  const formatObj = (obj, getId, item, constructor, container) => {
    const id = getId(obj);
    let evidenceObj = container[id];
    if (evidenceObj === undefined) {
      evidenceObj = constructor(obj);
      evidenceObj.edges = {};
      container[id] = evidenceObj;
    }

    const eid = item.edges[0].id;
    evidenceObj.edges[eid] = {
      label : `${item.edges[0].subject.name}|${item.edges[0].predicate}|${item.edges[0].object.name}`
    };
  }

  const formatEvidenceObjs = (objs, getId, item, constructor, container) => {
    Object.keys(objs).forEach(key => {
      if(!Array.isArray(objs[key])) {
        formatObj(objs[key], getId, item, constructor, container)
        return;
      }

      for(const obj of objs[key]) {
        formatObj(obj, getId, item, constructor, container)
      }
    })
  };

  const formatPublications = (publications, item, container) => {
    formatEvidenceObjs(
      publications,
      (id) => { return id; },
      item,
      (id) => {
        const publication = getPubByID(id, results);
        publication.id = id;
        publication.journal = '';
        publication.title = '';
        return publication;
      },
      container);
  };

  const formatSources = (sources, item, container) => {
    formatEvidenceObjs(
      sources,
      (src) => { return `${item.edges[0].subject.name}${src.name}${item.edges[0].object.name}`; },
      item,
      (src) => { return src; },
      container);
  };

  const processSourcesAndPublications = (paths, formattedPublications, formattedSources) => {
    for(const path of paths) {
      for(const item of path.path.subgraph) {
        if(item.category === 'predicate') {
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

  const publications = formattedPublications;
  const sources = Object.values(formattedSources);
  const distinctSources = {};
  sources.forEach((src) => {
    distinctSources[src.name] = src;
  });

  return {
    publications: publications,
    sources: sources,
    distinctSources: Object.values(distinctSources),
    length: sources.length + publications.length
  };
}

/**
 * Retrieves a publication from the results object based on its ID and returns a new publication object.
 * @param {string} id - The ID of the publication to retrieve.
 * @param {Object} results - The results object containing publication information.
 * @returns {Object} The new publication object.
*/
const getPubByID = (id, results) => {
  if(results.publications[id] === undefined)
    return {};

  return cloneDeep(results.publications[id]);
}

/**
 * Retrieves a node from the results object based on its CURIE (Compact URI) and returns a new node object.
 * @param {string} curie - The CURIE of the node to retrieve.
 * @param {Object} results - The results object containing node information.
 * @returns {Object} The new node object.
*/
const getNodeByCurie = (curie, results) => {
  if(results.nodes[curie] === undefined)
    return {};

  // const maxCurieCount = 5;

  const res = cloneDeep(results.nodes[curie]);
  // if(res.curies.length > maxCurieCount)
  //   res.curies = res.curies.slice(0, maxCurieCount);

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
 * @param {Object} results - The results object containing edge information.
 * @returns {Object} The new edge object with object and subject nodes information.
*/
const getEdgeByID = (id, results) => {
  if(results.edges[id] === undefined)
    return {};
  let newEdge = cloneDeep(results.edges[id]);

  let tempObj = getNodeByCurie(newEdge.object, results);
  newEdge.object = {
    name: tempObj.names[0],
    id: tempObj.id,
  };
  let tempSub = getNodeByCurie(newEdge.subject, results);

  newEdge.subject = {
    name: tempSub.names[0],
    id: tempSub.id
  };

  return newEdge;
}

/**
 * Checks for node uniformity between two paths by comparing the names of nodes in each path.
 * @param {Array} pathOne - The first path to compare.
 * @param {Array} pathTwo - The second path to compare.
 * @returns {boolean} True if the nodes match, false otherwise.
*/
const checkForNodeUniformity = (pathOne, pathTwo, respectKnowledgeLevel) => {
  // if the lengths of the paths are different, they cannot have the same nodes
  if(pathOne.subgraph.length !== pathTwo.subgraph.length)
    return false;

  let nodesMatch = true;

  for(const [i, item] of pathOne.subgraph.entries()) {
    // if we're at an odd index, it's a predicate
    if(i % 2 !== 0) {
      // check for same knowledge level. If different, return false
      if(respectKnowledgeLevel && item.provenance[0]?.knowledge_level !== pathTwo.subgraph[i].provenance[0]?.knowledge_level)
        nodesMatch = false;
    } else {
      // if the names of the nodes don't match, set nodesMatch to false
      if(item.name !== pathTwo.subgraph[i].name)
        nodesMatch = false;
    }
  }

  return nodesMatch;
}

const removeDuplicatePubIds = (publications) => {
  let uniquePublications = {};

  for (let key in publications) {
      if (publications.hasOwnProperty(key) && Array.isArray(publications[key])) {
          uniquePublications[key] = Array.from(new Set(publications[key]));
      }
  }

  return uniquePublications;
}

const getFormattedNode = (id, index, subgraph, results) => {
  let node = getNodeByCurie(id, results);
  let name = (node.names) ? node.names[0]: '';
  let type = (node.types) ? node.types[0]: '';
  let desc = (node.descriptions) ? node.descriptions[0]: '';
  let category = (index === subgraph.length - 1) ? 'target' : 'object';
  let newNode =  {
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

const getFormattedEdge = (id, results, supportStack) => {
  supportStack.push(id);
  let edge = getEdgeByID(id, results);
  edge.id = id;
  let pred = '';

  if(edge.predicate) {
    pred = formatBiolinkEntity(edge.predicate);
    edge.predicate = pred;
  }
  let publications = removeDuplicatePubIds(edge.publications);
  let newEdge = {
    category: 'predicate',
    id: id,
    predicates: [pred],
    edges: [edge],
    publications: publications,
    inferred: false
  };
  // if the edge has support, recursively call getFormattedPaths to fill out the support paths
  if(hasSupport(edge)) {
    const validSupport = edge.support.filter(p => !supportStack.includes(p));
    if (validSupport.length > 0) {
      newEdge.support = getFormattedPaths(validSupport, results, supportStack);
    }
    newEdge.inferred = true;
  }

  newEdge.provenance = (edge.provenance !== undefined) ? edge.provenance : [];
  if((!Array.isArray(newEdge.provenance) && Object.keys(newEdge.provenance).length === 0))
    newEdge.provenance = [];

  supportStack.pop();
  return newEdge;
}

const checkPathForSupport = (path) => {
  const hasInferredEdge = (element, index) => {  return index % 2 !== 0 && element.inferred};
  return path?.subgraph?.some(hasInferredEdge);
}

const getStringNameFromPath = (path) => {
  let stringName = "";
  for(const [i, pathItem] of path.subgraph.entries()) {
    if(i % 2 === 0)
      stringName += `${pathItem.name} `;
    else
      stringName += `${pathItem.predicates[0]} `;
  }
  return stringName.trimEnd();
}

/**
 * Formats the raw path IDs into an array of formatted paths with node and edge information.
 * The formatted paths are extracted from the provided results object.
 * @param {Array} rawPathIds - The raw path IDs to be formatted.
 * @param {Object} results - The results object containing paths and node/edge information.
 * @returns {Array} The formatted paths array.
*/
const getFormattedPaths = (rawPathIds, results, supportStack) => {
  let formattedPaths = [];
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
      formattedPaths.push({id: id, highlighted: false, path: formattedPath});
      supportStack.pop();
    }
  }

  return formattedPaths;
}

/**
 * Compresses paths in the graph by merging consecutive paths with identical nodes.
 * The compressed paths are returned as a new array.
 * @param {Array} graph - The graph containing paths to be compressed.
 * @param {Array} respectKnowledgeLevel - Whether or not to merge based on knowledge level.
 * @returns {Array} The compressed paths.
*/
const getCompressedPaths = (graph, respectKnowledgeLevel = true) => {
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
    for(const [i] of pathObj.path.subgraph.entries()) {
      if(displayPath) {
        break;
      }
      // if we're at an even index, it's a node, so skip it
      if(i % 2 === 0)
      continue;

      // if theres another path after the current one, and the nodes of each are equal
      if(nextPath && nodesEqual) {

        if(!nextPath.path.subgraph[i])
          continue;

        // add the contents of the nextPath's edge object to the pathToDisplay edge's object
        // combine predicates (uses set to prevent duplicates)
        pathToDisplay.path.subgraph[i].predicates = Array.from(new Set([...pathToDisplay.path.subgraph[i].predicates, ...nextPath.path.subgraph[i].predicates]));
        // edges
        pathToDisplay.path.subgraph[i].edges = [...pathToDisplay.path.subgraph[i].edges, ...nextPath.path.subgraph[i].edges];
        // support paths
        if(pathToDisplay.path.subgraph[i].support && nextPath.path.subgraph[i].support) {
          pathToDisplay.path.subgraph[i].support = [...pathToDisplay.path.subgraph[i].support, ...nextPath.path.subgraph[i].support].sort((a, b) => !a.path.stringName - !b.path.stringName || a.path.stringName.localeCompare(b.path.stringName));
        }
        // provenance
        pathToDisplay.path.subgraph[i].provenance = [...pathToDisplay.path.subgraph[i].provenance, ...nextPath.path.subgraph[i].provenance];
        // publications
        pathToDisplay.path.subgraph[i].publications = mergeObjects(pathToDisplay.path.subgraph[i].publications, nextPath.path.subgraph[i].publications);
      }
      // compress support paths for the edge, if they exist
      if(hasSupport(pathToDisplay?.path?.subgraph[i]))
        pathToDisplay.path.subgraph[i].support = getCompressedPaths(pathToDisplay.path.subgraph[i].support.sort((a, b) => !a.path.stringName - !b.path.stringName || a.path.stringName.localeCompare(b.path.stringName)), false);
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
 * @param {string|number} itemID - The ID of the item to check.
 * @param {Set<Object>} bookmarksSet - The set of bookmark objects to search in.
 * @returns {string|number|boolean} Returns the ID of the matching item if found in bookmarksSet, otherwise returns false.
 */
const checkBookmarksForItem = (itemID, bookmarksSet) => {
  if(bookmarksSet && bookmarksSet.size > 0) {
    for(let val of bookmarksSet) {
      if(val.object_ref === itemID) {
        return val.id;
      }
    }
  }
  return false;
}

const checkBookmarkForNotes = (bookmarkID, bookmarksSet) => {
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
 * @param {Array} results - The results array to be summarized.
 * @param {Set} bookmarks - Set of bookmarked items for a given query
 * @param {number} confidenceWeight - value representing a parameter for weighted scoring
 * @param {number} noveltyWeight - value representing a parameter for weighted scoring
 * @param {number} clinicalWeight - value representing a parameter for weighted scoring
 * @returns {Array} The summarized results array.
*/
export const getSummarizedResults = (results, confidenceWeight, noveltyWeight, clinicalWeight, bookmarks = null) => {
  if (results === null || results === undefined)
    return [];

  let newSummarizedResults = [];

  // for each individual result item
  for(const item of results.results) {
    // Get the object node's name
    let objectNodeName = capitalizeAllWords(getNodeByCurie(item.object, results).names[0]);
    // Get the subject node's name
    let subjectNode = getNodeByCurie(item.subject, results);
    // Get the subject node's description
    let description = (subjectNode.descriptions) ? subjectNode.descriptions[0] : '';
    // Get the subject node's fda approval status
    let fdaInfo = (subjectNode.fda_info) ? subjectNode.fda_info : false;
    // Get a list of properly formatted paths (turn the path ids into their actual path objects)
    let formattedPaths = getFormattedPaths(item.paths, results, []);
    let compressedPaths = getCompressedPaths(formattedPaths, true);
    // let compressedPaths = formattedPaths;
    let itemName = (item.drug_name !== null) ? capitalizeFirstLetter(item.drug_name) : capitalizeAllWords(subjectNode.names[0]);
    let tags = (item.tags !== null) ? Object.keys(item.tags) : [];
    let itemID = item.id;
    let bookmarkID = (bookmarks === null) ? false : checkBookmarksForItem(itemID, bookmarks);
    let bookmarked = (!bookmarkID) ? false : true;
    let hasNotes = checkBookmarkForNotes(bookmarkID, bookmarks);
    let formattedItem = {
      id: itemID,
      subjectNode: subjectNode,
      type: subjectNode.types[0],
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

export const getFormattedEdgeLabel = (subjectName, predicateName, objectName) => {
  return `${subjectName}|${predicateName}|${objectName}`;
}

export const getUrlByType = (publicationID, type) => {
  let url = false;
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

export const getTypeFromPub = (publicationID) => {
  if(publicationID.toLowerCase().includes("pmid"))
    return "PMID";
  if(publicationID.toLowerCase().includes("pmc"))
    return "PMC";
  if(publicationID.toLowerCase().includes("clinicaltrials"))
    return "NCT";
  return "other";
}

export const formatPublicationSourceName = (sourceName) => {
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
 * @param {Object} result - The result object from which to extract evidence.
 * @returns {Object} An evidenceObject containing arrays of distinctSources, sources,
 *                   and a publications array populated with formatted evidence data.
 *                   Returns an empty object if the input is invalid or lacks evidence.
 */
export const getEvidenceFromResult = (result) => {
  let evidenceObject = {};
  if(!result || !result.evidence)
    return evidenceObject;

  evidenceObject.distinctSources = (result.evidence.distinctSources) ? result.evidence.distinctSources : [];
  evidenceObject.sources = (result.evidence.sources) ? result.evidence.sources : [];
  evidenceObject.publications = [];

  const pubIds = new Set();
  const addItemToPublications = (item, items, arr) => {
    if (!items.has(item.id)) {
        items.add(item.id);
        arr.push(item);
    }
  }

  const createNewPub = (result, pubID, subgraphItem, key) => {
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
        edges: subgraphItem.edges.reduce((obj, item) => {
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
      newPub.knowledgeLevel = key;
      type = getTypeFromPub(pubID);
      newPub.url = getUrlByType(pubID, type);
      newPub.source.name = formatPublicationSourceName(newPub.source.name);
    }
    return newPub;
  }

  const fillInPublications = (subgraphItem, result, evidenceObj) => {
    // if subgraphItem.publications is an array, we're in the Workspace dealing with an old bookmark
    if(Array.isArray(subgraphItem.publications)) {
      for(const pubID of subgraphItem.publications) {
        let knowledgeLevel = ""
        let newPub = createNewPub(result, pubID, subgraphItem, knowledgeLevel);
        addItemToPublications(newPub, pubIds, evidenceObj.publications);
      }
    // if it's not it's an object, and we're on the results page
    } else {
      // key here is the knowledge level, i.e. "trusted", "ml", etc
      Object.keys(subgraphItem.publications).forEach(key => {
        for(const pubID of subgraphItem.publications[key]) {
          let newPub = createNewPub(result, pubID, subgraphItem, key);
          addItemToPublications(newPub, pubIds, evidenceObj.publications);
        }
      })
    }
  }

  const loopPathsAndFillInPubs = (result, paths, evidenceObj) => {
    for(const path of paths) {
      for(const [i, subgraphItem] of Object.entries(path.path.subgraph)) {
        if(i % 2 === 0)
          continue;

        fillInPublications(subgraphItem, result, evidenceObj);
        if(hasSupport(subgraphItem)) {
          loopPathsAndFillInPubs(result, subgraphItem.support, evidenceObj);
        }
      }
    }
  }

  loopPathsAndFillInPubs(result, result.compressedPaths, evidenceObject);

  return evidenceObject;
}
