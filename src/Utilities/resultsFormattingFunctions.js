import { capitalizeAllWords, capitalizeFirstLetter, formatBiolinkEntity } from './utilities';
import { cloneDeep } from "lodash";

/**
 * Formats the evidence information for the provided paths by extracting and organizing publications and sources.
 * @param {Array} paths - The paths for which evidence is being formatted.
 * @param {Object} results - The results object containing publication and source information.
 * @returns {Object} The formatted evidence object containing publications, sources, distinct sources, and length.
*/
const getFormattedEvidence = (paths, results) => {
  const formatEvidenceObjs = (objs, getId, item, constructor, container) => {
    for (const obj of objs) {
      const id = getId(obj);
      let evidenceObj = container[id];
      if (evidenceObj === undefined) {
        evidenceObj = constructor(obj);
        evidenceObj.edges = {};
        container[id] = evidenceObj;
      }

      const eid = item.edges[0].id;
      evidenceObj.edges[eid] = {
        subject: item.edges[0].subject.names[0],
        predicate: item.edges[0].predicate,
        object: item.edges[0].object.names[0]
      };
    }
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
        publication.source = '';
        publication.title = '';
        return publication;
      },
      container);
  };

  const formatSources = (sources, item, container) => {
    formatEvidenceObjs(
      sources, 
      (src) => { return `${item.edges[0].subject.names[0]}${src.name}${item.edges[0].object.names[0]}`; }, 
      item,
      (src) => { return src; },
      container);
  };

  const formattedPublications = {};
  const formattedSources = {};
  for(const path of paths) {
    for(const item of path.path.subgraph) {
      if(item.category === 'predicate') {
        formatPublications(item.publications, item, formattedPublications);
        formatSources(item.provenance, item, formattedSources);
      }
    }
  }

  const publications = Object.values(formattedPublications);
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

  return cloneDeep(results.nodes[curie]);
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

  newEdge.object = getNodeByCurie(newEdge.object, results);
  newEdge.subject = getNodeByCurie(newEdge.subject, results);

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
    if(formattedPath) {
      for(const [i] of formattedPath.subgraph.entries()) {
        if(i % 2 === 0) {
          let node = getNodeByCurie(formattedPath.subgraph[i], results);
          let name = (node.names) ? node.names[0]: '';
          let type = (node.types) ? node.types[0]: '';
          let desc = (node.description) ? node.description[0]: '';
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
          formattedPath.subgraph[i] = {
            category: 'predicate',
            predicates: [pred],
            edges: [{id: eid, object: edge.object, predicate: pred, subject: edge.subject, provenance: edge.provenance}],
            publications: edge.publications
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
 * Generates summarized results from the given results array. It processes each individual result item
 * to extract relevant information such as node names, descriptions, FDA approval status, paths, evidence,
 * scores, and tags. The summarized results are returned as an array.
 * @param {Array} results - The results array to be summarized.
 * @returns {Array} The summarized results array.
*/
export const getSummarizedResults = (results) => {
  if (results === null || results === undefined)
    return [];

  let newSummarizedResults = [];

  // // for each individual result item
  for(const [i, item] of results.results.entries()) {
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
    let itemScore = (item.score === null) ? 0 : item.score.toFixed(1);
    let tags = (item.tags !== null) ? Object.keys(item.tags) : [];
    let formattedItem = {
      id: `${item.subject}${item.object}-${i}`,
      subjectNode: subjectNode,
      type: 'biolink:Drug',
      name: itemName,
      paths: formattedPaths,
      compressedPaths: compressedPaths,
      object: objectNodeName,
      description: description,
      evidence: getFormattedEvidence(formattedPaths, results),
      fdaInfo: fdaInfo,
      score: itemScore,
      tags: tags,
      rawResult: item
    }
    newSummarizedResults.push(formattedItem);
  }

  return newSummarizedResults;
}
