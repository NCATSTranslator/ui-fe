import { capitalizeAllWords } from "./utilities";

const standardQueryFilterFactory = (type) => {
  return (item) => {
    return item && item.type && item.type.includes(`biolink:${type}`) && item.id.label;
  };
}

const standardQueryAnnotatorFactory = () => {
  return async (normalizedCuries) => {
    return Promise.resolve(normalizedCuries);
  };
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
      annotate: standardQueryAnnotatorFactory(),
      format: standardQueryFormatterFactory()
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
      annotate: standardQueryAnnotatorFactory(),
      format: standardQueryFormatterFactory()
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
