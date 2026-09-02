/**
 * Single source of truth for biolink-type icon and color-bucket assignments.
 * entityLinks.tsx and nodeColors.ts both derive lookups from this registry.
 */

import { toPrefixedBiolinkCategory } from '@/features/Query/utils/biolinkCategories';

export type NodeColorBucket =
  | 'disease'
  | 'drugChemical'
  | 'biologicalProcess'
  | 'geneProtein'
  | 'phenotype'
  | 'other';

/** Keys map to the icon components in entityLinks.tsx. */
export type NodeIconKey =
  | 'anatomicalEntity'
  | 'biologicalEntity'
  | 'biologicalProcess'
  | 'chemical'
  | 'disease'
  | 'drug'
  | 'gene'
  | 'pathologicalProcess'
  | 'phenotype'
  | 'physiologicalProcess'
  | 'protein'
  | 'smallMolecule'
  | 'taxon';

export interface BiolinkTypeRegistryEntry {
  icon: NodeIconKey;
  colorBucket: NodeColorBucket;
}

export const BIOLINK_TYPE_REGISTRY: Record<string, BiolinkTypeRegistryEntry> = {
  'biolink:Disease': { icon: 'disease', colorBucket: 'disease' },

  'biolink:Drug': { icon: 'drug', colorBucket: 'drugChemical' },
  'biolink:ChemicalEntity': { icon: 'chemical', colorBucket: 'drugChemical' },
  'biolink:ChemicalMixture': { icon: 'chemical', colorBucket: 'drugChemical' },
  'biolink:MolecularMixture': { icon: 'chemical', colorBucket: 'drugChemical' },
  'biolink:ComplexMolecularMixture': { icon: 'chemical', colorBucket: 'drugChemical' },
  'biolink:SmallMolecule': { icon: 'smallMolecule', colorBucket: 'drugChemical' },
  'biolink:Small_Molecule': { icon: 'smallMolecule', colorBucket: 'drugChemical' },
  'biolink:MolecularEntity': { icon: 'smallMolecule', colorBucket: 'drugChemical' },

  'biolink:BiologicalProcess': { icon: 'biologicalProcess', colorBucket: 'biologicalProcess' },
  'biolink:BiologicalProcessOrActivity': { icon: 'biologicalProcess', colorBucket: 'biologicalProcess' },
  'biolink:Pathway': { icon: 'biologicalProcess', colorBucket: 'biologicalProcess' },
  'biolink:PhysiologicalProcess': { icon: 'physiologicalProcess', colorBucket: 'biologicalProcess' },
  'biolink:PathologicalProcess': { icon: 'pathologicalProcess', colorBucket: 'biologicalProcess' },
  'biolink:MolecularActivity': { icon: 'biologicalProcess', colorBucket: 'biologicalProcess' },

  'biolink:Gene': { icon: 'gene', colorBucket: 'geneProtein' },
  'biolink:Protein': { icon: 'protein', colorBucket: 'geneProtein' },
  'biolink:Polypeptide': { icon: 'protein', colorBucket: 'geneProtein' },

  'phenotype': { icon: 'phenotype', colorBucket: 'phenotype' },
  'biolink:PhenotypicFeature': { icon: 'phenotype', colorBucket: 'phenotype' },

  'biolink:OrganismTaxon': { icon: 'taxon', colorBucket: 'other' },
  'biolink:BiologicalEntity': { icon: 'biologicalEntity', colorBucket: 'other' },
  'biolink:CellLine': { icon: 'biologicalEntity', colorBucket: 'other' },
  'biolink:CellularComponent': { icon: 'biologicalEntity', colorBucket: 'other' },
  'biolink:Cell': { icon: 'biologicalEntity', colorBucket: 'other' },
  'biolink:AnatomicalEntity': { icon: 'anatomicalEntity', colorBucket: 'other' },
  'biolink:GrossAnatomicalStructure': { icon: 'anatomicalEntity', colorBucket: 'other' },
};

export const getRegistryEntry = (
  type: string | undefined | null,
): BiolinkTypeRegistryEntry | null => {
  if (!type) return null;
  return BIOLINK_TYPE_REGISTRY[type] ?? BIOLINK_TYPE_REGISTRY[toPrefixedBiolinkCategory(type)] ?? null;
};
