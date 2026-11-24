/** Every kind of evidence a result or edge can carry. */
export type EvidenceTypeKey = 'publications' | 'clinicalTrials' | 'drugLabels' | 'acceptedOntologies' | 'misc' | 'sources';

export interface EvidenceTypeLabel {
  singular: string;
  plural: string;
}

/**
 * Display names for each evidence type: the single source for the evidence section headings and
 * the result evidence bar. "Miscellaneous" reads the same for one item or many.
 */
export const EVIDENCE_TYPE_LABELS: Record<EvidenceTypeKey, EvidenceTypeLabel> = {
  publications: { singular: 'Publication', plural: 'Publications' },
  clinicalTrials: { singular: 'Clinical Trial', plural: 'Clinical Trials' },
  drugLabels: { singular: 'Drug Label', plural: 'Drug Labels' },
  acceptedOntologies: { singular: 'Accepted Ontology', plural: 'Accepted Ontologies' },
  misc: { singular: 'Miscellaneous', plural: 'Miscellaneous' },
  sources: { singular: 'Database', plural: 'Databases' },
};

/**
 * Formats a count followed by its evidence type name, singular for one item
 * (e.g. "1 Publication", "7 Publications").
 *
 * @param {number} count - The number of items.
 * @param {EvidenceTypeKey} type - The evidence type being counted.
 * @returns {string} The count and type name.
 */
export const formatEvidenceCount = (count: number, type: EvidenceTypeKey): string => {
  const { singular, plural } = EVIDENCE_TYPE_LABELS[type];
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
};
