import { defaultQueryFilterFactory, drugTreatsQueryFilterFactory } from '@/features/Query/utils/queryTypeFilters';
import { defaultQueryAnnotator, geneQueryAnnotator } from '@/features/Query/utils/queryTypeAnnotators';
import { defaultQueryFormatter, geneQueryFormatter, diseaseQueryFormatter } from '@/features/Query/utils/queryTypeFormatters';
import { QueryType } from '@/features/Query/types/querySubmission';

export const queryTypes: QueryType[] = [
  {
    id: 0,
    label: 'What drugs may treat conditions related to a disease?',
    placeholder: 'Enter a Disease or Phenotype',
    targetType: 'drug',
    direction: null,
    filterType: 'DiseaseOrPhenotypicFeature',
    limitPrefixes: ['MONDO','HP'],
    functions: {
      filter: drugTreatsQueryFilterFactory('Disease'),
      annotate: defaultQueryAnnotator,
      format: diseaseQueryFormatter
    },
    pathString: 'may treat conditions related to',
    searchTypeString: 'disease',
    iconString: 'drug'
  },
  {
    id: 1,
    label: 'What chemicals may increase the activity of a gene?',
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
    pathString: 'may increase the activity of',
    searchTypeString: 'gene',
    iconString: 'chemup'
  },
  {
    id: 2,
    label: 'What chemicals may decrease the activity of a gene?',
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
    pathString: 'may decrease the activity of',
    searchTypeString: 'gene',
    iconString: 'chemdown'
  },
  {
    id: 3,
    label: 'What genes\' activity may be increased by a chemical?',
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
    pathString: 'activity may be increased by',
    searchTypeString: 'chemical',
    iconString: 'geneup'
  },
  {
    id: 4,
    label: 'What genes\' activity may be decreased by a chemical?',
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
    pathString: 'activity may be decreased by',
    searchTypeString: 'chemical',
    iconString: 'genedown'
  }
]
