// Returns array of terms based on user input
export const getAutocompleteTerms = (inputText, setLoadingAutocomplete, setAutoCompleteItems, autocompleteFunctions) => {
  if(inputText) {
    console.log(`fetching '${inputText}'`);
    setLoadingAutocomplete(true);
    fetchNodesFromInputText(inputText)
      .then(response => response.json())
      .then(nodes => fetchNormalizedNodesFromNodes(nodes))
      .then(response => response.json())
      .then(normalizedNodes => filterNormalizedNodes(normalizedNodes, autocompleteFunctions.filter))
      .then(normalizedNodes => autocompleteFunctions.annotate(normalizedNodes))
      .then(annotatedNodes => autocompleteFunctions.format(annotatedNodes))
      .then(autocompleteItems => {
        // Truncate items in case of too many matches
        autocompleteItems = autocompleteItems.slice(0,40);
        console.log('formatted autocomplete items:', autocompleteItems)
        setAutoCompleteItems(autocompleteItems);
        setLoadingAutocomplete(false);
      })
      .catch((error) => {
        console.log(error)
        setLoadingAutocomplete(false);
      });
  }
}

// Do a node search based on user input text
const fetchNodesFromInputText = async (inputText) => {
  const nameResolverRequestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  };
  return fetch(`https://name-resolution-sri.renci.org/lookup?string=${inputText}&offset=0&limit=100`, nameResolverRequestOptions)
}

// Normalize nodes to get the canonical CURIE associated with the node
const fetchNormalizedNodesFromNodes = async (nodes) => {
  const curies = nodesToCuries(nodes);
  console.log('Curies returned from Name resolver:', curies);
  const body = {
    curies: curies,
    conflate: true
  }
  const nodeNormalizerRequestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
  return fetch('https://nodenorm.transltr.io/1.3/get_normalized_nodes', nodeNormalizerRequestOptions)
}

// Filter normalized nodes based on the filter for the query type
const filterNormalizedNodes = async (normalizedNodes, autocompleteFilter) => {
  console.log(Object.keys(normalizedNodes).length, 'full data from node normalizer:', normalizedNodes);
  return Promise.resolve(Object.values(normalizedNodes).filter(autocompleteFilter));
}

// Get the CURIEs associated with an object of the form {<CURIE>: <NODE>}
const nodesToCuries = (nodes) => { return Object.keys(nodes); }

