import { describe, it, expect } from 'vitest';
import {
  getNodeColorBucket,
  getNodeColors,
  NODE_COLORS,
} from './nodeColors';

describe('getNodeColorBucket', () => {
  it('maps the headline types to their own buckets', () => {
    expect(getNodeColorBucket('biolink:Disease')).toBe('disease');
    expect(getNodeColorBucket('biolink:Drug')).toBe('drugChemical');
    expect(getNodeColorBucket('biolink:BiologicalProcess')).toBe('biologicalProcess');
    expect(getNodeColorBucket('biolink:Gene')).toBe('geneProtein');
    expect(getNodeColorBucket('biolink:PhenotypicFeature')).toBe('phenotype');
  });

  it('groups every chemical variant with Drug', () => {
    for (const type of [
      'biolink:ChemicalEntity',
      'biolink:ChemicalMixture',
      'biolink:MolecularMixture',
      'biolink:ComplexMolecularMixture',
      'biolink:SmallMolecule',
      'biolink:Small_Molecule',
      'biolink:MolecularEntity',
    ]) {
      expect(getNodeColorBucket(type)).toBe('drugChemical');
    }
  });

  it('groups the process types, including MolecularActivity', () => {
    for (const type of [
      'biolink:BiologicalProcessOrActivity',
      'biolink:Pathway',
      'biolink:PhysiologicalProcess',
      'biolink:PathologicalProcess',
      'biolink:MolecularActivity',
    ]) {
      expect(getNodeColorBucket(type)).toBe('biologicalProcess');
    }
  });

  it('groups Protein and Polypeptide with Gene', () => {
    expect(getNodeColorBucket('biolink:Protein')).toBe('geneProtein');
    expect(getNodeColorBucket('biolink:Polypeptide')).toBe('geneProtein');
  });

  it('falls back to other for taxon, anatomy, and cell types', () => {
    for (const type of [
      'biolink:OrganismTaxon',
      'biolink:AnatomicalEntity',
      'biolink:GrossAnatomicalStructure',
      'biolink:BiologicalEntity',
      'biolink:Cell',
      'biolink:CellLine',
      'biolink:CellularComponent',
    ]) {
      expect(getNodeColorBucket(type)).toBe('other');
    }
  });

  it('falls back to other for unrecognized, empty, and missing types', () => {
    expect(getNodeColorBucket('biolink:NamedThing')).toBe('other');
    expect(getNodeColorBucket('nonsense')).toBe('other');
    expect(getNodeColorBucket('')).toBe('other');
    expect(getNodeColorBucket(undefined)).toBe('other');
    expect(getNodeColorBucket(null)).toBe('other');
  });

  it('accepts bare types as well as biolink-prefixed ones', () => {
    expect(getNodeColorBucket('Drug')).toBe('drugChemical');
    expect(getNodeColorBucket('Disease')).toBe('disease');
    expect(getNodeColorBucket('PhenotypicFeature')).toBe('phenotype');
  });

  it('accepts the lowercase phenotype alias carried by the icon map', () => {
    expect(getNodeColorBucket('phenotype')).toBe('phenotype');
  });
});

describe('getNodeColors', () => {
  it('returns both a resting and a hover background for every bucket', () => {
    for (const colors of Object.values(NODE_COLORS)) {
      expect(colors.background).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.hoverBackground).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('returns the bucket colors for a type', () => {
    expect(getNodeColors('biolink:Drug')).toEqual(NODE_COLORS.drugChemical);
    expect(getNodeColors('biolink:NamedThing')).toEqual(NODE_COLORS.other);
  });
});
