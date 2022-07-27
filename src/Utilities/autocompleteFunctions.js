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
        let curies = {
          // Convert data returned from Name Resolver into a list of curies
          curies: getCuriesFromNameResolver(data),
          conflate: true
        }
        let nodeNormalizerRequestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(curies)
        };
        // Fetch list of normalized nodes based on list of curies from Name Resolver
        return fetch('https://nodenormalization-sri.renci.org/1.2/get_normalized_nodes', nodeNormalizerRequestOptions)
      })
      .then(response => response.json())
      .then(data => {
        // get list of names from the data returned from Node Normalizer
        let autoCompleteItems = getFormattedNamesFromNormalizer(data);
        setAutoCompleteItems(autoCompleteItems);
        setLoadingAutocomplete(false);
      })
      .catch((error) => {
        console.log(error)
        setLoadingAutocomplete(false);
      });
  }
}

const getCuriesFromNameResolver = (data) => {
  // Return an array of the curies returned by the name resolver (they're stored as the keys of the initially returned obj)
  return Object.keys(data).map((key) => key);
}

const getFormattedNamesFromNormalizer = (data) => {

  let autocompleteObjects = 
    // get array of values from object
    Object.values(data)
      // filter to new array with only items of type => disease
      .filter((item) => item && item.type && item.type.includes("biolink:Disease") )
      // map those values into a new array that only has the label, aka 'common name'
      .map((item) => {
        return {id: item.id.identifier, label: capitalizeAllWords(item.id.label)}
      });
  return Array.from(new Set(autocompleteObjects.map(a => a.id)))
    .map(id => {
      return autocompleteObjects.find(a => a.id === id)
    });
}
