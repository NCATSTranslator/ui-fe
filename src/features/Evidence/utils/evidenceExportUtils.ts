import { Provenance, PublicationObject, TrialObject } from '@/features/Evidence/types/evidence';
import { ResultEdge } from '@/features/ResultList/types/results.d';
import { joinArrayForCSV, rowsToCSV } from '@/features/Core/utils/csvUtils';
import { getLocalDateStamp } from '@/features/Core/utils/dateHelpers';
import { triggerDownload, sanitizeForFilename } from '@/features/Core/utils/fileDownloadUtils';
import {
  EdgeEvidence,
  FormattedMiscEvidence,
  getKnowledgeLevelString,
  getPublicationDisplaySnippet,
  GroupedSource,
} from '@/features/Evidence/utils/utilities';
import { trackEvent } from '@/features/Analytics/utils/dataLayer';

type EvidenceCSVType = 'publication' | 'clinical_trial' | 'drug_label' | 'miscellaneous' | 'database';

// Every evidence type shares one sheet so a single file covers the whole edge;
// columns that don't apply to a row's type are left blank. This list is the one
// place columns are declared: the row type and the blank row derive from it.
const CSV_HEADERS = [
  'evidence_type',
  'id',
  'title',
  'url',
  'date',
  'journal',
  'snippet',
  'knowledge_level',
  'source_name',
  'source_infores',
  'source_wiki',
  'trial_phase',
  'trial_status',
  'trial_size',
  'trial_enrollment_type',
  'trial_includes_children',
] as const;

type EvidenceCSVColumn = typeof CSV_HEADERS[number];
type EvidenceCSVRow =
  & { evidence_type: EvidenceCSVType }
  & Record<Exclude<EvidenceCSVColumn, 'evidence_type'>, string>;

const emptyRow = (evidenceType: EvidenceCSVType): EvidenceCSVRow => ({
  ...(Object.fromEntries(CSV_HEADERS.map(header => [header, ''])) as Record<EvidenceCSVColumn, string>),
  evidence_type: evidenceType,
});

/** Maps raw knowledge-level ids to curated labels; blank stays blank. */
const formatKnowledgeLevel = (level: string | null | undefined): string =>
  level ? getKnowledgeLevelString(level) : '';

const publicationRow = (pub: PublicationObject, edge: ResultEdge | null): EvidenceCSVRow => ({
  ...emptyRow('publication'),
  id: pub.id ?? '',
  title: pub.title ?? '',
  url: pub.url ?? '',
  date: pub.pubdate ?? '',
  journal: pub.journal ?? '',
  snippet: getPublicationDisplaySnippet(pub, edge),
  knowledge_level: formatKnowledgeLevel(pub.knowledgeLevel ?? pub.source?.knowledge_level),
  source_name: pub.source?.name ?? '',
  source_infores: joinArrayForCSV(pub.infores),
});

// A trial's source is the clinical trials source of its edge, when the edge has it
const uniqueSourceValues = (sources: Provenance[] | undefined, key: 'name' | 'infores'): string[] =>
  [...new Set((sources ?? []).map(source => source[key] ?? '').filter(Boolean))];

const trialRow = (trial: TrialObject): EvidenceCSVRow => ({
  ...emptyRow('clinical_trial'),
  source_name: joinArrayForCSV(uniqueSourceValues(trial.sources, 'name')),
  source_infores: joinArrayForCSV(uniqueSourceValues(trial.sources, 'infores')),
  id: trial.id ?? '',
  title: trial.title ?? '',
  url: trial.url ?? '',
  date: trial.start_date ?? '',
  trial_phase: String(trial.phase ?? ''),
  trial_status: trial.status ?? '',
  trial_size: String(trial.size ?? ''),
  trial_enrollment_type: trial.type ?? '',
  trial_includes_children: String(trial.child ?? ''),
});

const sourceRow = (source: GroupedSource): EvidenceCSVRow => ({
  ...emptyRow('database'),
  url: joinArrayForCSV(source.urls),
  knowledge_level: joinArrayForCSV(source.knowledgeLevels.map(getKnowledgeLevelString)),
  source_name: source.name,
  source_infores: joinArrayForCSV(source.infores),
  source_wiki: source.wiki ?? '',
});

const linkRow = (evidenceType: EvidenceCSVType, item: FormattedMiscEvidence): EvidenceCSVRow => ({
  ...emptyRow(evidenceType),
  id: item.id,
  url: item.url,
});

const buildEvidenceRows = (evidence: EdgeEvidence, edge: ResultEdge | null): EvidenceCSVRow[] => [
  ...evidence.publications.map(pub => publicationRow(pub, edge)),
  ...evidence.clinicalTrials.map(trialRow),
  ...evidence.drugLabels.map(item => linkRow('drug_label', item)),
  ...evidence.miscEvidence.map(item => linkRow('miscellaneous', item)),
  ...evidence.sources.map(sourceRow),
];

/**
 * Builds a single CSV holding every evidence type available for an edge.
 */
export const buildEdgeEvidenceCSV = (evidence: EdgeEvidence, edge: ResultEdge | null = null): string =>
  rowsToCSV(CSV_HEADERS, buildEvidenceRows(evidence, edge));

export const buildEdgeEvidenceFilename = (edgeLabel: string | null | undefined, date: Date = new Date()): string => {
  const datePart = getLocalDateStamp(date);
  const labelPart = sanitizeForFilename(edgeLabel ?? '') || 'edge';
  return `${labelPart}_evidence_${datePart}.csv`;
};

/**
 * Downloads all of an edge's evidence as one CSV. Does nothing when the edge
 * has no exportable evidence, so an empty file is never produced.
 */
export const downloadEdgeEvidence = (
  evidence: EdgeEvidence,
  edge: ResultEdge | null,
  edgeLabel: string | null | undefined,
): void => {
  const rows = buildEvidenceRows(evidence, edge);
  if (rows.length === 0) return;
  triggerDownload(rowsToCSV(CSV_HEADERS, rows), buildEdgeEvidenceFilename(edgeLabel), 'text/csv');
  // Tracked after the empty bail-out, so this counts files actually produced
  // rather than clicks on the button.
  trackEvent('evidence_downloaded', { export_format: 'csv', item_count: rows.length });
};
