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

const labelMap = new Map(BIOLINK_CATEGORIES.map(c => [c.value, c]));
const rawKeyMap = new Map(BIOLINK_CATEGORIES.map(c => [c.value.replace("biolink:", ""), c]));

export const getBiolinkCategoryLabel = (category: string, plural: boolean = false): string | null => {
  const entry = labelMap.get(category)
    || labelMap.get(`biolink:${category}`)
    || rawKeyMap.get(category);
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
