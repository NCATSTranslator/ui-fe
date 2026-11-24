import { describe, it, expect } from 'vitest';
import { buildEdgeEvidenceCSV, buildEdgeEvidenceFilename } from '@/features/Evidence/utils/evidenceExportUtils';
import { makeTestEdge } from '@/features/ResultList/utils/resultTestFixtures';
import { buildEdgeEvidence, EdgeEvidence } from '@/features/Evidence/utils/utilities';
import { Provenance } from '@/features/Evidence/types/evidence';

const EMPTY: EdgeEvidence = { publications: [], clinicalTrials: [], drugLabels: [], miscEvidence: [], sources: [] };

const SUPPORT = { object: [0, 1] as [number, number], subject: [2, 3] as [number, number], text: 'edge support text' };
const EMPTY_SUPPORT = { object: [0, 1] as [number, number], subject: [2, 3] as [number, number], text: '' };

const SOURCE_A: Provenance = {
  infores: 'infores:a',
  knowledge_level: 'trusted',
  name: 'Source A',
  url: 'https://a.example',
  wiki: 'https://wiki.example/a',
};

const EVIDENCE: EdgeEvidence = buildEdgeEvidence({
  publications: [{
    id: 'PMID:1',
    title: 'A title, with a comma',
    journal: 'Journal',
    pubdate: '2020-01-01',
    snippet: 'generic snippet',
    support: null,
    type: 'PMID',
    url: 'https://pubmed.example/1',
    infores: ['infores:a', 'infores:b'],
    source: { knowledge_level: 'trusted', name: 'Source A', url: 'https://a.example' },
  }],
  clinicalTrials: [{
    id: 'NCT1',
    title: 'Trial',
    url: 'https://trials.example/NCT1',
    phase: 2,
    size: 100,
    start_date: '2019-05-01',
    status: 'COMPLETED',
    child: false,
    type: 'enrolled',
    sources: [SOURCE_A, { ...SOURCE_A }],
  }],
  drugLabels: [
    { id: 'label1', support: null, type: 'other', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=abc' },
  ],
  miscEvidence: [
    { id: 'misc1', support: null, type: 'other', url: 'https://misc.example/1' },
    { id: 'misc2', support: null, type: 'other', url: 'https://misc.example/1' },
  ],
  sources: [SOURCE_A],
});

describe('buildEdgeEvidenceCSV', () => {
  it('returns only the header row without evidence', () => {
    const lines = buildEdgeEvidenceCSV(EMPTY).split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0].startsWith('evidence_type,id,title,url')).toBe(true);
  });

  it('writes one row per evidence item across all types, deduplicating misc links', () => {
    const lines = buildEdgeEvidenceCSV(EVIDENCE).split('\n');
    const types = lines.slice(1).map(line => line.split(',')[0]);
    expect(types).toEqual(['publication', 'clinical_trial', 'drug_label', 'miscellaneous', 'database']);
  });

  it("writes the trial's edge sources on its row, each once", () => {
    const trialLine = buildEdgeEvidenceCSV(EVIDENCE).split('\n').find(line => line.startsWith('clinical_trial'));
    expect(trialLine).toContain('Source A');
    expect(trialLine).toContain('infores:a');
    expect(trialLine).not.toContain('Source A;Source A');
  });

  it('collapses databases that share a name into one row', () => {
    const evidence = buildEdgeEvidence({
      publications: [],
      clinicalTrials: [],
      drugLabels: [],
      miscEvidence: [],
      sources: [
        SOURCE_A,
        { ...SOURCE_A, infores: 'infores:a2', url: 'https://a2.example' },
        { ...SOURCE_A },
      ],
    });
    const rows = buildEdgeEvidenceCSV(evidence).split('\n').slice(1);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toContain('"https://a.example;https://a2.example"');
    expect(rows[0]).toContain('"infores:a;infores:a2"');
  });

  it('escapes values and joins infores ids', () => {
    const csv = buildEdgeEvidenceCSV(EVIDENCE);
    expect(csv).toContain('"A title, with a comma"');
    expect(csv).toContain('"infores:a;infores:b"');
  });

  it('writes curated knowledge-level labels', () => {
    const csv = buildEdgeEvidenceCSV(EVIDENCE);
    expect(csv).toContain('Curated');
    expect(csv).not.toMatch(/(?:^|,)trusted(?:,|$)/m);
  });

  it("prefers the edge's support text over the publication snippet", () => {
    const edge = makeTestEdge('e1', { publications: { PMID: [{ id: 'PMID:1', infores: 'infores:a', support: SUPPORT }] } });
    expect(buildEdgeEvidenceCSV(EVIDENCE, edge)).toContain('edge support text');
    expect(buildEdgeEvidenceCSV(EVIDENCE)).toContain('generic snippet');
  });

  it('falls back to the publication snippet when the edge support text is empty', () => {
    const edge = makeTestEdge('e1', { publications: { PMID: [{ id: 'PMID:1', infores: 'infores:a', support: EMPTY_SUPPORT }] } });
    const csv = buildEdgeEvidenceCSV(EVIDENCE, edge);
    expect(csv).toContain('generic snippet');
  });
});

describe('buildEdgeEvidenceFilename', () => {
  it('uses the sanitized edge label and local calendar date', () => {
    const date = new Date(2026, 10, 16, 23, 30, 0);
    expect(buildEdgeEvidenceFilename('Aspirin treats Headache', date)).toBe('Aspirin-treats-Headache_evidence_2026-11-16.csv');
  });

  it('falls back when there is no label', () => {
    const date = new Date(2026, 10, 16, 12, 0, 0);
    expect(buildEdgeEvidenceFilename(null, date)).toBe('edge_evidence_2026-11-16.csv');
  });
});
