import { describe, it, expect } from 'vitest';
import { getEvidenceBarScale, getEvidenceSegments } from '@/features/Evidence/utils/evidenceSegments';
import { EvidenceCountsContainer } from '@/features/Evidence/types/evidence';
import { EMPTY_EVIDENCE_COUNTS } from '@/features/Evidence/utils/utilities';

const counts = (overrides: Partial<EvidenceCountsContainer> = {}): EvidenceCountsContainer => ({ ...EMPTY_EVIDENCE_COUNTS, ...overrides });

describe('getEvidenceSegments', () => {
  it('returns a segment per evidence type with items, in display order', () => {
    const segments = getEvidenceSegments(counts({
      sourceCount: 5, miscCount: 4, acceptedOntologyCount: 3, drugLabelCount: 2, clinicalTrialCount: 6, publicationCount: 1200,
    }));
    expect(segments.map((segment) => segment.key)).toEqual(
      ['publications', 'clinicalTrials', 'drugLabels', 'acceptedOntologies', 'misc', 'sources']
    );
    expect(segments[0]).toEqual({ key: 'publications', count: 1200, label: `${(1200).toLocaleString()} Publications` });
  });

  it('omits evidence types with no items', () => {
    expect(getEvidenceSegments(counts({ clinicalTrialCount: 2 })).map((segment) => segment.key)).toEqual(['clinicalTrials']);
  });

  it('uses the singular type name for a single item', () => {
    const labels = getEvidenceSegments(counts({
      publicationCount: 1, clinicalTrialCount: 1, drugLabelCount: 1, acceptedOntologyCount: 1, miscCount: 1, sourceCount: 1,
    })).map((segment) => segment.label);
    expect(labels).toEqual([
      '1 Publication', '1 Clinical Trial', '1 Drug Label', '1 Accepted Ontology', '1 Miscellaneous', '1 Database',
    ]);
  });

  it('returns no segments without counts, and tolerates counts missing newer fields', () => {
    expect(getEvidenceSegments(null)).toEqual([]);
    const legacy = { publicationCount: 2, clinicalTrialCount: 0, miscCount: 0, sourceCount: 0 } as EvidenceCountsContainer;
    expect(getEvidenceSegments(legacy).map((segment) => segment.label)).toEqual(['2 Publications']);
  });
});

describe('getEvidenceBarScale', () => {
  it('gives the result with the most evidence the full width', () => {
    expect(getEvidenceBarScale(951, 951)).toBe(1);
  });

  it('scales logarithmically against the maximum', () => {
    expect(getEvidenceBarScale(10, 100)).toBeCloseTo(0.5);
  });

  it('scales a single piece of evidence to zero so its bar takes the minimum width', () => {
    expect(getEvidenceBarScale(1, 2837)).toBe(0);
    expect(getEvidenceBarScale(1, 1)).toBe(1);
  });

  it('keeps evidence-rich results long beside an outlier, and orders bars by total', () => {
    const rich = getEvidenceBarScale(850, 2837);
    expect(rich).toBeGreaterThan(0.8);
    expect(getEvidenceBarScale(1544, 2837)).toBeGreaterThan(rich);
    expect(getEvidenceBarScale(50, 2837)).toBeLessThan(rich);
  });

  it('is zero without evidence or without a maximum, and never exceeds one', () => {
    expect(getEvidenceBarScale(0, 100)).toBe(0);
    expect(getEvidenceBarScale(5, 0)).toBe(0);
    expect(getEvidenceBarScale(200, 100)).toBe(1);
  });
});
