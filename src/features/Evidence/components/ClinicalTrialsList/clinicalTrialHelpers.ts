import { TrialObject } from '@/features/Evidence/types/evidence.d';
import { ClinicalTrialMeta, formatTrialPhase } from '@/features/NodeInformationView/hooks/useClinicalTrialMetadata';
import { compareWithFallback } from '@/features/Core/utils/sortingFunctions';
import { TrialSortOption } from '@/features/Evidence/utils/evidenceSortOptions';

/** Whether a trial is missing details that ClinicalTrials.gov metadata can fill in. */
export const trialNeedsMetadata = (trial: TrialObject): boolean =>
  !!trial.id && (
    !trial.title ||
    !trial.start_date ||
    trial.status === 'UNKNOWN' ||
    !trial.phase ||
    !trial.size
  );

/** The distinct ids of the trials that need metadata fetched. */
export const getTrialIdsNeedingMetadata = (trials: TrialObject[]): string[] => [
  ...new Set(
    trials
      .filter(trialNeedsMetadata)
      .flatMap((trial) => (trial.id ? [trial.id] : [])),
  ),
];

/** Fills a trial's missing details from fetched metadata, which wins where both have a value. */
export const mergeTrialMetadata = (
  trial: TrialObject,
  meta: ClinicalTrialMeta | undefined,
): TrialObject => {
  if (!meta) return trial;
  return {
    ...trial,
    title: meta.title ?? trial.title,
    url: meta.url || trial.url,
    start_date: meta.startDate ?? trial.start_date,
    phase: meta.phase || trial.phase,
    status: meta.status ?? trial.status,
    size: meta.enrollmentCount ?? trial.size,
    type: meta.enrollmentType ?? trial.type,
  };
};

const getPhaseDisplay = (meta: ClinicalTrialMeta | undefined, phase: number): string => {
  if (meta?.phases.length) return formatTrialPhase(meta.phases, phase);
  return phase ? String(phase) : '';
};

// "NOT_YET_RECRUITING" -> "Not yet recruiting"
const formatStatus = (status: string): string => {
  if (!status || status === 'UNKNOWN') return '';
  const words = status.replaceAll('_', ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** The year a trial started, or an empty string when its start date is missing or unreadable. */
export const getTrialYear = (startDate: string): string => {
  if (!startDate) return '';
  const year = new Date(startDate).getUTCFullYear();
  return Number.isNaN(year) ? '' : String(year);
};

type TrialComparator = (a: TrialObject, b: TrialObject) => number;

const getStartTime = (trial: TrialObject): number | null => {
  const time = trial.start_date ? new Date(trial.start_date).getTime() : NaN;
  return Number.isNaN(time) ? null : time;
};

// Trials without a readable start date go last in either direction
const byStartDate = (newestFirst: boolean): TrialComparator => (a, b) => {
  const aTime = getStartTime(a);
  const bTime = getStartTime(b);
  if (aTime === bTime) return 0;
  if (aTime === null) return 1;
  if (bTime === null) return -1;
  return newestFirst ? bTime - aTime : aTime - bTime;
};

// Trials without a participant count go last in either direction
const byParticipants = (highestFirst: boolean): TrialComparator => (a, b) => {
  const aSize = a.size || 0;
  const bSize = b.size || 0;
  if (aSize === bSize) return 0;
  if (!aSize) return 1;
  if (!bSize) return -1;
  return highestFirst ? bSize - aSize : aSize - bSize;
};

// One comparator per order the clinical trials section offers. Trials without a title go last in
// either direction, as publications without one do.
const TRIAL_COMPARATORS: Record<TrialSortOption, TrialComparator> = {
  dateHighLow: byStartDate(true),
  dateLowHigh: byStartDate(false),
  titleLowHigh: (a, b) => compareWithFallback(a.title, b.title, 'asc'),
  titleHighLow: (a, b) => compareWithFallback(a.title, b.title, 'desc'),
  participantsHighLow: byParticipants(true),
  participantsLowHigh: byParticipants(false),
};

/**
 * Orders trials by one of the orders the clinical trials section offers: by start date, title, or
 * number of participants. Trials missing the detail being sorted on go last, and trials that tie
 * keep their original order. Returns a new array.
 */
export const sortTrials = (trials: TrialObject[], sort: TrialSortOption): TrialObject[] =>
  [...trials].sort(TRIAL_COMPARATORS[sort]);

/** The NCT id as displayed, without the CURIE prefix some trial ids carry. */
export const getTrialDisplayId = (id: string | undefined): string => {
  if (!id) return '';
  const nctIndex = id.toUpperCase().indexOf('NCT');
  return nctIndex === -1 ? id : id.slice(nctIndex);
};

/**
 * The facts shown on a trial's summary line, in order: phase, enrollment, and status. Facts the
 * trial has no value for are left out.
 */
export const getTrialSummary = (trial: TrialObject, meta: ClinicalTrialMeta | undefined): string[] => {
  const phase = getPhaseDisplay(meta, trial.phase);
  return [
    phase ? `Phase ${phase}` : '',
    trial.size ? `${trial.size.toLocaleString()} ${trial.type || 'enrolled'}` : '',
    formatStatus(trial.status),
  ].filter(Boolean);
};
