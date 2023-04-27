import { capitalizeAllWords, capitalizeFirstLetter, formatBiolinkEntity } from './utilities';
import { cloneDeep } from "lodash";

// Given an array of paths and results, return an array of publications for those paths
export const getFormattedEvidence = (paths, results) => {
  const formatEvidenceObjs = (objs, getId, item, constructor, container) => {
    for (const obj of objs) {
      const id = getId(obj);
      let evidenceObj = container[id];
      if (evidenceObj === undefined) {
        evidenceObj = constructor(obj);
        let object = item.edges[0].object;
        let subject = item.edges[0].subject;
        evidenceObj.edge = {
          subject: capitalizeAllWords(subject.names[0]),
          predicates: item.predicates,
          object: capitalizeAllWords(object.names[0])
        };
        container[id] = evidenceObj;
      } else {
        evidenceObj.edge.predicates.push(...item.predicates);
      }
    }
  };

  const formatPublications = (publications, item, container) => {
    formatEvidenceObjs(
      publications,
      (id) => { return id; },
      item,
      (id) => {
        const publication = getPubByID(id, results);
        publication.id = id;
        publication.source = '';
        publication.title = '';
        return publication;
      },
      container);
  };

  const formatSources = (sources, item, container) => {
    formatEvidenceObjs(sources, (src) => { return src.name; }, item, (src) => { return src; }, container);
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

  return {
    publications: publications,
    sources: sources,
    length: sources.length + publications.length
  };
}

// search the list of publications for a particular id, then return that publication object if found
export const getPubByID = (id, results) => {
  if(results.publications[id] === undefined)
    return {};

  return cloneDeep(results.publications[id]);
}

// search the list of nodes for a particular curie, then return that node object if found
export const getNodeByCurie = (curie, results) => {
  if(results.nodes[curie] === undefined)
    return {};

  return cloneDeep(results.nodes[curie]);
}
// search the list of edges for a particular id, then return that edge object if found
export const getEdgeByID = (id, results) => {
  if(results.edges[id] === undefined)
    return {};
  let newEdge = cloneDeep(results.edges[id]);

  newEdge.object = getNodeByCurie(newEdge.object, results);
  newEdge.subject = getNodeByCurie(newEdge.subject, results);

  return newEdge;
}

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

export const getFormattedPaths = (rawPathIds, results) => {
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
            edges: [{object: edge.object, predicate: pred, subject: edge.subject, provenance: edge.provenance}],
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

const getCompressedPaths = (graph) => {
  let newCompressedPaths = new Set();
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
      newCompressedPaths.add(pathToDisplay);
      pathToDisplay = null;
    }
  }

  return newCompressedPaths;
}

// Take raw results and return properly summarized results
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

// Function to search given element for string match, used in string filter
// Checks result name, result description, all node names and all predicates
// Does NOT include node types (Protein, Biological Entity, etc.)
export const findStringMatch = (element, value, pathRanks) => {
  const formattedValue = value.toLowerCase();
  let foundMatch = !value ||
    !element ||
    element.name.toLowerCase().includes(formattedValue) ||
    (element.description && element.description.toLowerCase().includes(formattedValue));
  for (let i = 0; i < element.paths.length; ++i) {
    const path = element.paths[i];
    for (let item of path.path.subgraph) {
      if ((item.name && item.name.toLowerCase().includes(formattedValue)) ||
          (item.predicates && item.predicates[0].toLowerCase().includes(formattedValue))) {
        // Its confusing to update the pathRanks here, but it is more efficient
        pathRanks[i].rank -= 1;
        foundMatch = true;
        break;
      }
    }
  }

  return foundMatch;
}

export const removeHighlights = (elements, value) => {
  for(const element of elements) {
    if(element.highlightedName && element.highlightedName.toLowerCase().includes(value.toLowerCase().trim())) {
      element.highlightedName = null;
    }
    if(element.highlightedDescription && element.highlightedDescription.toLowerCase().includes(value.toLowerCase().trim())) {
      element.highlightedDescription = null;
    }
  }
  return elements;
}
