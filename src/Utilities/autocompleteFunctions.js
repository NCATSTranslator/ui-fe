import { capitalizeAllWords } from "./utilities";

// Returns array of terms based on user input
export const getAutocompleteTerms = (inputText, setLoadingAutocomplete, setAutoCompleteItems) => {
  if(inputText) {
    console.log(`fetching '${inputText}'`);
    setLoadingAutocomplete(true);
    let nameResolverRequestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    };
    // Fetch list of curies based on userInput string from Name Resolver
    fetch(`https://name-resolution-sri.renci.org/lookup?string=${inputText}&offset=0&limit=20`, nameResolverRequestOptions)
      .then(response => response.json())
      .then(data => {
        // Convert data returned from Name Resolver into a list of curies
        let curies = getFormattedCuriesFromNameResolver(data);
        console.log('Curies returned from Name resolver:', curies);
        let body = {
          curies: curies,
          conflate: true
        }
        let nodeNormalizerRequestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        };
        // Fetch list of normalized nodes based on list of curies from Name Resolver
        return fetch('https://nodenorm.transltr.io/1.3/get_normalized_nodes', nodeNormalizerRequestOptions)
      })
      .then(response => response.json())
      .then(data => {
        console.log('full data from node normalizer:', data);
        // get list of names from the data returned from Node Normalizer
        let autoCompleteItems = getFormattedNamesFromNormalizer(data);
        console.log('formatted autocomplete items:', autoCompleteItems)
        setAutoCompleteItems(autoCompleteItems);
        setLoadingAutocomplete(false);
      })
      .catch((error) => {
        console.log(error)
        setLoadingAutocomplete(false);
      });
  }
}

const getFormattedCuriesFromNameResolver = (data) => {
  // Return an array of the curies returned by the name resolver (they're stored as the keys of the initially returned obj)
  return Object.keys(data).map((key) => key);
}

const getFormattedNamesFromNormalizer = (data) => {

  let autocompleteObjects = 
    // get array of values from object
    Object.values(data)
      // filter to new array with only items of type => disease
      .filter((item) => item && item.type && item.type.includes("biolink:Disease") && item.id.label )
      // map those values into a new array that only has the label, aka 'common name'
      .map((item) => {
        return {id: item.id.identifier, label: capitalizeAllWords(item.id.label)}
      });
  // remove duplicates by converting array to set of ids (sets don't tolerate duplicates)
  return Array.from(new Set(autocompleteObjects.map(a => a.id)))
    // then return a new array of objects by finding each object by its id 
    .map(id => {
      return autocompleteObjects.find(a => a.id === id)
    });
}
