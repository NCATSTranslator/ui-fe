import { describe, it, expect } from 'vitest';
import {
  toPrefixedBiolinkCategory,
  getDefaultLookupObjectCategory,
  isBiolinkChemicalCategory,
  isBiolinkDiseaseCategory,
  isBiolinkGeneCategory,
} from './biolinkCategories';

describe('toPrefixedBiolinkCategory', () => {
  it('prefixes bare category names', () => {
    expect(toPrefixedBiolinkCategory('Gene')).toBe('biolink:Gene');
    expect(toPrefixedBiolinkCategory('Disease')).toBe('biolink:Disease');
  });

  it('leaves already-prefixed categories unchanged', () => {
    expect(toPrefixedBiolinkCategory('biolink:Gene')).toBe('biolink:Gene');
  });

  it('returns empty string unchanged', () => {
    expect(toPrefixedBiolinkCategory('')).toBe('');
  });
});

describe('biolink category helpers', () => {
  it('identifies disease categories', () => {
    expect(isBiolinkDiseaseCategory('biolink:Disease')).toBe(true);
    expect(isBiolinkDiseaseCategory('PhenotypicFeature')).toBe(true);
    expect(isBiolinkDiseaseCategory('biolink:Gene')).toBe(false);
  });

  it('identifies gene categories', () => {
    expect(isBiolinkGeneCategory('Gene')).toBe(true);
    expect(isBiolinkGeneCategory('biolink:Protein')).toBe(true);
    expect(isBiolinkGeneCategory('biolink:Disease')).toBe(false);
  });

  it('identifies chemical categories', () => {
    expect(isBiolinkChemicalCategory('Drug')).toBe(true);
    expect(isBiolinkChemicalCategory('biolink:SmallMolecule')).toBe(true);
    expect(isBiolinkChemicalCategory('biolink:Gene')).toBe(false);
  });
});

describe('getDefaultLookupObjectCategory', () => {
  it('defaults chemical/drug subjects to Disease', () => {
    expect(getDefaultLookupObjectCategory('biolink:ChemicalEntity')).toBe('biolink:Disease');
    expect(getDefaultLookupObjectCategory('Drug')).toBe('biolink:Disease');
    expect(getDefaultLookupObjectCategory('biolink:SmallMolecule')).toBe('biolink:Disease');
  });

  it('defaults other subjects to ChemicalEntity', () => {
    expect(getDefaultLookupObjectCategory('biolink:Gene')).toBe('biolink:ChemicalEntity');
    expect(getDefaultLookupObjectCategory('Disease')).toBe('biolink:ChemicalEntity');
    expect(getDefaultLookupObjectCategory('biolink:AnatomicalEntity')).toBe('biolink:ChemicalEntity');
  });

  it('defaults missing subjects to ChemicalEntity', () => {
    expect(getDefaultLookupObjectCategory(null)).toBe('biolink:ChemicalEntity');
    expect(getDefaultLookupObjectCategory(undefined)).toBe('biolink:ChemicalEntity');
  });
});
