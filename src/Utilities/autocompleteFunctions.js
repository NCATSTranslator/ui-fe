
export const getAutocompleteTerms = (inputText, setLoadingAutocomplete, setAutoCompleteItems) => {
  if(inputText) {
    console.log(`fetching '${inputText}'`);
    setLoadingAutocomplete(true);
    let nameResolverRequestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    };

    fetch(`https://name-resolution-sri.renci.org/lookup?string=${inputText}&offset=0&limit=20`, nameResolverRequestOptions)
      .then(response => response.json())
      .then(data => {
        let curies = {
          curies: getCuriesFromNameResolver(data),
          conflate: true
        }
        let nodeNormalizerRequestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(curies)
        };
        return fetch('https://nodenormalization-sri.renci.org/1.2/get_normalized_nodes', nodeNormalizerRequestOptions)
      })
      .then(response => response.json())
      .then(data => {
        let autoCompleteItems = getFormattedNamesFromNormalizer(data);
        setAutoCompleteItems(autoCompleteItems);
        setLoadingAutocomplete(false);
      })
      .catch((error) => {
        console.log(error)
      });
  }
}

const getCuriesFromNameResolver = (data) => {
  // Return an array of the curies returned by the name resolver (they're stored as the keys of the initially returned obj)
  return Object.keys(data).map((key) => key);
}

const getFormattedNamesFromNormalizer = (data) => {
  return (
    // get array of values from object
    Object.values(data)
      // filter to new array with only items of type => disease
      .filter((item) => item.type && item.type.includes("biolink:Disease") )
      // map those values into a new array that only has the label, aka 'common name'
      .map((item) => {return item.id.label})
  )
}
