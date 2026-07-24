import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyFilters, findStringMatch, genPathFilterState } from '@/features/ResultList/utils/resultsInteractionFunctions';
import { getExcludingFilter, makePathRank } from '@/features/Core/utils/sortingFunctions';
import { getPathById } from '@/features/ResultList/slices/resultsSlice';
import { FILTERING_CONSTANTS, normalizeSearchTerm } from '@/features/ResultFiltering/utils/filterFunctions';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { Path, PathRank, Result, ResultEdge, ResultNode, ResultSet } from '@/features/ResultList/types/results.d';
import { getCompressedPaths, getFilteredPathCount, getIsPathFiltered } from '@/features/ResultItem/utils/utilities';

// ---------------------------------------------------------------------------
// Minimal fixture factories
// ---------------------------------------------------------------------------

const makeNode = (id: string, overrides: Partial<ResultNode> = {}): ResultNode => ({
  id,
  annotations: { chemical: {}, disease: {}, gene: {} },
  aras: [],
  curies: [],
  descriptions: [],
  names: [],
  other_names: {},
  provenance: [],
  synonyms: [],
  types: [],
  tags: {},
  ...overrides,
} as ResultNode);

const makeEdge = (id: string, overrides: Partial<ResultEdge> = {}): ResultEdge => ({
  id,
  aras: [],
  is_root: false,
  inferred: false,
  knowledge_level: 'knowledge_assertion',
  metadata: { edge_bindings: [], inverted_id: null, is_root: false },
  object: '',
  predicate: 'biolink:related_to',
  predicate_url: '',
  provenance: [],
  publications: {},
  subject: '',
  support: [],
  tags: {},
  type: 'edge',
  ...overrides,
} as unknown as ResultEdge);

const makePath = (id: string, subgraph: string[], overrides: Partial<Path> = {}): Path => ({
  id,
  aras: [],
  subgraph,
  tags: {},
  ...overrides,
});

const makeResult = (overrides: Partial<Result> = {}): Result => ({
  drug_name: '',
  id: 'result-1',
  object: 'object-node',
  paths: [],
  scores: [],
  subject: 'subject-node',
  tags: {},
  ...overrides,
} as Result);

const makeResultSet = (data: Partial<ResultSet['data']>): ResultSet => ({
  status: 'success',
  data: {
    edges: {},
    errors: {},
    meta: {},
    nodes: {},
    paths: {},
    provenance: {},
    publications: {},
    results: [],
    tags: {},
    trials: {},
    ...data,
  },
} as unknown as ResultSet);

const makeEntityFilter = (value: string, negated = false): Filter => ({
  id: 'g/str',
  name: '',
  value,
  negated,
  includeWeight: FILTERING_CONSTANTS.WEIGHT.LIGHT,
  excludeWeight: FILTERING_CONSTANTS.WEIGHT.HEAVY,
});

const makePathFilter = (id: string, negated = false): Filter => ({
  id,
  name: id,
  value: '',
  negated,
  includeWeight: FILTERING_CONSTANTS.WEIGHT.LIGHT,
  excludeWeight: FILTERING_CONSTANTS.WEIGHT.HEAVY,
});

const PRED_TREATS = 'p/pred/treats';
const PRED_AFFECTS = 'p/pred/affects';
const PRED_CAUSES = 'p/pred/causes';
const PRED_UNRELATED = 'p/pred/unrelated';
const ARA_EXCLUDE = 'p/ara/agent-a';
const ARA_INCLUDE = 'p/ara/agent-b';

/** Runs applyFilters for a single result and returns the full response. */
const runApplyFilters = (rs: ResultSet, result: Result, filters: Filter[]) => {
  const pathFilterState = genPathFilterState(rs);
  return applyFilters(filters, [result], [result], rs, pathFilterState);
};

