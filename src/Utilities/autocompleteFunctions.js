
export const getAutocompleteTerms = (inputText, updateAutocompleteItems, setLoadingAutocomplete, setAutoCompleteItems) => {
  if(inputText) {
    console.log(`fetching '${inputText}'`);
    setLoadingAutocomplete(true);
    let requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    };
    fetch(`https://name-resolution-sri.renci.org/lookup?string=${inputText}&offset=0&limit=10`, requestOptions)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        updateAutocompleteItems(data, setAutoCompleteItems);
        setLoadingAutocomplete(false);
      })
      .catch((error) => {
        console.log(error)
      });
  }
}

export const updateAutocompleteItems = (items, setAutoCompleteItems) => {
  let newAutocompleteItems = [];
  Object.entries(items).forEach(([key, value]) => {
    newAutocompleteItems.push(value[1]);
  });
  setAutoCompleteItems(newAutocompleteItems);
}