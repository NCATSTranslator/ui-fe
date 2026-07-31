import type { CanvasNodeDetail, CanvasEdgeDetail } from '@/features/Canvas/types/canvas';
import type { ResultNode, ResultEdge, Annotation } from '@/features/ResultList/types/results.d';

const EMPTY_ANNOTATIONS: Annotation = {
  chemical: {
    approval: null,
    clinical_trials: null,
    descriptions: null,
    indications: null,
    otc_status: null,
    other_names: null,
    roles: null,
  },
  disease: {
    curies: null,
    descriptions: null,
  },
  gene: {
    descriptions: null,
    name: null,
    species: null,
    tdl: null,
  },
};

export const canvasNodeDetailToResultNode = (detail: CanvasNodeDetail): ResultNode => ({
  id: detail.id,
  aras: [...detail.aras],
  descriptions: [...detail.descriptions],
  names: [...detail.names],
  types: [...detail.types],
  synonyms: [...detail.synonyms],
  curies: [...detail.curies],
  provenance: [...detail.provenance],
  annotations: detail.annotations ?? EMPTY_ANNOTATIONS,
  other_names: {},
  signature: '',
  source_time: detail.source_time ?? '',
  tags: detail.tags,
});

export const canvasEdgeDetailToResultEdge = (detail: CanvasEdgeDetail): ResultEdge => ({
  id: detail.id,
  aras: [...detail.aras],
  support: detail.support as ResultEdge['support'],
  is_root: detail.is_root,
  knowledge_level: detail.knowledge_level as ResultEdge['knowledge_level'],
  description: detail.description,
  type: detail.type,
  inferred: detail.type === 'indirect',
  subject: detail.subject,
  object: detail.object,
  predicate: detail.predicate,
  predicate_url: detail.predicate_url ?? '',
  provenance: [...detail.provenance],
  publications: { ...detail.publications },
  metadata: detail.metadata ?? { edge_bindings: [], inverted_id: null, is_root: detail.is_root },
  trials: [...detail.trials],
  source_time: detail.source_time ?? '',
  tags: detail.tags,
  signature: '',
});
