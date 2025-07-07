import { GeneAnnotation, GeneItem, NormalizedNode } from '@/features/Query/types/querySubmission';

/**
 * Annotates normalized nodes based on their type, specifically handling gene nodes.
 * 
 * This function processes an array of normalized nodes and applies type-specific annotations:
 * - NCBIGene nodes are enriched with symbol and taxonomy information from mygene.info API
 * - Other node types are returned unchanged
 * 
 * @param normalizedNodes - Array of normalized nodes to be annotated
 * @returns Promise that resolves to an array of annotated nodes. Gene nodes will have
 *          additional symbol and species information if successfully annotated, while
 *          other nodes remain unchanged. If gene annotation fails, all nodes are
 *          returned unchanged.
 * 
 */
export const queryTypeAnnotator = async (normalizedNodes: NormalizedNode[]): Promise<NormalizedNode[]> => {
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
    fields: [ 'symbol', 'taxid' ]
  };

  const geneInfoRequestOptions: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };

  try {
    const response = await fetch('https://mygene.info/v3/gene', geneInfoRequestOptions);
    const geneAnnotations: GeneAnnotation[] = await response.json();
    const validTaxon: { [key: number]: string } = {
      7955: 'Zebrafish',
      9606: 'Human',
      10090: 'Mouse',
      10116: 'Rat'
    };
    const validGenes: GeneItem[] = [];
    
    // Process only gene annotations that match valid taxon IDs
    geneAnnotations.forEach((annotation) => {
      const species = validTaxon[annotation.taxid];
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
    // If gene annotation fails, return all nodes unchanged
    return Promise.resolve(normalizedNodes);
  }
}