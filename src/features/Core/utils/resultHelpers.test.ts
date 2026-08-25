import { describe, it, expect } from 'vitest';
import { getDistinctPredicateEdgeIDs } from '@/features/Core/utils/resultHelpers';
import { makeTestEdge, makeTestResultSet } from '@/features/ResultList/utils/resultTestFixtures';

describe('getDistinctPredicateEdgeIDs', () => {
  it('returns the same list when there is fewer than two edge IDs', () => {
    const rs = makeTestResultSet({ e1: makeTestEdge('e1') });
    expect(getDistinctPredicateEdgeIDs(rs, [])).toEqual([]);
    expect(getDistinctPredicateEdgeIDs(rs, ['e1'])).toEqual(['e1']);
  });

  it('keeps one representative per distinct predicate', () => {
    const rs = makeTestResultSet({
      e1: makeTestEdge('e1', { predicate: 'biolink:related_to' }),
      e2: makeTestEdge('e2', { predicate: 'biolink:interacts_with' }),
      e3: makeTestEdge('e3', { predicate: 'biolink:affects' }),
    });

    expect(getDistinctPredicateEdgeIDs(rs, ['e1', 'e2', 'e3'])).toEqual(['e1', 'e2', 'e3']);
  });

  it('collapses same-predicate edges into a single representative', () => {
    const rs = makeTestResultSet({
      e1: makeTestEdge('e1', { predicate: 'biolink:related_to' }),
      e2: makeTestEdge('e2', { predicate: 'biolink:related_to' }),
      e3: makeTestEdge('e3', { predicate: 'biolink:interacts_with' }),
    });

    expect(getDistinctPredicateEdgeIDs(rs, ['e1', 'e2', 'e3'])).toEqual(['e1', 'e3']);
  });

  it('keeps treats and impacts as distinct raw predicates', () => {
    const rs = makeTestResultSet({
      e1: makeTestEdge('e1', { predicate: 'biolink:treats' }),
      e2: makeTestEdge('e2', { predicate: 'biolink:impacts' }),
    });

    expect(getDistinctPredicateEdgeIDs(rs, ['e1', 'e2'])).toEqual(['e1', 'e2']);
  });
});
