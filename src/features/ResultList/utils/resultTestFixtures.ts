import type { Path, ResultEdge, ResultNode, ResultSet } from '@/features/ResultList/types/results.d';

export const makeTestNode = (id: string, name = id): ResultNode => ({
  id,
  annotations: { chemical: {}, disease: {}, gene: {} },
  aras: [],
  curies: [id],
  descriptions: [],
  names: [name],
  other_names: {},
  provenance: [],
  signature: id,
  source_time: '',
  synonyms: [],
  types: ['biolink:NamedThing'],
  tags: {},
} as unknown as ResultNode);

export const makeTestEdge = (id: string, overrides: Partial<ResultEdge> = {}): ResultEdge => ({
  id,
  aras: [],
  is_root: false,
  knowledge_level: 'knowledge_assertion',
  metadata: { edge_bindings: [], inverted_id: null, is_root: false },
  object: 'n2',
  predicate: 'biolink:related_to',
  predicate_url: '',
  provenance: [],
  publications: {},
  signature: id,
  source_time: '',
  subject: 'n1',
  tags: {},
  trials: [],
  ...overrides,
} as ResultEdge);

export const makeTestPath = (overrides: Partial<Path> = {}): Path => ({
  id: 'p1',
  aras: [],
  subgraph: ['n1', 'e1', 'n2'],
  tags: {},
  ...overrides,
});

export const makeTestResultSet = (
  edges: Record<string, ResultEdge>,
  nodes: Record<string, ResultNode> = {},
): ResultSet => ({
  status: 'success',
  data: {
    edges,
    errors: {},
    meta: {},
    nodes,
    paths: {},
    provenance: {},
    publications: {},
    results: [],
    tags: {},
    trials: {},
  },
} as unknown as ResultSet);
