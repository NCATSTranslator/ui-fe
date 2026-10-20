import { describe, it, expect } from 'vitest';
import { applyPredicateFilterDisplayNames, formatPredicateFilterName, getEdgeFamilies, getFilterLabel, getPathFamilies, getValidFamilies, groupFilters, isTagFilter, propagatesExclusionAcrossCompressionGroups, toggleFilter } from '@/features/ResultFiltering/utils/filterFunctions';
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

// Edge qualifier families ('eff' = object aspect, 'dir' = object direction) are
// decorated on edges by the backend and promoted to paths, so they must be
// recognized as both path and edge families.
describe('edge qualifier families (eff, dir)', () => {
  const EFF_ACTIVITY = 'p/eff/activity';
  const DIR_INCREASED = 'p/dir/increased';

  it('are valid tag families', () => {
    expect(getValidFamilies()).toContain('eff');
    expect(getValidFamilies()).toContain('dir');
    expect(isTagFilter({ id: EFF_ACTIVITY, name: 'Activity' })).toBe(true);
    expect(isTagFilter({ id: DIR_INCREASED, name: 'Increased' })).toBe(true);
  });

  it('are listed as both path and edge families', () => {
    expect(getPathFamilies()).toEqual(expect.arrayContaining(['eff', 'dir']));
    expect(getEdgeFamilies()).toEqual(expect.arrayContaining(['eff', 'dir']));
  });

  it('have human readable labels', () => {
    expect(getFilterLabel('eff')).toBe('Effect');
    expect(getFilterLabel('dir')).toBe('Effect Direction');
    expect(getFilterLabel({ id: EFF_ACTIVITY, name: 'Activity' })).toBe('Effect');
    expect(getFilterLabel({ id: DIR_INCREASED, name: 'Increased' })).toBe('Effect Direction');
  });

  it('are grouped into their own path facet groups', () => {
    const grouped = groupFilters({
      [EFF_ACTIVITY]: { name: 'Activity' },
      [DIR_INCREASED]: { name: 'Increased' },
      'p/pred/affects': { name: 'affects' },
    }, 'p');

    expect(Object.keys(grouped.eff || {})).toEqual([EFF_ACTIVITY]);
    expect(Object.keys(grouped.dir || {})).toEqual([DIR_INCREASED]);
    expect(Object.keys(grouped.pred || {})).toEqual(['p/pred/affects']);
  });

  it('are grouped into edge facet groups when scoped to edges', () => {
    const grouped = groupFilters({
      'e/eff/activity': { name: 'Activity' },
      'e/dir/decreased': { name: 'Decreased' },
      [EFF_ACTIVITY]: { name: 'Activity' },
    }, 'e');

    expect(Object.keys(grouped.eff || {})).toEqual(['e/eff/activity']);
    expect(Object.keys(grouped.dir || {})).toEqual(['e/dir/decreased']);
  });
});
