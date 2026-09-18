import { describe, it, expect } from 'vitest';
import { getEdgeProvenance, getPublicationSource } from '@/features/ResultList/slices/resultsSlice';
import { makeTestEdge, makeTestResultSet } from '@/features/ResultList/utils/resultTestFixtures';
import type { ProvenanceCatalogEntry } from '@/features/Evidence/types/evidence';

const SEMMEDDB = 'infores:semmeddb';
const RECORD_URL = 'https://records.example/semmeddb/1';
const catalog: Record<string, ProvenanceCatalogEntry> = {
  [SEMMEDDB]: {
    knowledge_level: 'trusted',
    name: 'Semantic Medline Database',
    url: 'https://semmeddb.example',
    wiki: 'https://wiki.example/semmeddb',
  },
};

describe('getPublicationSource', () => {
  it('names the source from the catalog when there is no result set', () => {
    expect(getPublicationSource(null, SEMMEDDB, undefined, catalog)).toEqual({
      knowledge_level: 'trusted',
      name: 'Semantic Medline Database',
      url: 'https://semmeddb.example',
    });
  });

  it('prefers the edge record url over the catalog url', () => {
    const edge = makeTestEdge('e1', { provenance: [{ infores: SEMMEDDB, records: [RECORD_URL] }] });
    expect(getPublicationSource(null, SEMMEDDB, edge, catalog)?.url).toBe(RECORD_URL);
  });

  it('falls back to the raw infores id when the catalog has no entry', () => {
    expect(getPublicationSource(null, SEMMEDDB)).toEqual({ knowledge_level: '', name: SEMMEDDB, url: '' });
  });

  it('resolves the same source as a result set carrying the same catalog entry', () => {
    const rs = makeTestResultSet({});
    rs.data.provenance = { ...catalog };
    expect(getPublicationSource(null, SEMMEDDB, undefined, catalog)).toEqual(getPublicationSource(rs, SEMMEDDB));
  });
});

describe('getEdgeProvenance', () => {
  const edge = makeTestEdge('e1', { provenance: [{ infores: SEMMEDDB, records: [] }] });

  it('names sources from the catalog when there is no result set', () => {
    expect(getEdgeProvenance(null, edge, catalog)).toEqual([{
      infores: SEMMEDDB,
      knowledge_level: 'trusted',
      name: 'Semantic Medline Database',
      url: 'https://semmeddb.example',
      wiki: 'https://wiki.example/semmeddb',
    }]);
  });

  it('ignores the catalog when a result set is provided', () => {
    expect(getEdgeProvenance(makeTestResultSet({}), edge, catalog)[0].name).toBe(SEMMEDDB);
  });

  it('prefers the edge record url over the catalog url', () => {
    const edgeWithRecord = makeTestEdge('e1', {
      provenance: [{ infores: SEMMEDDB, records: [RECORD_URL] }],
    });
    expect(getEdgeProvenance(null, edgeWithRecord, catalog)[0].url).toBe(RECORD_URL);
  });
});
