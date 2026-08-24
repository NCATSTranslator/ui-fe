import { formatBiolinkTypeString } from '@/features/Core/utils/stringFormatters';

export type BiolinkCategory = {
  value: string;
  label: string;
  pluralLabel: string;
};

export const BIOLINK_CATEGORIES: BiolinkCategory[] = [
  { value: "biolink:AnatomicalEntity", label: "Anatomical Entity", pluralLabel: "Anatomical Entities" },
  { value: "biolink:BiologicalProcess", label: "Biological Process", pluralLabel: "Biological Processes" },
  { value: "biolink:CellLine", label: "Cell Line", pluralLabel: "Cell Lines" },
  { value: "biolink:ChemicalEntity", label: "Chemical", pluralLabel: "Chemicals" },
  { value: "biolink:Disease", label: "Disease", pluralLabel: "Diseases" },
  { value: "biolink:Drug", label: "Drug", pluralLabel: "Drugs" },
  { value: "biolink:Gene", label: "Gene/Protein", pluralLabel: "Genes/Proteins" },
  { value: "biolink:PhenotypicFeature", label: "Phenotype", pluralLabel: "Phenotypes" },
];

export const BIOLINK_DISEASE_CATEGORIES = [
  'biolink:Disease',
  'biolink:PhenotypicFeature',
  'biolink:DiseaseOrPhenotypicFeature',
] as const;

export const BIOLINK_GENE_CATEGORIES = [
  'biolink:Gene',
  'biolink:Protein',
] as const;

export const BIOLINK_CHEMICAL_CATEGORIES = [
  'biolink:SmallMolecule',
  'biolink:ChemicalEntity',
  'biolink:Drug',
] as const;

export const BIOLINK_DISEASE_CATEGORY_SET = new Set<string>(BIOLINK_DISEASE_CATEGORIES);
export const BIOLINK_GENE_CATEGORY_SET = new Set<string>(BIOLINK_GENE_CATEGORIES);
export const BIOLINK_CHEMICAL_CATEGORY_SET = new Set<string>(BIOLINK_CHEMICAL_CATEGORIES);

const labelMap = new Map(BIOLINK_CATEGORIES.map(c => [c.value, c]));

/**
 * Ensures a biolink category has the `biolink:` prefix.
 * Bare values like `Gene` become `biolink:Gene`; already-prefixed values are unchanged.
 */
export const toPrefixedBiolinkCategory = (category: string): string => {
  if (!category) return category;
  return category.startsWith('biolink:') ? category : `biolink:${category}`;
};

export const isBiolinkDiseaseCategory = (category: string): boolean =>
  BIOLINK_DISEASE_CATEGORY_SET.has(toPrefixedBiolinkCategory(category));

export const isBiolinkGeneCategory = (category: string): boolean =>
  BIOLINK_GENE_CATEGORY_SET.has(toPrefixedBiolinkCategory(category));

export const isBiolinkChemicalCategory = (category: string): boolean =>
  BIOLINK_CHEMICAL_CATEGORY_SET.has(toPrefixedBiolinkCategory(category));

export const getBiolinkCategoryLabel = (category: string, plural: boolean = false): string | null => {
  const entry = labelMap.get(toPrefixedBiolinkCategory(category));
  if (!entry) return null;
  return plural ? entry.pluralLabel : entry.label;
};

/**
 * Returns a display label for a biolink category, falling back to a formatted
 * version of the raw category string when no known category matches.
 *
 * @param {string} category - The biolink category (prefixed or raw).
 * @param {boolean} plural - Whether to return the plural label.
 * @returns {string} The display label.
 */
export const getBiolinkCategoryDisplay = (category: string, plural: boolean = false): string =>
  getBiolinkCategoryLabel(category, plural) || formatBiolinkTypeString(category);

/**
 * Default Lookup object category given a subject node's category.
 * Chemical/drug subjects look up diseases; everything else looks up chemicals.
 */
export const getDefaultLookupObjectCategory = (
  subjectCategory: string | null | undefined,
): string => {
  if (!subjectCategory) return 'biolink:ChemicalEntity';
  return isBiolinkChemicalCategory(subjectCategory)
    ? 'biolink:Disease'
    : 'biolink:ChemicalEntity';
};
