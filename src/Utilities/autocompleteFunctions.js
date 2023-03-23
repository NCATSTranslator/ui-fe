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
        // truncate array in case of too many results
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
const fetchNodesFromInputText = async (inputText) => {
  const nameResolverRequestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  };
  // Fetch list of curies based on userInput string from Name Resolver
  return fetch(`https://name-resolution-sri.renci.org/lookup?string=${inputText}&offset=0&limit=100`, nameResolverRequestOptions)
}

const fetchNormalizedNodesFromNodes = async (nodes) => {
  // Convert data returned from Name Resolver into a list of curies
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
  // Fetch list of normalized nodes based on list of curies from Name Resolver
  return fetch('https://nodenorm.transltr.io/1.3/get_normalized_nodes', nodeNormalizerRequestOptions)
}

const filterNormalizedNodes = async (normalizedNodes, autocompleteFilter) => {
  console.log(Object.keys(normalizedNodes).length, 'full data from node normalizer:', normalizedNodes);
  // get array of values from object
  return Promise.resolve(Object.values(normalizedNodes)
    // filter to new array with only items specificed by the filter
    .filter(autocompleteFilter));
}

const nodesToCuries = (nodes) => {
  // Return an array of the curies returned by the name resolver (they're stored as the keys of the initially returned obj)
  return Object.keys(nodes);
}