/** Two compressible paths (same nodes, different predicates) plus tag metadata. */
const buildCompressedFixture = (extraPaths: Record<string, Path> = {}) => {
  const rs = makeResultSet({
    nodes: {
      n1: makeNode('n1'),
      n2: makeNode('n2'),
      n3: makeNode('n3'),
    },
    edges: {
      e1: makeEdge('e1', { predicate: 'biolink:treats', inferred: false }),
      e2: makeEdge('e2', { predicate: 'biolink:affects', inferred: false }),
      e3: makeEdge('e3', { predicate: 'biolink:causes', inferred: false }),
      e4: makeEdge('e4', { predicate: 'biolink:related_to', inferred: false }),
    },
    paths: {
      P1: makePath('P1', ['n1', 'e1', 'n2'], { tags: { [PRED_TREATS]: null } }),
      P2: makePath('P2', ['n1', 'e2', 'n2'], { tags: { [PRED_AFFECTS]: null } }),
      P3: makePath('P3', ['n1', 'e3', 'n2'], { tags: { [PRED_CAUSES]: null } }),
      P4: makePath('P4', ['n1', 'e4', 'n3']),
      ...extraPaths,
    },
    tags: {
      [PRED_TREATS]: { name: 'treats', value: '' },
      [PRED_AFFECTS]: { name: 'affects', value: '' },
      [PRED_CAUSES]: { name: 'causes', value: '' },
      [PRED_UNRELATED]: { name: 'unrelated', value: '' },
      [ARA_EXCLUDE]: { name: 'Agent A', value: '' },
      [ARA_INCLUDE]: { name: 'Agent B', value: '' },
    },
  });
  const result = makeResult({ drug_name: 'Drug', paths: ['P1', 'P2', 'P3', 'P4'] });
  return { rs, result };
};

/** Builds the per-result path-rank map the way _filterResults does. */
const buildPathRanks = (rs: ResultSet, result: Result): Map<string, PathRank> => {
  const ranks = new Map<string, PathRank>();
  for (const p of result.paths) {
    const path = typeof p === 'string' ? getPathById(rs, p) : (p as Path);
    if (path?.id) ranks.set(path.id, makePathRank(path));
  }
  return ranks;
};

const run = (rs: ResultSet, result: Result, filter: Filter) =>
  findStringMatch(rs, result, filter, buildPathRanks(rs, result));

