import { defaultQueryFilterFactory, drugTreatsQueryFilterFactory } from './queryTypeFilters';
import { defaultQueryAnnotator, geneQueryAnnotator } from './queryTypeAnnotators';
import { defaultQueryFormatter, geneQueryFormatter, diseaseQueryFormatter } from './queryTypeFormatters';

export const queryTypes = [
  {
    id: 0,
    label: 'What drugs may treat',
    placeholder: 'Enter a Disease',
    targetType: 'drug',
    direction: null,
    filterType: '',
    limitPrefixes: ['MONDO'],
    functions: {
      filter: drugTreatsQueryFilterFactory('Disease'),
      annotate: defaultQueryAnnotator,
      format: diseaseQueryFormatter
    },
    pathString: 'may treat'
  },
  {
    id: 1,
    label: 'What chemicals may upregulate',
    placeholder: 'Enter a Gene',
    targetType: 'chemical',
    direction: 'increased',
    filterType: 'Gene',
    limitPrefixes: [],
    functions: {
      filter: defaultQueryFilterFactory('Gene'),
      annotate: geneQueryAnnotator,
      format: geneQueryFormatter
    },
    pathString: 'may upregulate'
  },
  {
    id: 2,
    label: 'What chemicals may downregulate',
    placeholder: 'Enter a Gene',
    targetType: 'chemical',
    direction: 'decreased',
    filterType: 'Gene',
    limitPrefixes: [],
    functions: {
      filter: defaultQueryFilterFactory('Gene'),
      annotate: geneQueryAnnotator,
      format: geneQueryFormatter
    },
    pathString: 'may downregulate'
  },
  {
    id: 3,
    label: 'What genes may be upregulated by',
    placeholder: 'Enter a Chemical',
    targetType: 'gene',
    direction: 'increased',
    filterType: 'SmallMolecule',
    limitPrefixes: [],
    functions: {
      filter: defaultQueryFilterFactory('SmallMolecule'),
      annotate: defaultQueryAnnotator,
      format: defaultQueryFormatter,
    },
    pathString: 'may be upregulated by'
  },
  {
    id: 4,
    label: 'What genes may be downregulated by',
    placeholder: 'Enter a Chemical',
    targetType: 'gene',
    direction: 'decreased',
    filterType: 'SmallMolecule',
    limitPrefixes: [],
    functions: {
      filter: defaultQueryFilterFactory('SmallMolecule'),
      annotate: defaultQueryAnnotator,
      format: defaultQueryFormatter,
    },
    pathString: 'may be downregulated by'
  }
]
