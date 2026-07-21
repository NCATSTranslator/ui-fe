import { describe, it, expect } from 'vitest';
import { applyPredicateFilterDisplayNames, formatPredicateFilterName } from '@/features/ResultFiltering/utils/filterFunctions';
import { Filter } from '@/features/ResultFiltering/types/filters';

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
