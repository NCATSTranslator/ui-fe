import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { applyFilters, findStringMatch, genPathFilterState, getItemStringMatchLocations, logStringMatch, setStringMatchLogging } from '@/features/ResultList/utils/resultsInteractionFunctions';
import { getExcludingFilter, makePathRank, updatePathRanks } from '@/features/Core/utils/sortingFunctions';
import { getPathById } from '@/features/ResultList/slices/resultsSlice';
import { FILTERING_CONSTANTS, normalizeSearchTerm } from '@/features/ResultFiltering/utils/filterFunctions';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { EntityTags, Path, PathRank, Result, ResultEdge, ResultNode, ResultSet, ResultSetTags, TagDescription, TagObject } from '@/features/ResultList/types/results.d';
import { getCompressedPaths, getFormattedPaths, getIsPathFiltered, getIsPathIdFiltered, getPathRank } from '@/features/ResultItem/utils/utilities';

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
  knowledge_level: 'knowledge_assertion',
  metadata: { edge_bindings: [], inverted_id: null, is_root: false },
  object: '',
  predicate: 'biolink:related_to',
  predicate_url: '',
  provenance: [],
  publications: {},
  subject: '',
  tags: {},
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

const makeTagDescription = (name: string): TagDescription => ({ name, description: '' });

const makePathTag = (id: string, name: string): TagObject => ({
  id,
  description: makeTagDescription(name),
});

const pathTags = (tags: Record<string, string>): EntityTags =>
  Object.fromEntries(Object.entries(tags).map(([id, name]) => [id, makePathTag(id, name)]));

const resultSetTags = (tags: Record<string, string>): ResultSetTags =>
  Object.fromEntries(Object.entries(tags).map(([id, name]) => [id, makeTagDescription(name)]));

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
      e1: makeEdge('e1', { predicate: 'biolink:treats' }),
      e2: makeEdge('e2', { predicate: 'biolink:affects' }),
      e3: makeEdge('e3', { predicate: 'biolink:causes' }),
      e4: makeEdge('e4', { predicate: 'biolink:related_to' }),
    },
    paths: {
      P1: makePath('P1', ['n1', 'e1', 'n2'], { tags: pathTags({ [PRED_TREATS]: 'treats' }) }),
      P2: makePath('P2', ['n1', 'e2', 'n2'], { tags: pathTags({ [PRED_AFFECTS]: 'affects' }) }),
      P3: makePath('P3', ['n1', 'e3', 'n2'], { tags: pathTags({ [PRED_CAUSES]: 'causes' }) }),
      P4: makePath('P4', ['n1', 'e4', 'n3']),
      ...extraPaths,
    },
    tags: resultSetTags({
      [PRED_TREATS]: 'treats',
      [PRED_AFFECTS]: 'affects',
      [PRED_CAUSES]: 'causes',
      [PRED_UNRELATED]: 'unrelated',
      [ARA_EXCLUDE]: 'Agent A',
      [ARA_INCLUDE]: 'Agent B',
    }),
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
  vi.spyOn(console, 'log').mockImplementation(() => {});
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
// getItemStringMatchLocations / logStringMatch
// ---------------------------------------------------------------------------

