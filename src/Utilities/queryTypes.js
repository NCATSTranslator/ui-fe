import { capitalizeAllWords } from "./utilities";

const standardQueryFilterFactory = (type) => {
  return (item) => {
    return item && item.type && item.type.includes(`biolink:${type}`) && item.id.label;
  };
}

const standardQueryAnnotatorFactory = () => {
  return async (normalizedNodes) => {
    console.log(normalizedNodes);
    return Promise.resolve(normalizedNodes);
  };
}

const geneQueryAnnotator = async (normalizedNodes) => {
  const genes = {};
  normalizedNodes.forEach((node) => {
    const curie = node.id.identifier;
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
    //console.log(`Gene annotations: ${geneAnnotations}`);
    const validTaxon = { 9606: 'Human', 10090: 'Mouse', 10116: 'Rat' };
    const validGenes = [];
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

const geneQueryFormatter = async (genes) => {
  return Promise.resolve(genes.map((gene) => {
    return { id: gene.curie, label: gene.symbol, match: gene.species };
  }));
}

const standardQueryFormatterFactory = () => {
  return async (items) => {
    const autocompleteObjects = items.map((item) => {
      return {id: item.id.identifier, label: capitalizeAllWords(item.id.label)};
    });

    // remove duplicates by converting array to set of ids (sets don't tolerate duplicates)
    return Promise.resolve(Array.from(new Set(autocompleteObjects.map(a => a.id)))
    // then return a new array of objects by finding each object by its id
      .map(id => {
        return autocompleteObjects.find(a => a.id === id)
      }));
  }
}

export const queryTypes = [
  {
    id: 0,
    label: 'What drugs may treat',
    placeholder: 'Enter a Disease',
    targetType: 'drug',
    direction: null,
    filterType: 'Disease',
    functions: {
      filter: standardQueryFilterFactory('Disease'),
      annotate: standardQueryAnnotatorFactory(),
      format: standardQueryFormatterFactory()
    },
    pathString: 'may treat'
  },
  {
    id: 1,
    label: 'What chemical upregulates',
    placeholder: 'Enter a Gene',
    targetType: 'chemical',
    direction: 'increased',
    filterType: 'Gene',
    functions: {
      filter: standardQueryFilterFactory('Gene'),
      annotate: geneQueryAnnotator,
      format: geneQueryFormatter
    },
    pathString: 'may upregulate'
  },
  {
    id: 2,
    label: 'What chemical downregulates',
    placeholder: 'Enter a Gene',
    targetType: 'chemical',
    direction: 'decreased',
    filterType: 'Gene',
    functions: {
      filter: standardQueryFilterFactory('Gene'),
      annotate: geneQueryAnnotator,
      format: geneQueryFormatter
    },
    pathString: 'may downregulate'
  },
  {
    id: 3,
    label: 'What gene is upregulated by',
    placeholder: 'Enter a Chemical',
    targetType: 'gene',
    direction: 'increased',
    filterType: 'ChemicalEntity',
    functions: {
      filter: standardQueryFilterFactory('ChemicalEntity'),
      annotate: standardQueryAnnotatorFactory(),
      format: standardQueryFormatterFactory()
    },
    pathString: 'may be upregulated by'
  },
  {
    id: 4,
    label: 'What gene is downregulated by',
    placeholder: 'Enter a Chemical',
    targetType: 'gene',
    direction: 'decreased',
    filterType: 'ChemicalEntity',
    functions: {
      filter: standardQueryFilterFactory('ChemicalEntity'),
      annotate: standardQueryAnnotatorFactory(),
      format: standardQueryFormatterFactory()
    },
    pathString: 'may be downregulated by'
  }
]
