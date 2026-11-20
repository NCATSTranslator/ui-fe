import type { EvidenceTabName } from '@/features/Evidence/types/navigation';
import type { EdgeEvidence } from '@/features/Evidence/utils/utilities';
import { EvidenceTypeKey, formatEvidenceCount } from '@/features/Evidence/utils/evidenceLabels';

/** Heading of the placeholder tab rendered when the edge has no evidence at all. */
export const NO_EVIDENCE_TAB = 'No Evidence Available';

/** Any tab the evidence view can have active: an evidence tab or the no-evidence placeholder. */
export type ActiveTabName = EvidenceTabName | typeof NO_EVIDENCE_TAB;

export interface EvidenceCounts {
  pubs: number;
  cts: number;
  misc: number;
  sources: number;
}

// The evidence type behind each tab, whose shared labels give the tab's heading
const TAB_EVIDENCE_TYPES: Record<EvidenceTabName, EvidenceTypeKey> = {
  'Publications': 'publications',
  'Clinical Trials': 'clinicalTrials',
  'Miscellaneous': 'misc',
  'Knowledge Sources': 'sources',
};

/**
 * Counts the items behind each evidence tab.
 *
 * @param {EdgeEvidence} evidence - The edge's evidence as displayed.
 * @returns {EvidenceCounts} The number of items per tab.
 */
export const getEvidenceCounts = (evidence: EdgeEvidence): EvidenceCounts => ({
  pubs: evidence.publications.length,
  cts: evidence.clinicalTrials.length,
  misc: evidence.miscEvidence.length,
  sources: evidence.sources.length,
});

/**
 * Returns the number of items behind a tab. The no-evidence placeholder has none.
 *
 * @param {ActiveTabName} tab - The tab to count.
 * @param {EvidenceCounts} counts - The number of items per tab.
 * @returns {number} The tab's item count.
 */
export const getTabCount = (tab: ActiveTabName, counts: EvidenceCounts): number => {
  switch (tab) {
    case 'Publications': return counts.pubs;
    case 'Clinical Trials': return counts.cts;
    case 'Miscellaneous': return counts.misc;
    case 'Knowledge Sources': return counts.sources;
    default: return 0;
  }
};

/**
 * Whether a tab has anything to show, and so is rendered at all.
 *
 * @param {EvidenceTabName} tab - The tab to check.
 * @param {EvidenceCounts} counts - The number of items per tab.
 * @returns {boolean} True if the tab has at least one item.
 */
export const tabHasData = (tab: EvidenceTabName, counts: EvidenceCounts): boolean =>
  getTabCount(tab, counts) > 0;

/**
 * Builds the visible heading for a tab: its count followed by its label, singular for one item
 * (e.g. "1 Publication", "7 Publications").
 *
 * @param {EvidenceTabName} tab - The tab to label.
 * @param {EvidenceCounts} counts - The number of items per tab.
 * @returns {string} The heading text.
 */
export const getTabHeading = (tab: EvidenceTabName, counts: EvidenceCounts): string => {
  return formatEvidenceCount(getTabCount(tab, counts), TAB_EVIDENCE_TYPES[tab]);
};

/**
 * Returns the first tab that is rendered, in display order. It must only ever name a rendered
 * tab: each evidence tab exists only when it has data, and the placeholder tab exists only when
 * none of them do.
 *
 * @param {EvidenceCounts} counts - The number of items per tab.
 * @returns {ActiveTabName} The heading of the first rendered tab.
 */
export const getFirstTabHeading = (counts: EvidenceCounts): ActiveTabName => {
  if (counts.pubs > 0) return 'Publications';
  if (counts.cts > 0) return 'Clinical Trials';
  if (counts.misc > 0) return 'Miscellaneous';
  if (counts.sources > 0) return 'Knowledge Sources';
  return NO_EVIDENCE_TAB;
};
