import { capitalizeAllWords, capitalizeFirstLetter, formatBiolinkEntity } from './utilities';
import { cloneDeep } from "lodash";
import { score } from "../Utilities/scoring";

export const hasSupport = (item) => {
  return (Array.isArray(item.support) && item.support.length > 0);
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
        if(publication.pubdate !== null) {
          let formattedDate = publication.pubdate.split(' ')
          publication.pubdate = formattedDate[0];
        }
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
const checkForNodeUniformity = (pathOne, pathTwo) => {
  // if the lengths of the paths are different, they cannot have the same nodes
  if(pathOne.length !== pathTwo.length)
    return false;

  let nodesMatch = true;

  for(const [i, path] of pathOne.entries()) {
    // if we're at an odd index, it's a predicate, so skip it
    if(i % 2 !== 0)
      continue;

    // if the names of the nodes don't match, set nodesMatch to false
    if(path.name !== pathTwo[i].name)
      nodesMatch = false;
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

const getFormattedEdge = (id, results) => {
  let edge = getEdgeByID(id, results);
  edge.id = id;
  let pred = '';

  if(edge.predicate) {
    pred = formatBiolinkEntity(edge.predicate);
    edge.predicate = pred;
  }
  let newEdge = {
    category: 'predicate',
    predicates: [pred],
    edges: [edge],
    publications: edge.publications,
    inferred: false
  };
  // if the edge has support, recursively call getFormattedPaths to fill out the support paths
  if(hasSupport(edge)) {
    newEdge.support = edge.support;
    newEdge.support = getFormattedPaths(edge.support, results);
    newEdge.inferred = true;
  }
  
  if(edge.provenance !== undefined) 
    newEdge.provenance = edge.provenance;
  
  return newEdge;
}

const checkPathForSupport = (path) => {
  const hasNonEmptySupport = (element, index) => index % 2 !== 0 && element.inferred;
  return path?.subgraph?.some(hasNonEmptySupport) || false;
}

/**
 * Formats the raw path IDs into an array of formatted paths with node and edge information.
 * The formatted paths are extracted from the provided results object.
 * @param {Array} rawPathIds - The raw path IDs to be formatted.
 * @param {Object} results - The results object containing paths and node/edge information.
 * @returns {Array} The formatted paths array.
*/
const getFormattedPaths = (rawPathIds, results) => {
  let formattedPaths = [];
  for(const id of rawPathIds) {
    let formattedPath = cloneDeep(results.paths[id]);
    formattedPath.inferred = checkPathForSupport(formattedPath);
    if(formattedPath) {
      for(const [i] of formattedPath.subgraph.entries()) {
        if(i % 2 === 0) {
          let node = getNodeByCurie(formattedPath.subgraph[i], results);
          let name = (node.names) ? node.names[0]: '';
          let type = (node.types) ? node.types[0]: '';
          let desc = (node.descriptions) ? node.descriptions[0]: '';
          let category = (i === formattedPath.subgraph.length - 1) ? 'target' : 'object';
          formattedPath.subgraph[i] = {
            category: category,
            name: name,
            type: type,
            description: desc,
            curies: node.curies,
          };
          if(node.provenance !== undefined) {
            formattedPath.subgraph[i].provenance = node.provenance;
          }
        } else {
          let eid = formattedPath.subgraph[i];
          let edge = getEdgeByID(eid, results);
          let pred = (edge.predicate) ? formatBiolinkEntity(edge.predicate) : '';
          let publications = removeDuplicatePubIds(edge.publications);
          formattedPath.subgraph[i] = {
            category: 'predicate',
            predicates: [pred],
            edges: [{id: eid, object: edge.object, predicate: pred, subject: edge.subject, provenance: edge.provenance}],
            publications: publications
          };
          if(edge.provenance !== undefined) {
            formattedPath.subgraph[i].provenance = edge.provenance;
          }
        }
      }
      formattedPaths.push({highlighted: false, path: formattedPath});
    }
  }
  return formattedPaths;
}

/**
 * Compresses paths in the graph by merging consecutive paths with identical nodes.
 * The compressed paths are returned as a new array.
 * @param {Array} graph - The graph containing paths to be compressed.
 * @returns {Array} The compressed paths.
*/
const getCompressedPaths = (graph) => {
  let newCompressedPaths = [];
  let pathToDisplay = null
  for(const [i, pathObj] of graph.entries()) {
    if(pathToDisplay === null)
      pathToDisplay = cloneDeep(pathObj);
    let displayPath = false;
    let nextPath = (graph[i+1] !== undefined) ? graph[i+1] : null;
    // if all nodes are equal
    let nodesEqual = (nextPath) ? checkForNodeUniformity(pathToDisplay.path.subgraph, nextPath.path.subgraph) : false;

    // if theres another path after the current one, and the nodes of each are equal
    if(nextPath && nodesEqual) {

      // loop through the current path's items
      for(const [i] of pathObj.path.subgraph.entries()) {
        if(displayPath) {
          break;
        }
        // if we're at an even index, it's a node, so skip it
        if(i % 2 === 0)
          continue;

        if(!nextPath.path.subgraph[i])
          continue;

        // loop through nextPath's item's predicates
        for(const predicate of nextPath.path.subgraph[i].predicates) {
          // if the next path item to be displayed doesn't have the predicate,
          if(!pathToDisplay.path.subgraph[i].predicates.includes(predicate)) {
            // add it
            pathToDisplay.path.subgraph[i].predicates.push(predicate);
            pathToDisplay.path.subgraph[i].edges.push(nextPath.path.subgraph[i].edges[0]);
          }
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
    let formattedPaths = getFormattedPaths(item.paths, results);
    let compressedPaths = getCompressedPaths(formattedPaths);
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
  const fillInPublications = (subgraphItem, result, evidenceObj) => {
    // key here is the knowledge level, i.e. "trusted", "ml", etc
    Object.keys(subgraphItem.publications).forEach(key => {
      for(const pubID of subgraphItem.publications[key]) {
        let newPub = result.evidence.publications[pubID];
        newPub.knowledgeLevel = key;
        let type = getTypeFromPub(pubID);
        newPub.url = getUrlByType(pubID, type);
        newPub.source = formatPublicationSourceName(newPub.source);
        addItemToPublications(newPub, pubIds, evidenceObj.publications);
      }
    })
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