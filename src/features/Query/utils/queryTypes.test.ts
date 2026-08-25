import { describe, it, expect } from 'vitest';
import {
  getQueryTypeForCategory,
  isUnsupportedSmartQueryCategory,
  queryTypes,
} from './queryTypes';

describe('getQueryTypeForCategory', () => {
  it('maps disease categories to the drug/disease query', () => {
    expect(getQueryTypeForCategory('biolink:Disease')).toMatchObject({ filterType: 'DiseaseOrPhenotypicFeature' });
    expect(getQueryTypeForCategory('Disease')).toMatchObject({ filterType: 'DiseaseOrPhenotypicFeature' });
    expect(getQueryTypeForCategory('biolink:PhenotypicFeature')).toMatchObject({ filterType: 'DiseaseOrPhenotypicFeature' });
    expect(getQueryTypeForCategory('biolink:DiseaseOrPhenotypicFeature')).toMatchObject({ filterType: 'DiseaseOrPhenotypicFeature' });
  });

  it('maps gene categories to the increased gene query', () => {
    expect(getQueryTypeForCategory('biolink:Gene')).toMatchObject({ filterType: 'Gene', direction: 'increased' });
    expect(getQueryTypeForCategory('Gene')).toMatchObject({ filterType: 'Gene', direction: 'increased' });
    expect(getQueryTypeForCategory('biolink:Protein')).toMatchObject({ filterType: 'Gene', direction: 'increased' });
  });

  it('maps chemical categories to the increased chemical query', () => {
    expect(getQueryTypeForCategory('biolink:SmallMolecule')).toMatchObject({ filterType: 'SmallMolecule', direction: 'increased' });
    expect(getQueryTypeForCategory('biolink:ChemicalEntity')).toMatchObject({ filterType: 'SmallMolecule', direction: 'increased' });
    expect(getQueryTypeForCategory('Drug')).toMatchObject({ filterType: 'SmallMolecule', direction: 'increased' });
  });

  it('returns null for unmapped categories', () => {
    expect(getQueryTypeForCategory('biolink:AnatomicalEntity')).toBeNull();
    expect(getQueryTypeForCategory('biolink:BiologicalProcess')).toBeNull();
    expect(getQueryTypeForCategory(null)).toBeNull();
    expect(getQueryTypeForCategory(undefined)).toBeNull();
    expect(getQueryTypeForCategory('')).toBeNull();
  });
});

describe('isUnsupportedSmartQueryCategory', () => {
  it('returns false when category is missing', () => {
    expect(isUnsupportedSmartQueryCategory(null)).toBe(false);
    expect(isUnsupportedSmartQueryCategory(undefined)).toBe(false);
    expect(isUnsupportedSmartQueryCategory('')).toBe(false);
  });

  it('returns false for supported categories', () => {
    expect(isUnsupportedSmartQueryCategory('biolink:Gene')).toBe(false);
  });

  it('returns true for present but unmapped categories', () => {
    expect(isUnsupportedSmartQueryCategory('biolink:AnatomicalEntity')).toBe(true);
  });
});

describe('queryTypes defaults', () => {
  it('uses the disease query as the first fallback type', () => {
    expect(queryTypes[0].filterType).toBe('DiseaseOrPhenotypicFeature');
  });
});
