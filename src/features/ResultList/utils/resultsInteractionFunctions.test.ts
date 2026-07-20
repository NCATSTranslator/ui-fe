import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findStringMatch } from '@/features/ResultList/utils/resultsInteractionFunctions';
import { makePathRank } from '@/features/Core/utils/sortingFunctions';
import { getPathById } from '@/features/ResultList/slices/resultsSlice';
import { FILTERING_CONSTANTS, normalizeSearchTerm } from '@/features/ResultFiltering/utils/filterFunctions';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { Path, PathRank, Result, ResultEdge, ResultNode, ResultSet } from '@/features/ResultList/types/results.d';

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

const makePath = (id: string, subgraph: string[]): Path => ({
  id,
  aras: [],
  subgraph,
  tags: {},
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
