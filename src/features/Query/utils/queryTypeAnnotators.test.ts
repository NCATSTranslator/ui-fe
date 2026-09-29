import { describe, it, expect } from 'vitest';
import {
  nameResolverGeneAnnotator,
  queryTypeAnnotator,
  speciesFromTaxa,
  GENE_ONLY_TAXA_PARAM,
} from './queryTypeAnnotators';
import {
  buildNameResolverLookupQuery,
  isGeneScopedLookup,
} from './autocompleteFunctions';
import type { NormalizedNode } from '@/features/Query/types/querySubmission';
import { queryTypes } from './queryTypes';

describe('speciesFromTaxa', () => {
  it('maps allowed NCBITaxon CURIEs to display names', () => {
    expect(speciesFromTaxa(['NCBITaxon:9606'])).toBe('Human');
    expect(speciesFromTaxa(['NCBITaxon:10090'])).toBe('Mouse');
    expect(speciesFromTaxa(['NCBITaxon:10116'])).toBe('Rat');
    expect(speciesFromTaxa(['NCBITaxon:7955'])).toBe('Zebrafish');
  });

  it('returns undefined for empty or disallowed taxa', () => {
    expect(speciesFromTaxa(undefined)).toBeUndefined();
    expect(speciesFromTaxa([])).toBeUndefined();
    expect(speciesFromTaxa(['NCBITaxon:7227'])).toBeUndefined();
  });

  it('uses the first allowed taxon when multiple are present', () => {
    expect(speciesFromTaxa(['NCBITaxon:7227', 'NCBITaxon:9606'])).toBe('Human');
  });
});

describe('nameResolverGeneAnnotator', () => {
  const geneNode = (overrides: Partial<NormalizedNode> = {}): NormalizedNode => ({
    curie: 'NCBIGene:7157',
    label: 'TP53',
    synonyms: ['TP53', 'p53'],
    types: ['biolink:Gene'],
    taxa: ['NCBITaxon:9606'],
    ...overrides,
  });

  it('annotates genes with symbol from label and species from taxa', async () => {
    const result = await nameResolverGeneAnnotator([geneNode()]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      curie: 'NCBIGene:7157',
      label: 'TP53',
      symbol: 'TP53',
      species: 'Human',
    });
  });

  it('drops genes without an allowed taxon', async () => {
    const result = await nameResolverGeneAnnotator([
      geneNode({ taxa: ['NCBITaxon:7227'] }),
      geneNode({ curie: 'NCBIGene:1', taxa: [] }),
      geneNode({ curie: 'NCBIGene:2', taxa: undefined }),
    ]);
    expect(result).toEqual([]);
  });

  it('passes non-gene nodes through unchanged', async () => {
    const disease: NormalizedNode = {
      curie: 'MONDO:0005015',
      label: 'diabetes mellitus',
      synonyms: ['diabetes'],
      types: ['biolink:Disease'],
      taxa: [],
    };
    const result = await nameResolverGeneAnnotator([disease, geneNode()]);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(disease);
    expect(result[1]).toMatchObject({ symbol: 'TP53', species: 'Human' });
  });
});

describe('buildNameResolverLookupQuery', () => {
  it('adds only_taxa for gene-only lookups', () => {
    const query = buildNameResolverLookupQuery('TP53', ['Gene'], [], []);
    expect(isGeneScopedLookup(['Gene'])).toBe(true);
    expect(query).toContain('biolink_type=Gene');
    expect(query).toContain(`only_taxa=${GENE_ONLY_TAXA_PARAM}`);
  });

  it('omits only_taxa for disease lookups', () => {
    const query = buildNameResolverLookupQuery('diabetes', ['DiseaseOrPhenotypicFeature'], ['MONDO', 'HP'], []);
    expect(query).not.toContain('only_taxa');
    expect(query).toContain('biolink_type=DiseaseOrPhenotypicFeature');
    expect(query).toContain('only_prefixes=MONDO|HP');
  });

  it('omits only_taxa for mixed Pathfinder/Lookup type lists', () => {
    const query = buildNameResolverLookupQuery('p53', ['Drug', 'Gene', 'Disease'], [], ['UMLS']);
    expect(isGeneScopedLookup(['Drug', 'Gene', 'Disease'])).toBe(false);
    expect(query).not.toContain('only_taxa');
    expect(query).toContain('exclude_prefixes=UMLS');
  });
});

describe('Smart Query gene types wire nameResolverGeneAnnotator', () => {
  it('uses nameResolverGeneAnnotator for gene-input templates only', () => {
    expect(queryTypes[1].functions.annotate).toBe(nameResolverGeneAnnotator);
    expect(queryTypes[2].functions.annotate).toBe(nameResolverGeneAnnotator);
    expect(queryTypes[0].functions.annotate).toBe(queryTypeAnnotator);
    expect(queryTypes[3].functions.annotate).toBe(queryTypeAnnotator);
    expect(queryTypes[4].functions.annotate).toBe(queryTypeAnnotator);
  });
});
