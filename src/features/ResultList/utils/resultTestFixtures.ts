import type { Path, Result, ResultEdge, ResultNode, ResultSet, Score } from '@/features/ResultList/types/results.d';

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

export const makeTestResult = (id: string, overrides: Partial<Result> = {}): Result => ({
  id,
  drug_name: id,
  subject: 'n1',
  object: 'n2',
  paths: [],
  scores: [],
  tags: {},
  ...overrides,
} as Result);

export const makeTestScore = (value: number): Score => ({ main: value, confidence: value, novelty: value, clinical_evidence: value, normalized_score: value });
const tag = (name: string) => ({ name, description: '' });
export const APPROVED_TAG = 'r/cc/approved';
export const PHASE_3_TAG = 'r/cc/phase3';
export const TREATS_TAG = 'p/pred/treats';

/**
 * Three drugs for one disease. Scores put Zinc first by default so a name sort
 * visibly reorders; Aspirin and Zinc share the "Approved" development stage.
 */
export const makeTestDiseaseSet = (): ResultSet => {
  const drug = (id: string, name: string) => makeTestNode(id, name);
  const set = makeTestResultSet(
    {
      e1: makeTestEdge('e1', { subject: 'aspirin', object: 'disease', predicate: 'biolink:treats' }),
      e2: makeTestEdge('e2', { subject: 'metformin', object: 'disease', predicate: 'biolink:treats' }),
      e3: makeTestEdge('e3', { subject: 'zinc', object: 'disease', predicate: 'biolink:treats' }),
    },
    {
      aspirin: drug('aspirin', 'Aspirin'),
      metformin: drug('metformin', 'Metformin'),
      zinc: drug('zinc', 'Zinc'),
      disease: makeTestNode('disease', 'Type 2 Diabetes'),
    },
  );
  const pathTags = { [TREATS_TAG]: { id: TREATS_TAG, description: tag('treats') } };
  set.data.paths = {
    p1: makeTestPath({ id: 'p1', subgraph: ['aspirin', 'e1', 'disease'], tags: pathTags }),
    p2: makeTestPath({ id: 'p2', subgraph: ['metformin', 'e2', 'disease'], tags: pathTags }),
    p3: makeTestPath({ id: 'p3', subgraph: ['zinc', 'e3', 'disease'], tags: pathTags }),
  };
  set.data.tags = { [APPROVED_TAG]: tag('Approved'), [PHASE_3_TAG]: tag('Phase 3'), [TREATS_TAG]: tag('treats') };
  set.data.results = [
    makeTestResult('r-aspirin', { drug_name: 'Aspirin', subject: 'aspirin', object: 'disease', paths: ['p1'], scores: [makeTestScore(0.1)], tags: { [APPROVED_TAG]: { id: APPROVED_TAG, description: tag('Approved') } } }),
    makeTestResult('r-metformin', { drug_name: 'Metformin', subject: 'metformin', object: 'disease', paths: ['p2'], scores: [makeTestScore(0.5)], tags: { [PHASE_3_TAG]: { id: PHASE_3_TAG, description: tag('Phase 3') } } }),
    makeTestResult('r-zinc', { drug_name: 'Zinc', subject: 'zinc', object: 'disease', paths: ['p3'], scores: [makeTestScore(0.9)], tags: { [APPROVED_TAG]: { id: APPROVED_TAG, description: tag('Approved') } } }),
  ];
  return set;
};

