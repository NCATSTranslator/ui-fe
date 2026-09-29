import { GeneAnnotation, GeneItem, GenericItem, NormalizedNode } from '@/features/Query/types/querySubmission';
import { isBiolinkGeneCategory } from '@/features/Query/utils/biolinkCategories';

/** Single source of truth: NCBITaxon CURIE → display species for gene autocomplete. */
const SPECIES_BY_TAXON_CURIE: Record<string, string> = {
  'NCBITaxon:9606': 'Human',
  'NCBITaxon:10090': 'Mouse',
  'NCBITaxon:10116': 'Rat',
  'NCBITaxon:7955': 'Zebrafish',
};

/** Allowed taxa for gene autocomplete (Human, Mouse, Rat, Zebrafish). */
export const ALLOWED_GENE_TAXON_CURIES = Object.keys(SPECIES_BY_TAXON_CURIE);

/** Pipe-separated `only_taxa` value for gene-scoped Name Resolver lookups. */
export const GENE_ONLY_TAXA_PARAM = ALLOWED_GENE_TAXON_CURIES.join('|');

/** mygene.info taxid → display species, derived from SPECIES_BY_TAXON_CURIE. */
const SPECIES_BY_TAXID: Record<number, string> = Object.fromEntries(
  Object.entries(SPECIES_BY_TAXON_CURIE).map(([curie, species]) => [
    Number(curie.split(':')[1]),
    species,
  ]),
);

/**
 * Resolves a display species name from Name Resolver `taxa` CURIEs.
 * Uses the first allowed taxon when multiple are present.
 */
export const speciesFromTaxa = (taxa: string[] | undefined): string | undefined => {
  if (!taxa?.length) return undefined;
  for (const taxon of taxa) {
    const species = SPECIES_BY_TAXON_CURIE[taxon];
    if (species) return species;
  }
  return undefined;
};

/**
 * Annotates gene nodes using Name Resolver fields only (no mygene.info).
 * Uses `label` as symbol and maps `taxa` to a display species.
 * Genes without an allowed taxon are dropped; non-gene nodes pass through.
 */
export const nameResolverGeneAnnotator = async (
  normalizedNodes: NormalizedNode[],
): Promise<GenericItem[]> => {
  const result: GenericItem[] = [];

  for (const node of normalizedNodes) {
    const isGene = node.types.some((type) => isBiolinkGeneCategory(type));
    if (!isGene) {
      result.push(node);
      continue;
    }

    const species = speciesFromTaxa(node.taxa);
    if (!species) continue;

    result.push({
      curie: node.curie,
      label: node.label,
      types: node.types,
      symbol: node.label,
      species,
    } as GeneItem);
  }

  return result;
};

/**
 * Annotates normalized nodes based on their type, specifically handling gene nodes.
 *
 * This function processes an array of normalized nodes and applies type-specific annotations:
 * - NCBIGene nodes are enriched with symbol and taxonomy information from mygene.info API
 * - Other node types are returned unchanged
 *
 * Used for Pathfinder/Lookup mixed autocomplete and non-gene Smart Query types.
 */
export const queryTypeAnnotator = async (normalizedNodes: NormalizedNode[]): Promise<GenericItem[]> => {
  const genes: { [key: string]: GeneItem } = {};
  const nonGeneNodes: NormalizedNode[] = [];

  // Separate NCBIGene nodes from other nodes
  normalizedNodes.forEach((node) => {
    const curie = node.curie;
    const [prefix, id] = curie.split(':');
    if (prefix === 'NCBIGene') {
      genes[id] = { curie: curie, symbol: '', label: node.label, types: ['biolink:Gene'] };
    } else {
      nonGeneNodes.push(node);
    }
  });

  // If no gene nodes, return all nodes unchanged
  if (Object.keys(genes).length === 0) {
    return Promise.resolve(normalizedNodes);
  }

  const body = {
    ids: Object.keys(genes),
    fields: ['symbol', 'taxid'],
  };

  const geneInfoRequestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };

  try {
    const response = await fetch('https://mygene.info/v3/gene', geneInfoRequestOptions);
    const geneAnnotations: GeneAnnotation[] = await response.json();
    const validGenes: GeneItem[] = [];

    // Process only gene annotations that match valid taxon IDs
    geneAnnotations.forEach((annotation) => {
      const species = SPECIES_BY_TAXID[annotation.taxid];
      if (species !== undefined) {
        const gene = genes[annotation._id];
        gene.symbol = annotation.symbol;
        gene.species = species;
        validGenes.push(gene);
      }
    });

    // Combine valid genes with non-gene nodes
    const result = [...validGenes, ...nonGeneNodes];
    return Promise.resolve(result);
  } catch (err) {
    console.error(err);
    // If gene annotation fails, return all nodes unchanged
    return Promise.resolve(normalizedNodes);
  }
};
