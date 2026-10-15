import { describe, it, expect } from 'vitest';
import { applyPredicateFilterDisplayNames, formatPredicateFilterName, propagatesExclusionAcrossCompressionGroups, toggleFilter } from '@/features/ResultFiltering/utils/filterFunctions';
import { Filter } from '@/features/ResultFiltering/types/filters';

// Permissive default: no families propagate. See commented strict-mode logic in
// propagatesExclusionAcrossCompressionGroups to re-enable group-wide propagation.
describe('propagatesExclusionAcrossCompressionGroups', () => {
  it('returns false for all path families in permissive mode', () => {
    expect(propagatesExclusionAcrossCompressionGroups({ id: 'p/ara/agent-a', name: 'Agent A' })).toBe(false);
    expect(propagatesExclusionAcrossCompressionGroups({ id: 'p/pred/treats', name: 'treats' })).toBe(false);
    expect(propagatesExclusionAcrossCompressionGroups({ id: 'p/ev/publication', name: 'Publication' })).toBe(false);
    expect(propagatesExclusionAcrossCompressionGroups({ id: 'p/pc/gene', name: 'Gene' })).toBe(false);
    expect(propagatesExclusionAcrossCompressionGroups({ id: 'p/pt/2', name: '2' })).toBe(false);
  });
});

describe('formatPredicateFilterName', () => {
  it('replaces treat terminology with impact terminology', () => {
    expect(formatPredicateFilterName('treats or applied or studied to treat')).toBe(
      'impacts or applied or studied to impact'
    );
  });

  it('leaves non-treat predicate names unchanged', () => {
    expect(formatPredicateFilterName('biolink:affects')).toBe('biolink:affects');
  });
});

describe('applyPredicateFilterDisplayNames', () => {
  it('transforms pred-family filter names in place', () => {
    const filters: { [key: string]: Filter } = {
      'p/pred/treats or applied or studied to treat': {
        name: 'treats or applied or studied to treat',
        value: '',
        count: 3,
      },
      'p/pc/gene': {
        name: 'Gene',
        value: '',
        count: 1,
      },
    };

    applyPredicateFilterDisplayNames(filters);

    expect(filters['p/pred/treats or applied or studied to treat'].name).toBe(
      'impacts or applied or studied to impact'
    );
    expect(filters['p/pc/gene'].name).toBe('Gene');
  });
});

describe('toggleFilter', () => {
  const gene: Filter = { id: 'p/pc/gene', name: 'Gene', value: 'gene' };
  const drug: Filter = { id: 'p/pc/drug', name: 'Drug', value: 'drug' };

  it('appends a filter that is not yet active', () => {
    const { filters, action } = toggleFilter([gene], drug);
    expect(action).toBe('applied');
    expect(filters).toEqual([gene, drug]);
  });

  it('removes an exact match (same id, value, and negation)', () => {
    const { filters, action } = toggleFilter([gene, drug], { ...drug });
    expect(action).toBe('cleared');
    expect(filters).toEqual([gene]);
  });

  it('replaces a match that differs only in negation, keeping its position', () => {
    const negatedGene = { ...gene, negated: true };
    const { filters, action } = toggleFilter([gene, drug], negatedGene);
    expect(action).toBe('applied');
    expect(filters).toEqual([negatedGene, drug]);
  });

  it('matches values case- and whitespace-insensitively', () => {
    const { filters, action } = toggleFilter([gene], { ...gene, value: '  GENE ' });
    expect(action).toBe('cleared');
    expect(filters).toEqual([]);
  });

  it('does not mutate the active filter list or the toggled filter', () => {
    const active = [gene];
    const { filters } = toggleFilter(active, drug);
    expect(active).toEqual([gene]);
    expect(filters[1]).not.toBe(drug);
  });
});
