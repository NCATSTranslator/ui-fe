import { EvidenceCountsContainer } from '@/features/Evidence/types/evidence';
import { EvidenceTypeKey, formatEvidenceCount } from '@/features/Evidence/utils/evidenceLabels';

export interface EvidenceSegment {
  key: EvidenceTypeKey;
  count: number;
  // Count followed by its singular or plural type name, e.g. "30 Publications"
  label: string;
}

// Each evidence type with the field holding its count, listed in display order, left to right
export const EVIDENCE_COUNT_KEYS: [EvidenceTypeKey, keyof EvidenceCountsContainer][] = [
  ['publications', 'publicationCount'],
  ['clinicalTrials', 'clinicalTrialCount'],
  ['drugLabels', 'drugLabelCount'],
  ['acceptedOntologies', 'acceptedOntologyCount'],
  ['misc', 'miscCount'],
  ['sources', 'sourceCount'],
];

/**
 * Builds the bar segments for a result's evidence counts, in display order. Evidence types with
 * no items get no segment.
 *
 * @param {EvidenceCountsContainer | null} counts - The result's evidence counts.
 * @returns {EvidenceSegment[]} One segment per evidence type that has at least one item.
 */
export const getEvidenceSegments = (counts: EvidenceCountsContainer | null): EvidenceSegment[] => {
  if (!counts) return [];
  const segments: EvidenceSegment[] = [];
  for (const [key, countKey] of EVIDENCE_COUNT_KEYS) {
    // Counts saved before a type existed (e.g. on older bookmarks) may lack its field
    const count = counts[countKey] ?? 0;
    if (count > 0)
      segments.push({ key, count, label: formatEvidenceCount(count, key) });
  }
  return segments;
};

/**
 * Fraction of the available width a result's evidence bar should span, relative to the result
 * with the most evidence in the query. Log scaled so that an outlier with far more evidence than
 * the rest does not shrink results that still have a lot of evidence down to the minimum width:
 * a result with a third of the maximum still spans most of the width. A single piece of evidence
 * scales to 0, so the bar falls back to its minimum width.
 *
 * @param {number} total - The result's total evidence count.
 * @param {number} maxTotal - The largest total evidence count of any result in the query.
 * @returns {number} A fraction between 0 and 1.
 */
export const getEvidenceBarScale = (total: number, maxTotal: number): number => {
  if (total <= 0 || maxTotal <= 0) return 0;
  if (total >= maxTotal) return 1;
  return Math.max(0, Math.log(total) / Math.log(maxTotal));
};