describe('getItemStringMatchLocations', () => {
  it('reports a node name match', () => {
    const node = makeNode('n1', { names: ['Cyclooxygenase'] });
    expect(getItemStringMatchLocations(node, 'cyclo')).toEqual([
      { field: 'node_name', value: 'Cyclooxygenase', itemId: 'n1' },
    ]);
  });

  it('reports a node description match', () => {
    const node = makeNode('n1', { descriptions: ['Inhibits prostaglandin synthesis'] });
    expect(getItemStringMatchLocations(node, 'prostaglandin')).toEqual([
      { field: 'node_description', value: 'Inhibits prostaglandin synthesis', itemId: 'n1' },
    ]);
  });

  it('reports matching curies', () => {
    const node = makeNode('n1', { curies: ['NCBIGene:5742', 'HGNC:9604'] });
    expect(getItemStringMatchLocations(node, 'ncbigene')).toEqual([
      { field: 'node_curie', value: 'NCBIGene:5742', itemId: 'n1' },
    ]);
  });

  it('reports an edge predicate match', () => {
    const edge = makeEdge('e0', { predicate: 'biolink:interacts_with' });
    expect(getItemStringMatchLocations(edge, 'interacts')).toEqual([
      { field: 'edge_predicate', value: 'biolink:interacts_with', itemId: 'e0' },
    ]);
  });

  it('reports every matching field on the same node', () => {
    const node = makeNode('n1', {
      names: ['COX-1'],
      descriptions: ['A COX enzyme'],
      curies: ['NCBIGene:cox'],
    });
    expect(getItemStringMatchLocations(node, 'cox')).toEqual([
      { field: 'node_name', value: 'COX-1', itemId: 'n1' },
      { field: 'node_description', value: 'A COX enzyme', itemId: 'n1' },
      { field: 'node_curie', value: 'NCBIGene:cox', itemId: 'n1' },
    ]);
  });

  it('returns no locations for an empty term', () => {
    const node = makeNode('n1', { names: ['Cyclooxygenase'] });
    expect(getItemStringMatchLocations(node, '')).toEqual([]);
  });

  it('stops at the first matching field when firstOnly is set', () => {
    const node = makeNode('n1', {
      names: ['COX-1'],
      descriptions: ['A COX enzyme'],
      curies: ['NCBIGene:cox'],
    });
    expect(getItemStringMatchLocations(node, 'cox', true)).toEqual([
      { field: 'node_name', value: 'COX-1', itemId: 'n1' },
    ]);
  });

  it('stops at the first matching curie when firstOnly is set', () => {
    const node = makeNode('n1', { curies: ['NCBIGene:cox1', 'NCBIGene:cox2'] });
    expect(getItemStringMatchLocations(node, 'cox', true)).toEqual([
      { field: 'node_curie', value: 'NCBIGene:cox1', itemId: 'n1' },
    ]);
  });
});

