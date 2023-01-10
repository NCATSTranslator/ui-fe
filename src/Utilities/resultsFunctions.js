import { capitalizeAllWords, capitalizeFirstLetter, formatBiolinkPredicate } from './utilities';
import _, { cloneDeep } from "lodash";

// Given an array of paths and results, return an array of publications for those paths
export const getFormattedEvidence = (paths, results) => {
  let formattedEvidence = [];
  for(const path of paths) {
    for(const subgraph of path.subgraph) {
      if(subgraph.publications && subgraph.publications.length > 0)
        for(const pubID of subgraph.publications) {
          // if the publication has not already been added, set it up and add it
          if(formattedEvidence.find(item => item.id === pubID) === undefined){
            let publication = getPubByID(pubID, results);
            publication.id = pubID;
            let object = subgraph.object;
            let subject = subgraph.subject;
            let predicate = formatBiolinkPredicate(subgraph.predicate);
            publication.edge = {
              subject: capitalizeAllWords(subject.names[0]),
              predicate: predicate,
              object: capitalizeAllWords(object.names[0])
            };
            publication.source = '';
            publication.title = '';
            formattedEvidence.push(publication);
          }
        }
    }
  }

  return formattedEvidence;
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

export const getFormattedPaths = (rawPathIds, results) => {
  let formattedPaths = [];
  for(const id of rawPathIds) {
    let formattedPath = cloneDeep(results.paths[id]);
    if(formattedPath) {
      for(let i = 0; i < formattedPath.subgraph.length; i++) {
        if(i % 2 === 0) {
          formattedPath.subgraph[i] = getNodeByCurie(formattedPath.subgraph[i], results);
        } else {
          formattedPath.subgraph[i] = getEdgeByID(formattedPath.subgraph[i], results);
        }
      }
      formattedPaths.push(formattedPath);
    }
  }
  return formattedPaths;
}

// Take raw results and return properly summarized results
export const getSummarizedResults = (results, presetDisease, setPresetDisease) => {
  if (results === null || results === undefined)
    return [];

  let newSummarizedResults = [];
  let presetDiseaseSet = (presetDisease) ? true : false;
  
  // // for each individual result item 
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
    let formattedPaths = [];
    formattedPaths = getFormattedPaths(item.paths, results);
    let itemName = (item.drug_name !== null) ? capitalizeFirstLetter(item.drug_name) : capitalizeAllWords(subjectNode.names[0]);
    let formattedItem = {
      id: _.uniqueId(),
      type: 'biolink:Drug',
      name: itemName,
      paths: formattedPaths,
      object: objectNodeName,
      description: description,
      evidence: getFormattedEvidence(formattedPaths, results),
      fdaInfo: fdaInfo
    }
    newSummarizedResults.push(formattedItem);
    if(!presetDiseaseSet) {
      setPresetDisease({id: item.object, label: objectNodeName});
      presetDiseaseSet = true;
    }
  }
  return newSummarizedResults;
}

// Function to search given element for string match, used in string filter
// Checks result name, result description, all node names and all predicates
// Does NOT include node types (Protein, Biological Entity, etc.)
export const findStringMatch = (element, value) => {
  if(!value || !element) {
    return true;
  }

  let formattedValue = value.toLowerCase();
  let foundInName = element.name.toLowerCase().indexOf(formattedValue); 
  let foundInDescription =  (element.description) ? element.description.toLowerCase().indexOf(formattedValue) : -1; 
  if (
    foundInName > -1 || foundInDescription > -1
  ){
    return true;
  }

  for(const path of element.paths) {
    for(const item of path.subgraph) {
      if(
        (item.names && item.names[0].toLowerCase().includes(formattedValue) )|| 
        (item.predicates && item.predicates[0].toLowerCase().includes(formattedValue))
        // || item.types && item.types[0].replace('biolink:', '').replaceAll(/([A-Z])/g, ' $1').trim().toLowerCase().includes(formattedValue)
      )
        return true;
    }
  }

  return false;
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