beforeEach(() => {
  // getNodeById/getEdgeById warn on missing lookups; keep test output clean.
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

// ---------------------------------------------------------------------------
// normalizeSearchTerm
// ---------------------------------------------------------------------------

describe('normalizeSearchTerm', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeSearchTerm('  aspirin  ')).toBe('aspirin');
  });
  it('collapses internal whitespace runs', () => {
    expect(normalizeSearchTerm('acetyl   salicylic\tacid')).toBe('acetyl salicylic acid');
  });
  it('returns empty string for whitespace-only input', () => {
    expect(normalizeSearchTerm('   ')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// findStringMatch — shallow (drug_name / subject description)
// ---------------------------------------------------------------------------

describe('findStringMatch — shallow matches', () => {
  const baseRS = () =>
    makeResultSet({ nodes: { 'subject-node': makeNode('subject-node', { descriptions: ['A common pain reliever'] }) } });

  it('matches on drug_name (case-insensitive)', () => {
    const rs = baseRS();
    const result = makeResult({ drug_name: 'Aspirin' });
    expect(run(rs, result, makeEntityFilter('aspirin'))).toBe(true);
    expect(run(rs, result, makeEntityFilter('ASPIRIN'))).toBe(true);
  });

  it('matches on subject node description', () => {
    const rs = baseRS();
    const result = makeResult({ drug_name: 'Aspirin' });
    expect(run(rs, result, makeEntityFilter('pain reliever'))).toBe(true);
  });

  it('tolerates surrounding whitespace in the search term', () => {
    const rs = baseRS();
    const result = makeResult({ drug_name: 'Aspirin' });
    expect(run(rs, result, makeEntityFilter('  aspirin  '))).toBe(true);
  });

  it('returns false when nothing matches', () => {
    const rs = baseRS();
    const result = makeResult({ drug_name: 'Aspirin' });
    expect(run(rs, result, makeEntityFilter('ibuprofen'))).toBe(false);
  });

  it('matches the subject description sourced from annotations (not just descriptions[0])', () => {
    const rs = makeResultSet({
      nodes: {
        'subject-node': makeNode('subject-node', {
          descriptions: [],
          annotations: {
            chemical: { descriptions: ['Inhibits prostaglandin synthesis'] },
            disease: {},
            gene: {},
          },
        } as unknown as Partial<ResultNode>),
      },
    });
    const result = makeResult({ drug_name: 'Aspirin' });
    expect(run(rs, result, makeEntityFilter('prostaglandin synthesis'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// findStringMatch — path object matches (include)
// ---------------------------------------------------------------------------

describe('findStringMatch — path content (include)', () => {
  // result -> path P1: [subject-node, e0, target-node]
  const setup = (targetNode: ResultNode, edge?: ResultEdge) => {
    const rs = makeResultSet({
      nodes: {
        'subject-node': makeNode('subject-node'),
        'target-node': targetNode,
      },
      edges: { e0: edge ?? makeEdge('e0') },
      paths: { P1: makePath('P1', ['subject-node', 'e0', 'target-node']) },
    });
    const result = makeResult({ drug_name: 'Aspirin', paths: ['P1'] });
    return { rs, result };
  };

  it('matches a node name inside a path', () => {
    const { rs, result } = setup(makeNode('target-node', { names: ['Cyclooxygenase'] }));
    const ranks = buildPathRanks(rs, result);
    expect(findStringMatch(rs, result, makeEntityFilter('cyclooxygenase'), ranks)).toBe(true);
    expect(ranks.get('P1')!.rank).toBeLessThan(0);
  });

  it('matches a node curie inside a path', () => {
    const { rs, result } = setup(makeNode('target-node', { curies: ['NCBIGene:5742'] }));
    expect(run(rs, result, makeEntityFilter('ncbigene:5742'))).toBe(true);
  });

  it('matches an edge predicate inside a path', () => {
    const { rs, result } = setup(makeNode('target-node'), makeEdge('e0', { predicate: 'biolink:interacts_with' }));
    expect(run(rs, result, makeEntityFilter('interacts_with'))).toBe(true);
  });

  it('accumulates rank for every matching element in a path (not just the first)', () => {
    // Path P1 has three matching elements: node, edge predicate, node.
    const rs = makeResultSet({
      nodes: {
        'subject-node': makeNode('subject-node'),
        na: makeNode('na', { names: ['COX-1'] }),
        nb: makeNode('nb', { names: ['COX-2'] }),
      },
      edges: { e0: makeEdge('e0', { predicate: 'biolink:cox_pathway' }) },
      paths: { P1: makePath('P1', ['na', 'e0', 'nb']) },
    });
    const result = makeResult({ drug_name: 'Aspirin', paths: ['P1'] });
    const ranks = buildPathRanks(rs, result);

    expect(findStringMatch(rs, result, makeEntityFilter('cox'), ranks)).toBe(true);
    // three matches → three LIGHT decrements
    expect(ranks.get('P1')!.rank).toBe(-3 * FILTERING_CONSTANTS.WEIGHT.LIGHT);
  });
});

// ---------------------------------------------------------------------------
// findStringMatch — exclude semantics ("hide matching paths only")
// ---------------------------------------------------------------------------

describe('findStringMatch — exclude', () => {
  it('returns true (exclude whole result) on a shallow name match', () => {
    const rs = makeResultSet({ nodes: { 'subject-node': makeNode('subject-node') } });
    const result = makeResult({ drug_name: 'Aspirin' });
    expect(run(rs, result, makeEntityFilter('aspirin', true))).toBe(true);
  });

  it('does NOT exclude the whole result on a path-only match, but ranks the path HEAVY', () => {
    const rs = makeResultSet({
      nodes: {
        'subject-node': makeNode('subject-node'),
        'target-node': makeNode('target-node', { names: ['Ibuprofen'] }),
      },
      edges: { e0: makeEdge('e0') },
      paths: { P1: makePath('P1', ['subject-node', 'e0', 'target-node']) },
    });
    const result = makeResult({ drug_name: 'Aspirin', paths: ['P1'] });
    const ranks = buildPathRanks(rs, result);

    // path content match for an exclude filter must not remove the whole result
    expect(findStringMatch(rs, result, makeEntityFilter('ibuprofen', true), ranks)).toBe(false);
    // the matching path is ranked heavily so it gets hidden downstream
    expect(ranks.get('P1')!.rank).toBe(FILTERING_CONSTANTS.WEIGHT.HEAVY);
  });
});

// ---------------------------------------------------------------------------
// findStringMatch — paths are ranked independently
// ---------------------------------------------------------------------------

describe('findStringMatch — path independence', () => {
  it('ranks only the path that matches, leaving sibling paths unranked', () => {
    const rs = makeResultSet({
      nodes: {
        'subject-node': makeNode('subject-node'),
        n1: makeNode('n1'),
        n2: makeNode('n2', { names: ['Prostaglandin'] }),
        n3: makeNode('n3'),
      },
      edges: {
        e0: makeEdge('e0', { predicate: 'biolink:related_to' }),
        e1: makeEdge('e1'),
      },
      paths: {
        P1: makePath('P1', ['subject-node', 'e0', 'n1']),
        P2: makePath('P2', ['subject-node', 'e1', 'n2']),
      },
    });
    const result = makeResult({ drug_name: 'Aspirin', paths: ['P1', 'P2'] });
    const ranks = buildPathRanks(rs, result);

    expect(findStringMatch(rs, result, makeEntityFilter('prostaglandin'), ranks)).toBe(true);
    expect(ranks.get('P2')!.rank).toBeLessThan(0);
    expect(ranks.get('P1')!.rank).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getExcludingFilter — path exclusion helper
// ---------------------------------------------------------------------------

describe('getExcludingFilter', () => {
  it('returns the matching negated filter when the path carries that tag', () => {
    const path = makePath('P1', ['n1', 'e1', 'n2'], { tags: { [PRED_TREATS]: null } });
    const filter = makePathFilter(PRED_TREATS, true);

    expect(getExcludingFilter(path, [filter], false)).toBe(filter);
  });

  it('returns null when the path does not carry the excluded tag', () => {
    const path = makePath('P1', ['n1', 'e1', 'n2'], { tags: { [PRED_TREATS]: null } });
    const filter = makePathFilter(PRED_AFFECTS, true);

    expect(getExcludingFilter(path, [filter], false)).toBeNull();
  });

  it('ignores negated ARA filters when an ARA inclusion is active', () => {
    const path = makePath('P1', ['n1', 'e1', 'n2'], { tags: { [ARA_EXCLUDE]: null } });
    const araExclude = makePathFilter(ARA_EXCLUDE, true);

    expect(getExcludingFilter(path, [araExclude], true)).toBeNull();
  });

  it('applies negated ARA filters when no ARA inclusion is active', () => {
    const path = makePath('P1', ['n1', 'e1', 'n2'], { tags: { [ARA_EXCLUDE]: null } });
    const araExclude = makePathFilter(ARA_EXCLUDE, true);

    expect(getExcludingFilter(path, [araExclude], false)).toBe(araExclude);
  });
});

// ---------------------------------------------------------------------------
// applyFilters — uncompressed path predicate filtering
// ---------------------------------------------------------------------------

describe('applyFilters — uncompressed path predicate filtering', () => {
  const buildSinglePathFixture = () => {
    const rs = makeResultSet({
      nodes: { n1: makeNode('n1'), n2: makeNode('n2') },
      edges: { e1: makeEdge('e1', { predicate: 'biolink:treats', inferred: false }) },
      paths: {
        P1: makePath('P1', ['n1', 'e1', 'n2'], { tags: { [PRED_TREATS]: null } }),
      },
      tags: { [PRED_TREATS]: { name: 'treats', value: '' } },
    });
    const result = makeResult({ drug_name: 'Drug', paths: ['P1'] });
    return { rs, result };
  };

  it('filters a single path when its predicate is excluded', () => {
    const { rs, result } = buildSinglePathFixture();
    const { updatedPathFilterState, results } = runApplyFilters(rs, result, [
      makePathFilter(PRED_TREATS, true),
    ]);

    expect(updatedPathFilterState.P1).toBe(true);
    expect(getIsPathFiltered(getPathById(rs, 'P1')!, updatedPathFilterState)).toBe(true);
    expect(results).toHaveLength(0);
  });

  it('keeps a single path visible when its predicate is included', () => {
    const { rs, result } = buildSinglePathFixture();
    const { updatedPathFilterState, results } = runApplyFilters(rs, result, [
      makePathFilter(PRED_TREATS, false),
    ]);

    expect(updatedPathFilterState.P1).toBe(false);
    expect(getIsPathFiltered(getPathById(rs, 'P1')!, updatedPathFilterState)).toBe(false);
    expect(results).toHaveLength(1);
  });

  it('filters a single path when an included predicate is not present', () => {
    const { rs, result } = buildSinglePathFixture();
    const { updatedPathFilterState, results } = runApplyFilters(rs, result, [
      makePathFilter(PRED_AFFECTS, false),
    ]);

    expect(updatedPathFilterState.P1).toBe(true);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// applyFilters — compressed path predicate filtering
// ---------------------------------------------------------------------------

describe('applyFilters — compressed path predicate filtering', () => {
  const buildTwoMemberFixture = () => {
    const rs = makeResultSet({
      nodes: { n1: makeNode('n1'), n2: makeNode('n2') },
      edges: {
        e1: makeEdge('e1', { predicate: 'biolink:treats', inferred: false }),
        e2: makeEdge('e2', { predicate: 'biolink:affects', inferred: false }),
      },
      paths: {
        P1: makePath('P1', ['n1', 'e1', 'n2'], { tags: { [PRED_TREATS]: null } }),
        P2: makePath('P2', ['n1', 'e2', 'n2'], { tags: { [PRED_AFFECTS]: null } }),
      },
      tags: {
        [PRED_TREATS]: { name: 'treats', value: '' },
        [PRED_AFFECTS]: { name: 'affects', value: '' },
        [PRED_UNRELATED]: { name: 'unrelated', value: '' },
      },
    });
    const result = makeResult({ drug_name: 'Drug', paths: ['P1', 'P2'] });
    return { rs, result };
  };

  it('propagates predicate exclusion across compressed path members', () => {
    const { rs, result } = buildTwoMemberFixture();
    const { updatedPathFilterState } = runApplyFilters(rs, result, [makePathFilter(PRED_TREATS, true)]);

    expect(updatedPathFilterState.P1).toBe(true);
    expect(updatedPathFilterState.P2).toBe(true);

    const [compressedPath] = getCompressedPaths(rs, ['P1', 'P2']);
    expect(getIsPathFiltered(compressedPath, updatedPathFilterState)).toBe(true);
  });

  it('keeps compressed path visible when excluding a predicate not present on any member', () => {
    const { rs, result } = buildTwoMemberFixture();
    const { updatedPathFilterState, results } = runApplyFilters(rs, result, [
      makePathFilter(PRED_UNRELATED, true),
    ]);

    expect(updatedPathFilterState.P1).toBe(false);
    expect(updatedPathFilterState.P2).toBe(false);

    const [compressedPath] = getCompressedPaths(rs, ['P1', 'P2']);
    expect(getIsPathFiltered(compressedPath, updatedPathFilterState)).toBe(false);
    expect(results).toHaveLength(1);
  });

  it('keeps compressed path visible when including a predicate present on any member (OR)', () => {
    const { rs, result } = buildTwoMemberFixture();
    const { updatedPathFilterState } = runApplyFilters(rs, result, [makePathFilter(PRED_TREATS, false)]);

    expect(updatedPathFilterState.P1).toBe(false);

    const [compressedPath] = getCompressedPaths(rs, ['P1', 'P2']);
    expect(getIsPathFiltered(compressedPath, updatedPathFilterState)).toBe(false);
  });

  it('keeps compressed path visible when only the sibling member matches an included predicate', () => {
    const { rs, result } = buildTwoMemberFixture();
    const { updatedPathFilterState } = runApplyFilters(rs, result, [makePathFilter(PRED_AFFECTS, false)]);

    expect(updatedPathFilterState.P2).toBe(false);

    const [compressedPath] = getCompressedPaths(rs, ['P1', 'P2']);
    expect(getIsPathFiltered(compressedPath, updatedPathFilterState)).toBe(false);
  });

  it('keeps compressed path visible when any of multiple included predicates matches (OR)', () => {
    const { rs, result } = buildTwoMemberFixture();
    const { updatedPathFilterState } = runApplyFilters(rs, result, [
      makePathFilter(PRED_TREATS, false),
      makePathFilter(PRED_AFFECTS, false),
    ]);

    const [compressedPath] = getCompressedPaths(rs, ['P1', 'P2']);
    expect(getIsPathFiltered(compressedPath, updatedPathFilterState)).toBe(false);
  });

  it('hides compressed path when an included predicate is absent from all members', () => {
    const { rs, result } = buildTwoMemberFixture();
    const { updatedPathFilterState, results } = runApplyFilters(rs, result, [
      makePathFilter(PRED_UNRELATED, false),
    ]);

    const [compressedPath] = getCompressedPaths(rs, ['P1', 'P2']);
    expect(getIsPathFiltered(compressedPath, updatedPathFilterState)).toBe(true);
    expect(results).toHaveLength(0);
  });

  it('propagates exclusion across a three-member compression group', () => {
    const { rs, result } = buildCompressedFixture();
    const compressibleResult = makeResult({ drug_name: 'Drug', paths: ['P1', 'P2', 'P3'] });
    const { updatedPathFilterState } = runApplyFilters(rs, compressibleResult, [
      makePathFilter(PRED_CAUSES, true),
    ]);

    expect(updatedPathFilterState.P1).toBe(true);
    expect(updatedPathFilterState.P2).toBe(true);
    expect(updatedPathFilterState.P3).toBe(true);

    const [compressedPath] = getCompressedPaths(rs, ['P1', 'P2', 'P3']);
    expect(compressedPath.compressedIDs?.length).toBeGreaterThan(1);
    expect(getIsPathFiltered(compressedPath, updatedPathFilterState)).toBe(true);
  });

  it('does not propagate exclusion to paths with a different node sequence', () => {
    const { rs, result } = buildCompressedFixture();
    const { updatedPathFilterState } = runApplyFilters(rs, result, [makePathFilter(PRED_TREATS, true)]);

    expect(updatedPathFilterState.P1).toBe(true);
    expect(updatedPathFilterState.P2).toBe(true);
    expect(updatedPathFilterState.P4).toBe(false);

    expect(getIsPathFiltered(getPathById(rs, 'P4')!, updatedPathFilterState)).toBe(false);
  });

  it('keeps the result when a non-compressed sibling path remains visible', () => {
    const { rs, result } = buildCompressedFixture();
    const { results } = runApplyFilters(rs, result, [makePathFilter(PRED_TREATS, true)]);

    expect(results).toHaveLength(1);
  });

  it('removes the result when every path is filtered out', () => {
    const { rs, result } = buildTwoMemberFixture();
    const { results } = runApplyFilters(rs, result, [makePathFilter(PRED_TREATS, true)]);

    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// applyFilters — filtered path count consistency
// ---------------------------------------------------------------------------

describe('applyFilters — filtered path count consistency', () => {
  it('counts all compressed member IDs as filtered after exclusion propagation', () => {
    const { rs, result } = buildCompressedFixture();
    const compressibleResult = makeResult({ drug_name: 'Drug', paths: ['P1', 'P2'] });
    const { updatedPathFilterState } = runApplyFilters(rs, compressibleResult, [
      makePathFilter(PRED_AFFECTS, true),
    ]);

    const compressedPaths = getCompressedPaths(rs, ['P1', 'P2']);
    const filteredCount = getFilteredPathCount(compressedPaths, updatedPathFilterState);

    expect(filteredCount).toBe(2);
  });

  it('counts zero filtered paths when exclusion does not match any member', () => {
    const { rs, result } = buildCompressedFixture();
    const compressibleResult = makeResult({ drug_name: 'Drug', paths: ['P1', 'P2'] });
    const { updatedPathFilterState } = runApplyFilters(rs, compressibleResult, [
      makePathFilter(PRED_UNRELATED, true),
    ]);

    const compressedPaths = getCompressedPaths(rs, ['P1', 'P2']);
    expect(getFilteredPathCount(compressedPaths, updatedPathFilterState)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getIsPathFiltered — compressed display semantics
// ---------------------------------------------------------------------------

describe('getIsPathFiltered — compressed display semantics', () => {
  it('requires every compressed member to be filtered before hiding the display path', () => {
    const path = makePath('P1', ['n1', 'e1', 'n2'], {
      compressedIDs: ['P1', 'P2'],
    });
    const pathFilterState = { P1: true, P2: false };

    expect(getIsPathFiltered(path, pathFilterState)).toBe(false);
  });

  it('hides the display path when every compressed member is filtered', () => {
    const path = makePath('P1', ['n1', 'e1', 'n2'], {
      compressedIDs: ['P1', 'P2'],
    });
    const pathFilterState = { P1: true, P2: true };

    expect(getIsPathFiltered(path, pathFilterState)).toBe(true);
  });

  it('uses a single member state for uncompressed paths', () => {
    const path = makePath('P1', ['n1', 'e1', 'n2'], { compressedIDs: ['P1'] });
    const pathFilterState = { P1: true };

    expect(getIsPathFiltered(path, pathFilterState)).toBe(true);
  });
});
