import { defaultQueryFilterFactory, drugTreatsQueryFilterFactory } from '@/features/Query/utils/queryTypeFilters';
import { queryTypeAnnotator } from '@/features/Query/utils/queryTypeAnnotators';
import { combinedQueryFormatter } from '@/features/Query/utils/queryTypeFormatters';
import { QueryType, AutocompleteItem } from '@/features/Query/types/querySubmission';
import {
  isBiolinkChemicalCategory,
  isBiolinkDiseaseCategory,
  isBiolinkGeneCategory,
} from '@/features/Query/utils/biolinkCategories';

export const queryTypes: QueryType[] = [
  {
    id: 0,
    label: 'What drugs may impact conditions related to a disease?',
    placeholder: 'Enter a Disease or Phenotype',
    targetType: 'drug',
    direction: null,
    filterType: 'DiseaseOrPhenotypicFeature',
    limitPrefixes: ['MONDO','HP'],
    functions: {
      filter: drugTreatsQueryFilterFactory('Disease'),
      annotate: queryTypeAnnotator,
      format: combinedQueryFormatter
    },
    pathString: 'may impact conditions related to',
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
      annotate: queryTypeAnnotator,
      format: combinedQueryFormatter
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
      annotate: queryTypeAnnotator,
      format: combinedQueryFormatter
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
      annotate: queryTypeAnnotator,
      format: combinedQueryFormatter,
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
      annotate: queryTypeAnnotator,
      format: combinedQueryFormatter,
    },
    pathString: 'activity may be decreased by',
    searchTypeString: 'chemical',
    iconString: 'genedown'
  }
];

const queryTypeByFilterType = (
  filterType: string,
  direction: 'increased' | 'decreased' | null,
): QueryType | null =>
  queryTypes.find((queryType) =>
    queryType.filterType === filterType && queryType.direction === direction,
  ) ?? null;

/**
 * Returns the Smart Query type that best fits a biolink category, or null when
 * no Smart Query accepts that category (e.g. AnatomicalEntity).
 */
export const getQueryTypeForCategory = (
  category: string | null | undefined,
): QueryType | null => {
  if (!category) return null;
  if (isBiolinkDiseaseCategory(category)) {
    return queryTypeByFilterType('DiseaseOrPhenotypicFeature', null);
  }
  if (isBiolinkGeneCategory(category)) {
    return queryTypeByFilterType('Gene', 'increased');
  }
  if (isBiolinkChemicalCategory(category)) {
    return queryTypeByFilterType('SmallMolecule', 'increased');
  }
  return null;
};

/** True when `nc` is present but does not map to a Smart Query type. */
export const isUnsupportedSmartQueryCategory = (
  category: string | null | undefined,
): boolean => !!category && getQueryTypeForCategory(category) === null;

export const generatePathfinderQuestionText = (labelOne: string, labelTwo: string, constraintText?: string) => {
  if(!labelOne || !labelTwo) {
    return '';
  }
  if(!!constraintText) {
    return `What paths begin with ${labelOne} and end with ${labelTwo} and include a ${constraintText}?`;
  } else {
    return `What paths begin with ${labelOne} and end with ${labelTwo}?`;
  }
};

export const generateSmartQueryQuestionText = (label: string, item: AutocompleteItem) => {
  const resultsPaneQuestionText = label
    .replaceAll("a disease?", "")
    .replaceAll("a chemical?", "")
    .replaceAll("a gene?", "");
  return `${resultsPaneQuestionText}${item.label}?`;
};
export const getQueryTitle = (type: 'smart' | 'pathfinder', queryType: QueryType | null, itemOne: AutocompleteItem, itemTwo?: AutocompleteItem, constraintText?: string) => {
  if(type === 'smart' && !!queryType) {
    return generateSmartQueryQuestionText(queryType.label, itemOne);
  } else if(type === 'pathfinder') {
    return generatePathfinderQuestionText(itemOne?.label || '', itemTwo?.label || '', constraintText) || 'New Pathfinder Query';
  }
  return '';
};