describe('logStringMatch', () => {
  afterEach(() => {
    setStringMatchLogging(false);
  });

  it('does not log when logging is off', () => {
    const result = makeResult({ drug_name: 'Aspirin', id: 'result-1' });
    logStringMatch('aspirin', result, { field: 'drug_name', value: 'Aspirin' });
    expect(console.log).not.toHaveBeenCalled();
  });

  it('logs the match site to the console when enabled', () => {
    setStringMatchLogging(true);
    const result = makeResult({ drug_name: 'Aspirin', id: 'result-1' });
    logStringMatch('aspirin', result, { field: 'drug_name', value: 'Aspirin' });
    expect(console.log).toHaveBeenCalledWith('[text search] match found', {
      term: 'aspirin',
      field: 'drug_name',
      value: 'Aspirin',
      result: 'Aspirin',
      resultId: 'result-1',
      pathId: undefined,
      itemId: undefined,
    });
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

  it.each([
    ['matches on subject node description', 'pain reliever', true],
    ['tolerates surrounding whitespace in the search term', '  aspirin  ', true],
    ['returns false when nothing matches', 'ibuprofen', false],
  ])('%s', (_name, term, expected) => {
    const rs = baseRS();
    const result = makeResult({ drug_name: 'Aspirin' });
    expect(run(rs, result, makeEntityFilter(term))).toBe(expected);
  });

  it('matches the subject description sourced from annotations (not just descriptions[0])', () => {
    const rs = makeResultSet({
      nodes: {
        'subject-node': makeNode('subject-node', {
          descriptions: [],
          annotations: {
            chemical: { descriptions: { value: ['Inhibits prostaglandin synthesis'], metadata: { sources: [] } } },
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

  it('credits a path once per text filter, however many of its elements match', () => {
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

    const filter = makeEntityFilter('cox');

    expect(findStringMatch(rs, result, filter, ranks)).toBe(true);
    // three matching elements, but one filter → one LIGHT decrement
    expect(ranks.get('P1')!.rank).toBe(-1 * FILTERING_CONSTANTS.WEIGHT.LIGHT);
    expect([...ranks.get('P1')!.matched]).toEqual([filter]);
  });
});

// ---------------------------------------------------------------------------
// findStringMatch — match logging
// ---------------------------------------------------------------------------

describe('findStringMatch — match logging', () => {
  // result -> path P1: [subject-node, e0, target-node]; target matches "cox" on name and curie
  const setup = () => {
    const rs = makeResultSet({
      nodes: {
        'subject-node': makeNode('subject-node'),
        'target-node': makeNode('target-node', { names: ['COX-1'], curies: ['NCBIGene:cox'] }),
      },
      edges: { e0: makeEdge('e0') },
      paths: { P1: makePath('P1', ['subject-node', 'e0', 'target-node']) },
    });
    const result = makeResult({ drug_name: 'Aspirin', id: 'result-1', paths: ['P1'] });
    return { rs, result };
  };

  afterEach(() => {
    setStringMatchLogging(false);
  });

  it('logs every matching field on a path with its path and item ids', () => {
    setStringMatchLogging(true);
    const { rs, result } = setup();
    expect(run(rs, result, makeEntityFilter('cox'))).toBe(true);

    expect(console.log).toHaveBeenCalledWith('[text search] match found', expect.objectContaining({
      field: 'node_name', value: 'COX-1', resultId: 'result-1', pathId: 'P1', itemId: 'target-node',
    }));
    expect(console.log).toHaveBeenCalledWith('[text search] match found', expect.objectContaining({
      field: 'node_curie', value: 'NCBIGene:cox', resultId: 'result-1', pathId: 'P1', itemId: 'target-node',
    }));
  });

  it('logs a shallow drug_name match without a path id', () => {
    setStringMatchLogging(true);
    const { rs, result } = setup();
    expect(run(rs, result, makeEntityFilter('aspirin'))).toBe(true);

    expect(console.log).toHaveBeenCalledWith('[text search] match found', expect.objectContaining({
      field: 'drug_name', value: 'Aspirin', resultId: 'result-1', pathId: undefined,
    }));
  });

  it('ranks paths the same whether logging is on or off', () => {
    // Logging collects every matching field per item; rank must still drop once per item.
    const { rs, result } = setup();
    const quietRanks = buildPathRanks(rs, result);
    findStringMatch(rs, result, makeEntityFilter('cox'), quietRanks);

    setStringMatchLogging(true);
    const loggedRanks = buildPathRanks(rs, result);
    findStringMatch(rs, result, makeEntityFilter('cox'), loggedRanks);

    expect(loggedRanks.get('P1')!.rank).toBe(-1 * FILTERING_CONSTANTS.WEIGHT.LIGHT);
    expect(loggedRanks.get('P1')!.rank).toBe(quietRanks.get('P1')!.rank);
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
    const path = makePath('P1', ['n1', 'e1', 'n2'], { tags: pathTags({ [PRED_TREATS]: 'treats' }) });
    const filter = makePathFilter(PRED_TREATS, true);

    expect(getExcludingFilter(path, [filter], false)).toBe(filter);
  });

  it('returns null when the path does not carry the excluded tag', () => {
    const path = makePath('P1', ['n1', 'e1', 'n2'], { tags: pathTags({ [PRED_TREATS]: 'treats' }) });
    const filter = makePathFilter(PRED_AFFECTS, true);

    expect(getExcludingFilter(path, [filter], false)).toBeNull();
  });

  it('ignores negated ARA filters when an ARA inclusion is active', () => {
    const path = makePath('P1', ['n1', 'e1', 'n2'], { tags: pathTags({ [ARA_EXCLUDE]: 'Agent A' }) });
    const araExclude = makePathFilter(ARA_EXCLUDE, true);

    expect(getExcludingFilter(path, [araExclude], true)).toBeNull();
  });

  it('applies negated ARA filters when no ARA inclusion is active', () => {
    const path = makePath('P1', ['n1', 'e1', 'n2'], { tags: pathTags({ [ARA_EXCLUDE]: 'Agent A' }) });
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
      edges: { e1: makeEdge('e1', { predicate: 'biolink:treats' }) },
      paths: {
        P1: makePath('P1', ['n1', 'e1', 'n2'], { tags: pathTags({ [PRED_TREATS]: 'treats' }) }),
      },
      tags: resultSetTags({ [PRED_TREATS]: 'treats' }),
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
        e1: makeEdge('e1', { predicate: 'biolink:treats' }),
        e2: makeEdge('e2', { predicate: 'biolink:affects' }),
      },
      paths: {
        P1: makePath('P1', ['n1', 'e1', 'n2'], { tags: pathTags({ [PRED_TREATS]: 'treats' }) }),
        P2: makePath('P2', ['n1', 'e2', 'n2'], { tags: pathTags({ [PRED_AFFECTS]: 'affects' }) }),
      },
      tags: resultSetTags({
        [PRED_TREATS]: 'treats',
        [PRED_AFFECTS]: 'affects',
        [PRED_UNRELATED]: 'unrelated',
      }),
    });
    const result = makeResult({ drug_name: 'Drug', paths: ['P1', 'P2'] });
    return { rs, result };
  };

  it('excludes only the matching member on predicate exclusion', () => {
    const { rs, result } = buildTwoMemberFixture();
    const { updatedPathFilterState } = runApplyFilters(rs, result, [makePathFilter(PRED_TREATS, true)]);

    expect(updatedPathFilterState.P1).toBe(true);
    expect(updatedPathFilterState.P2).toBe(false);

    const [compressedPath] = getCompressedPaths(rs, ['P1', 'P2']);
    expect(getIsPathFiltered(compressedPath, updatedPathFilterState)).toBe(false);
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

  it('excludes only the matching member in a three-member compression group', () => {
    const { rs } = buildCompressedFixture();
    const compressibleResult = makeResult({ drug_name: 'Drug', paths: ['P1', 'P2', 'P3'] });
    const { updatedPathFilterState } = runApplyFilters(rs, compressibleResult, [
      makePathFilter(PRED_CAUSES, true),
    ]);

    expect(updatedPathFilterState.P1).toBe(false);
    expect(updatedPathFilterState.P2).toBe(false);
    expect(updatedPathFilterState.P3).toBe(true);

    const [compressedPath] = getCompressedPaths(rs, ['P1', 'P2', 'P3']);
    expect(compressedPath.compressedIDs?.length).toBeGreaterThan(1);
    expect(getIsPathFiltered(compressedPath, updatedPathFilterState)).toBe(false);
  });

  it('does not filter paths with a different node sequence', () => {
    const { rs, result } = buildCompressedFixture();
    const { updatedPathFilterState } = runApplyFilters(rs, result, [makePathFilter(PRED_TREATS, true)]);

    expect(updatedPathFilterState.P1).toBe(true);
    expect(updatedPathFilterState.P2).toBe(false);
    expect(updatedPathFilterState.P4).toBe(false);

    expect(getIsPathFiltered(getPathById(rs, 'P4')!, updatedPathFilterState)).toBe(false);
  });

  it('keeps the result when a non-compressed sibling path remains visible', () => {
    const { rs, result } = buildCompressedFixture();
    const { results } = runApplyFilters(rs, result, [makePathFilter(PRED_TREATS, true)]);

    expect(results).toHaveLength(1);
  });

  it('keeps the result when a compressed sibling remains unfiltered', () => {
    const { rs, result } = buildTwoMemberFixture();
    const { results } = runApplyFilters(rs, result, [makePathFilter(PRED_TREATS, true)]);

    expect(results).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// applyFilters — compressed path ARA exclusion (per-member)
// ---------------------------------------------------------------------------

describe('applyFilters — compressed path ARA exclusion (per-member)', () => {
  const buildAraCompressionFixture = () => {
    const rs = makeResultSet({
      nodes: { n1: makeNode('n1'), n2: makeNode('n2') },
      edges: {
        e1: makeEdge('e1', { predicate: 'biolink:treats' }),
        e2: makeEdge('e2', { predicate: 'biolink:affects' }),
      },
      paths: {
        P1: makePath('P1', ['n1', 'e1', 'n2'], { tags: pathTags({ [ARA_EXCLUDE]: 'Agent A' }) }),
        P2: makePath('P2', ['n1', 'e2', 'n2'], { tags: pathTags({ [PRED_AFFECTS]: 'affects' }) }),
      },
      tags: resultSetTags({
        [ARA_EXCLUDE]: 'Agent A',
        [ARA_INCLUDE]: 'Agent B',
        [PRED_AFFECTS]: 'affects',
      }),
    });
    const result = makeResult({ drug_name: 'Drug', paths: ['P1', 'P2'] });
    return { rs, result };
  };

  it('excludes only the matching member on ARA exclusion', () => {
    const { rs, result } = buildAraCompressionFixture();
    const { updatedPathFilterState } = runApplyFilters(rs, result, [makePathFilter(ARA_EXCLUDE, true)]);

    expect(updatedPathFilterState.P1).toBe(true);
    expect(updatedPathFilterState.P2).toBe(false);

    const [compressedPath] = getCompressedPaths(rs, ['P1', 'P2']);
    expect(getIsPathFiltered(compressedPath, updatedPathFilterState)).toBe(false);
  });

  it('does not propagate ARA exclusion when an ARA inclusion is active', () => {
    const rs = makeResultSet({
      nodes: { n1: makeNode('n1'), n2: makeNode('n2') },
      edges: {
        e1: makeEdge('e1', { predicate: 'biolink:treats' }),
        e2: makeEdge('e2', { predicate: 'biolink:affects' }),
      },
      paths: {
        P1: makePath('P1', ['n1', 'e1', 'n2'], {
          tags: pathTags({ [ARA_EXCLUDE]: 'Agent A', [ARA_INCLUDE]: 'Agent B' }),
        }),
        P2: makePath('P2', ['n1', 'e2', 'n2'], { tags: pathTags({ [ARA_INCLUDE]: 'Agent B' }) }),
      },
      tags: resultSetTags({
        [ARA_EXCLUDE]: 'Agent A',
        [ARA_INCLUDE]: 'Agent B',
      }),
    });
    const result = makeResult({ drug_name: 'Drug', paths: ['P1', 'P2'] });
    const { updatedPathFilterState, results } = runApplyFilters(rs, result, [
      makePathFilter(ARA_INCLUDE, false),
      makePathFilter(ARA_EXCLUDE, true),
    ]);

    expect(updatedPathFilterState.P1).toBe(false);
    expect(updatedPathFilterState.P2).toBe(false);
    expect(results).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// applyFilters — per-member filter state consistency
// ---------------------------------------------------------------------------

describe('applyFilters — per-member filter state consistency', () => {
  it('marks only the matching member as filtered for per-member exclusions', () => {
    const { rs } = buildCompressedFixture();
    const compressibleResult = makeResult({ drug_name: 'Drug', paths: ['P1', 'P2'] });
    const { updatedPathFilterState } = runApplyFilters(rs, compressibleResult, [
      makePathFilter(PRED_AFFECTS, true),
    ]);

    expect(updatedPathFilterState.P1).toBe(false);
    expect(updatedPathFilterState.P2).toBe(true);
  });

  it('marks no members as filtered when the exclusion matches nothing', () => {
    const { rs } = buildCompressedFixture();
    const compressibleResult = makeResult({ drug_name: 'Drug', paths: ['P1', 'P2'] });
    const { updatedPathFilterState } = runApplyFilters(rs, compressibleResult, [
      makePathFilter(PRED_UNRELATED, true),
    ]);

    expect(updatedPathFilterState.P1).toBe(false);
    expect(updatedPathFilterState.P2).toBe(false);
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

// ---------------------------------------------------------------------------
// getIsPathIdFiltered — evidence view lookup by member path ID
// ---------------------------------------------------------------------------

describe('getIsPathIdFiltered — evidence view lookup by member path ID', () => {
  const buildTwoMemberFixture = () => {
    const rs = makeResultSet({
      nodes: { n1: makeNode('n1'), n2: makeNode('n2') },
      edges: {
        e1: makeEdge('e1', { predicate: 'biolink:treats' }),
        e2: makeEdge('e2', { predicate: 'biolink:affects' }),
      },
      paths: {
        P1: makePath('P1', ['n1', 'e1', 'n2']),
        P2: makePath('P2', ['n1', 'e2', 'n2']),
      },
    });
    return rs;
  };

  it('does not treat a compressed member as filtered when siblings remain visible', () => {
    const rs = buildTwoMemberFixture();
    const pathFilterState = { P1: true, P2: false };

    expect(getIsPathIdFiltered(rs, 'P1', ['P1', 'P2'], pathFilterState)).toBe(false);
    expect(getIsPathIdFiltered(rs, 'P2', ['P1', 'P2'], pathFilterState)).toBe(false);
  });

  it('treats a compressed member as filtered when every member is filtered', () => {
    const rs = buildTwoMemberFixture();
    const pathFilterState = { P1: true, P2: true };

    expect(getIsPathIdFiltered(rs, 'P1', ['P1', 'P2'], pathFilterState)).toBe(true);
    expect(getIsPathIdFiltered(rs, 'P2', ['P1', 'P2'], pathFilterState)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updatePathRanks — rank reflects how many criteria a path meets
// ---------------------------------------------------------------------------

describe('updatePathRanks — rank counts matched criteria', () => {
  const LIGHT = FILTERING_CONSTANTS.WEIGHT.LIGHT;
  const EV_CLINICAL = 'p/ev/clinical';
  const EV_PUBLICATION = 'p/ev/publication';
  const rs = makeResultSet({});

  const rankOf = (tagIds: string[], filters: Filter[]): number => {
    const path = makePath('P', ['n1', 'e1', 'n2'], {
      tags: pathTags(Object.fromEntries(tagIds.map((id) => [id, id]))),
    });
    const pathRank = makePathRank(path);
    updatePathRanks(rs, path, pathRank, filters);
    return pathRank.rank;
  };

  const predicateFilters = [makePathFilter(PRED_TREATS), makePathFilter(PRED_AFFECTS), makePathFilter(PRED_CAUSES)];

  it('ranks a path once per matching filter in a family, wherever the match falls in the filter list', () => {
    expect(rankOf([PRED_TREATS], predicateFilters)).toBe(-1 * LIGHT);
    expect(rankOf([PRED_AFFECTS], predicateFilters)).toBe(-1 * LIGHT);
    expect(rankOf([PRED_CAUSES], predicateFilters)).toBe(-1 * LIGHT);
    expect(rankOf([PRED_AFFECTS, PRED_CAUSES], predicateFilters)).toBe(-2 * LIGHT);
    expect(rankOf([PRED_TREATS, PRED_AFFECTS, PRED_CAUSES], predicateFilters)).toBe(-3 * LIGHT);
  });

  it('ranks a path meeting more criteria ahead of one meeting fewer', () => {
    expect(rankOf([PRED_AFFECTS, PRED_CAUSES], predicateFilters)).toBeLessThan(rankOf([PRED_TREATS], predicateFilters));
  });

  it('gives no credit for negated filters the path survives', () => {
    const filters = [makePathFilter(PRED_TREATS), makePathFilter(PRED_UNRELATED, true), makePathFilter(ARA_EXCLUDE, true)];

    expect(rankOf([PRED_TREATS], filters)).toBe(-1 * LIGHT);
  });

  it('adds the matches of each family together and excludes a path that misses a whole family', () => {
    const filters = [makePathFilter(PRED_TREATS), makePathFilter(PRED_AFFECTS), makePathFilter(ARA_INCLUDE)];

    expect(rankOf([PRED_TREATS, PRED_AFFECTS, ARA_INCLUDE], filters)).toBe(-3 * LIGHT);
    expect(rankOf([PRED_TREATS, ARA_INCLUDE], filters)).toBe(-2 * LIGHT);
    expect(rankOf([PRED_TREATS, PRED_AFFECTS], filters)).toBe(FILTERING_CONSTANTS.WEIGHT.HEAVY);
  });

  it('ranks a path once per matching evidence filter', () => {
    const filters = [makePathFilter(EV_CLINICAL), makePathFilter(EV_PUBLICATION)];

    expect(rankOf([EV_CLINICAL], filters)).toBe(-1 * LIGHT);
    expect(rankOf([EV_CLINICAL, EV_PUBLICATION], filters)).toBe(-2 * LIGHT);
    expect(rankOf([], filters)).toBe(FILTERING_CONSTANTS.WEIGHT.HEAVY);
  });
});

// ---------------------------------------------------------------------------
// applyFilters + getFormattedPaths — path ranks order the displayed paths
// ---------------------------------------------------------------------------

describe('path ranks order the displayed paths', () => {
  const LIGHT = FILTERING_CONSTANTS.WEIGHT.LIGHT;

  /** Four paths with distinct node sequences, so none of them compress together. */
  const buildRankedFixture = () => {
    const rs = makeResultSet({
      nodes: Object.fromEntries(['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7'].map((id) => [id, makeNode(id)])),
      edges: Object.fromEntries(['e1', 'e2', 'e3', 'e4', 'e5', 'e6'].map((id) => [id, makeEdge(id)])),
      paths: {
        oneHopOneMatch: makePath('oneHopOneMatch', ['n1', 'e1', 'n2'], { tags: pathTags({ [PRED_TREATS]: 'treats' }) }),
        twoHopTwoMatches: makePath('twoHopTwoMatches', ['n1', 'e2', 'n3', 'e3', 'n4'], {
          tags: pathTags({ [PRED_TREATS]: 'treats', [PRED_AFFECTS]: 'affects' }),
        }),
        twoHopOneMatch: makePath('twoHopOneMatch', ['n1', 'e4', 'n5', 'e5', 'n6'], { tags: pathTags({ [PRED_AFFECTS]: 'affects' }) }),
        oneHopNoMatch: makePath('oneHopNoMatch', ['n1', 'e6', 'n7']),
      },
      tags: resultSetTags({ [PRED_TREATS]: 'treats', [PRED_AFFECTS]: 'affects' }),
    });
    const result = makeResult({
      drug_name: 'Drug',
      paths: ['oneHopNoMatch', 'twoHopOneMatch', 'oneHopOneMatch', 'twoHopTwoMatches'],
    });
    return { rs, result };
  };

  const ids = (paths: Path[]) => paths.map((path) => path.id);

  it('returns the rank of every evaluated path from applyFilters', () => {
    const { rs, result } = buildRankedFixture();
    const { updatedPathRankState } = runApplyFilters(rs, result, [makePathFilter(PRED_TREATS), makePathFilter(PRED_AFFECTS)]);

    expect(updatedPathRankState).toEqual({
      oneHopOneMatch: -1 * LIGHT,
      twoHopTwoMatches: -2 * LIGHT,
      twoHopOneMatch: -1 * LIGHT,
      oneHopNoMatch: FILTERING_CONSTANTS.WEIGHT.HEAVY,
    });
  });

  it('returns no ranks when no filters are active', () => {
    const { rs, result } = buildRankedFixture();

    expect(runApplyFilters(rs, result, []).updatedPathRankState).toEqual({});
  });

  it('shows the path meeting more criteria first, with length breaking ties and filtered paths last', () => {
    const { rs, result } = buildRankedFixture();
    const { updatedPathFilterState, updatedPathRankState } = runApplyFilters(rs, result, [
      makePathFilter(PRED_TREATS),
      makePathFilter(PRED_AFFECTS),
    ]);

    expect(ids(getFormattedPaths(rs, result.paths, updatedPathFilterState, updatedPathRankState))).toEqual([
      'twoHopTwoMatches',
      'oneHopOneMatch',
      'twoHopOneMatch',
      'oneHopNoMatch',
    ]);
  });

  it('orders paths by how many text filters they match, not how many elements match', () => {
    const rs = makeResultSet({
      nodes: {
        n1: makeNode('n1', { names: ['Start'] }),
        n2: makeNode('n2', { names: ['COX1 kinase'] }),
        n3: makeNode('n3', { names: ['COX2'] }),
        n4: makeNode('n4', { names: ['COX3'] }),
      },
      edges: { e1: makeEdge('e1'), e2: makeEdge('e2'), e3: makeEdge('e3') },
      paths: {
        twoElementsOneFilter: makePath('twoElementsOneFilter', ['n1', 'e2', 'n3', 'e3', 'n4']),
        oneElementTwoFilters: makePath('oneElementTwoFilters', ['n1', 'e1', 'n2', 'e3', 'n4']),
      },
    });
    const result = makeResult({ drug_name: 'Drug', paths: ['twoElementsOneFilter', 'oneElementTwoFilters'] });
    const cox = runApplyFilters(rs, result, [makeEntityFilter('cox')]);

    expect(cox.updatedPathRankState).toEqual({ twoElementsOneFilter: -1 * LIGHT, oneElementTwoFilters: -1 * LIGHT });

    const both = runApplyFilters(rs, result, [makeEntityFilter('cox'), makeEntityFilter('kinase')]);

    expect(both.updatedPathRankState).toEqual({ twoElementsOneFilter: -1 * LIGHT, oneElementTwoFilters: -2 * LIGHT });
    expect(ids(getFormattedPaths(rs, result.paths, both.updatedPathFilterState, both.updatedPathRankState))).toEqual([
      'oneElementTwoFilters',
      'twoElementsOneFilter',
    ]);
  });

  it('orders by length alone when there are no ranks', () => {
    const { rs, result } = buildRankedFixture();

    expect(ids(getFormattedPaths(rs, result.paths, genPathFilterState(rs)))).toEqual([
      'oneHopNoMatch',
      'oneHopOneMatch',
      'twoHopOneMatch',
      'twoHopTwoMatches',
    ]);
  });

  it('reads a compressed path\'s rank from its members', () => {
    const { rs } = buildCompressedFixture();
    const [compressedPath] = getCompressedPaths(rs, ['P1', 'P2', 'P3']);

    expect(compressedPath.compressedIDs).toEqual(['P1', 'P2', 'P3']);
    expect(getPathRank(compressedPath, { P1: FILTERING_CONSTANTS.WEIGHT.HEAVY, P2: -2 * LIGHT, P3: -1 * LIGHT })).toBe(-2 * LIGHT);
    expect(getPathRank(getPathById(rs, 'P4')!, { P4: -1 * LIGHT })).toBe(-1 * LIGHT);
    expect(getPathRank(getPathById(rs, 'P4')!, {})).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// applyFilters — a compressed row is ranked on what its members show together
// ---------------------------------------------------------------------------

describe('applyFilters — compressed row ranking', () => {
  const LIGHT = FILTERING_CONSTANTS.WEIGHT.LIGHT;
  const HEAVY = FILTERING_CONSTANTS.WEIGHT.HEAVY;
  const EV_CLINICAL = 'p/ev/clinical';
  const clinical = pathTags({ [EV_CLINICAL]: 'Clinical Trials' });

  /**
   * drug → disease-a → target is two paths that compress into one row: one whose first edge
   * matches "affects" but has no clinical evidence, and one with clinical evidence that does not
   * match "affects". The other rows are single paths.
   */
  const buildRowFixture = () => {
    const rs = makeResultSet({
      nodes: Object.fromEntries(['drug', 'disease-a', 'disease-b', 'disease-c', 'target'].map((id) => [id, makeNode(id)])),
      edges: {
        affectsA: makeEdge('affectsA', { predicate: 'affects' }),
        trialsA: makeEdge('trialsA', { predicate: 'in clinical trials for' }),
        trialsB: makeEdge('trialsB', { predicate: 'in clinical trials for' }),
        affectsC: makeEdge('affectsC', { predicate: 'affects' }),
        subclassA: makeEdge('subclassA', { predicate: 'subclass of' }),
        subclassB: makeEdge('subclassB', { predicate: 'subclass of' }),
        subclassC: makeEdge('subclassC', { predicate: 'subclass of' }),
      },
      paths: {
        single: makePath('single', ['drug', 'trialsB', 'disease-b', 'subclassB', 'target'], { tags: clinical }),
        rowAffects: makePath('rowAffects', ['drug', 'affectsA', 'disease-a', 'subclassA', 'target']),
        rowTrials: makePath('rowTrials', ['drug', 'trialsA', 'disease-a', 'subclassA', 'target'], { tags: clinical }),
        noTrials: makePath('noTrials', ['drug', 'affectsC', 'disease-c', 'subclassC', 'target']),
      },
      tags: resultSetTags({ [EV_CLINICAL]: 'Clinical Trials' }),
    });
    const result = makeResult({ drug_name: 'Drug', paths: ['single', 'rowAffects', 'rowTrials', 'noTrials'] });
    return { rs, result };
  };

  const filters = () => [makeEntityFilter('affects'), makeEntityFilter('subclass'), makePathFilter(EV_CLINICAL)];
  const ids = (paths: Path[]) => paths.map((path) => path.id);

  it('credits a row for every filter any of its members meets, including members a filter excluded', () => {
    const { rs, result } = buildRowFixture();
    const { updatedPathFilterState, updatedPathRankState } = runApplyFilters(rs, result, filters());

    // rowAffects is excluded for lacking clinical evidence, but its edge still shows in the row.
    expect(updatedPathFilterState.rowAffects).toBe(true);
    expect(updatedPathFilterState.rowTrials).toBe(false);
    expect(updatedPathRankState.rowAffects).toBe(-3 * LIGHT);
    expect(updatedPathRankState.rowTrials).toBe(-3 * LIGHT);
    expect(updatedPathRankState.single).toBe(-2 * LIGHT);
  });

  it('shows the row meeting all the filters ahead of a single path meeting fewer', () => {
    const { rs, result } = buildRowFixture();
    const { updatedPathFilterState, updatedPathRankState } = runApplyFilters(rs, result, filters());

    expect(ids(getFormattedPaths(rs, result.paths, updatedPathFilterState, updatedPathRankState))).toEqual([
      'rowAffects',
      'single',
      'noTrials',
    ]);
  });

  it('credits a row once per filter even when several members meet it', () => {
    const { rs, result } = buildRowFixture();
    const { updatedPathRankState } = runApplyFilters(rs, result, [makeEntityFilter('subclass')]);

    expect(updatedPathRankState.rowAffects).toBe(-1 * LIGHT);
    expect(updatedPathRankState.rowTrials).toBe(-1 * LIGHT);
  });

  it('gives a row whose members are all filtered out an excluding rank', () => {
    const { rs, result } = buildRowFixture();
    const { updatedPathFilterState, updatedPathRankState } = runApplyFilters(rs, result, filters());

    expect(updatedPathFilterState.noTrials).toBe(true);
    expect(updatedPathRankState.noTrials).toBe(HEAVY);
  });

  it('does not push a visible row down a tie because its first member is filtered out', () => {
    const { rs, result } = buildRowFixture();
    const rowFirst = makeResult({ drug_name: 'Drug', paths: ['rowAffects', 'rowTrials', 'single'] });
    const { updatedPathFilterState, updatedPathRankState } = runApplyFilters(rs, rowFirst, [
      makeEntityFilter('subclass'),
      makePathFilter(EV_CLINICAL),
    ]);

    // Both rows meet both filters and are the same length, so backend order decides.
    expect(updatedPathRankState.rowTrials).toBe(updatedPathRankState.single);
    expect(updatedPathFilterState.rowAffects).toBe(true);
    expect(ids(getFormattedPaths(rs, rowFirst.paths, updatedPathFilterState, updatedPathRankState))).toEqual(['rowAffects', 'single']);
    expect(result.paths).toHaveLength(4);
  });
});
