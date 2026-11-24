import type { EvidenceSectionName } from '@/features/Evidence/types/navigation';
import type { EdgeEvidence } from '@/features/Evidence/utils/utilities';
import { EVIDENCE_TYPE_LABELS, EvidenceTypeKey, formatEvidenceCount } from '@/features/Evidence/utils/evidenceLabels';

/** The number of items behind each section of the evidence view. */
export type EvidenceSectionCounts = Record<EvidenceTypeKey, number>;

/** The sections each column of the evidence view shows, top to bottom. */
export interface EvidenceLayout {
  primary: EvidenceTypeKey[];
  secondary: EvidenceTypeKey[];
}

// Evidence about the relationship itself, shown in the left column
const PRIMARY_SECTIONS: EvidenceTypeKey[] = ['publications', 'clinicalTrials', 'drugLabels', 'acceptedOntologies'];
// Where the relationship came from, shown in the right column
const SECONDARY_SECTIONS: EvidenceTypeKey[] = ['misc', 'sources'];

const SECTION_KEYS: Record<EvidenceSectionName, EvidenceTypeKey> = {
  'Publications': 'publications',
  'Clinical Trials': 'clinicalTrials',
  'Drug Labels': 'drugLabels',
  'Accepted Ontology': 'acceptedOntologies',
  'Miscellaneous': 'misc',
  'Databases': 'sources',
};

// Names from links made before a section was renamed
const LEGACY_SECTION_NAMES: Record<string, EvidenceSectionName> = {
  'Knowledge Sources': 'Databases',
};

/**
 * Resolves the section named by a link's "tab" parameter, accepting the names older links use.
 *
 * @param {string | null | undefined} raw - The parameter's value.
 * @returns {EvidenceSectionName | undefined} The section, or undefined when the value names none.
 */
export const parseEvidenceSectionName = (raw: string | null | undefined): EvidenceSectionName | undefined => {
  if (!raw) return undefined;
  if (Object.hasOwn(SECTION_KEYS, raw)) return raw as EvidenceSectionName;
  return Object.hasOwn(LEGACY_SECTION_NAMES, raw) ? LEGACY_SECTION_NAMES[raw] : undefined;
};

/**
 * Returns the evidence type shown in a named section.
 *
 * @param {EvidenceSectionName} section - The section's name.
 * @returns {EvidenceTypeKey} The section's evidence type.
 */
export const getSectionKey = (section: EvidenceSectionName): EvidenceTypeKey => SECTION_KEYS[section];

/**
 * Counts the items behind each section. Accepted ontology is a property of the relationship
 * rather than a list, so it counts as one item when it applies.
 *
 * @param {EdgeEvidence} evidence - The edge's evidence as displayed.
 * @param {boolean} isAcceptedOntology - Whether the edge is an accepted ontology relationship.
 * @returns {EvidenceSectionCounts} The number of items per section.
 */
export const getEvidenceSectionCounts = (evidence: EdgeEvidence, isAcceptedOntology: boolean): EvidenceSectionCounts => ({
  publications: evidence.publications.length,
  clinicalTrials: evidence.clinicalTrials.length,
  drugLabels: evidence.drugLabels.length,
  acceptedOntologies: isAcceptedOntology ? 1 : 0,
  misc: evidence.miscEvidence.length,
  sources: evidence.sources.length,
});

/**
 * Decides which sections each column shows. A section is shown only when it has something in it,
 * and a column with no sections is left out by the caller so the other column spans the full width.
 *
 * @param {EvidenceSectionCounts} counts - The number of items per section.
 * @returns {EvidenceLayout} The sections to show in each column, in display order.
 */
export const getEvidenceLayout = (counts: EvidenceSectionCounts): EvidenceLayout => ({
  primary: PRIMARY_SECTIONS.filter(key => counts[key] > 0),
  secondary: SECONDARY_SECTIONS.filter(key => counts[key] > 0),
});

/**
 * Builds a section's heading: its count followed by its label, singular for one item
 * (e.g. "1 Publication", "7 Publications"). Accepted ontology is not a list, so it has no count.
 *
 * @param {EvidenceTypeKey} key - The section's evidence type.
 * @param {number} count - The number of items in the section.
 * @returns {string} The heading text.
 */
export const getSectionHeading = (key: EvidenceTypeKey, count: number): string =>
  key === 'acceptedOntologies' ? EVIDENCE_TYPE_LABELS[key].singular : formatEvidenceCount(count, key);

/**
 * Returns the DOM id of a section, used to scroll to it.
 *
 * @param {EvidenceTypeKey} key - The section's evidence type.
 * @returns {string} The section's id.
 */
export const getSectionDomId = (key: EvidenceTypeKey): string => `evidence-section-${key}`;
