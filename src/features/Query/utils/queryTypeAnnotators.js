// By default do not annotate
export const defaultQueryAnnotator = async (normalizedNodes) => {
  return Promise.resolve(normalizedNodes);
}

// Annotate gene autocompletion items with mygene.info symbol and taxonomy information
export const geneQueryAnnotator = async (normalizedNodes) => {
  const genes = {};
  // Pull out the integer part of NCBIGene CURIEs. These are the only CURIE types
  // supported by mygene.info
  normalizedNodes.forEach((node) => {
    const curie = node.curie;
    const [prefix, id] = curie.split(':');
    if (prefix === 'NCBIGene') {
      genes[id] = { curie: curie };
    }
  });

  const body = {
    ids: Object.keys(genes),
    fields: [ 'symbol', 'taxid' ]
  };

  const geneInfoRequestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };

  try {
    const response = await fetch('https://mygene.info/v3/gene', geneInfoRequestOptions);
    const geneAnnotations = await response.json();
    const validTaxon = {
      7955: 'Zebrafish',
      9606: 'Human',
      10090: 'Mouse',
      10116: 'Rat'
    };
    const validGenes = [];
    // The only valid gene autocomplete items should be those that match one of
    // the valid taxon IDs above.
    geneAnnotations.forEach((annotation) => {
      const species = validTaxon[annotation.taxid];
      if (species !== undefined) {
        const gene = genes[annotation._id];
        gene.symbol = annotation.symbol;
        gene.species = species;
        validGenes.push(gene);
      }
    });

    return Promise.resolve(validGenes);
  } catch (err) {
    return Promise.reject(err);
  }
}
