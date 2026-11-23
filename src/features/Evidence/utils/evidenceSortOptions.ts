// Focus: The sort orders offered by the evidence view's publication and clinical trial sections
import { getPrettyPrefValue } from '@/features/UserAuth/utils/formatPrefs';

// The evidence_sort preference values that apply to every sortable section
const SHARED_SORT_OPTIONS = ['dateHighLow', 'dateLowHigh', 'titleLowHigh', 'titleHighLow'] as const;
type SharedSortOption = (typeof SHARED_SORT_OPTIONS)[number];

/** Every evidence_sort preference value. The "source" values sort by journal. */
export const PUBLICATION_SORT_OPTIONS = [...SHARED_SORT_OPTIONS, 'sourceLowHigh', 'sourceHighLow'] as const;
export type PublicationSortOption = (typeof PUBLICATION_SORT_OPTIONS)[number];

/**
 * The orders offered for clinical trials. A trial has no journal, and the participant orders are
 * offered in the section only: they are not values of the evidence_sort preference.
 */
export const TRIAL_SORT_OPTIONS = [...SHARED_SORT_OPTIONS, 'participantsHighLow', 'participantsLowHigh'] as const;
export type TrialSortOption = (typeof TRIAL_SORT_OPTIONS)[number];

const SECTION_ONLY_LABELS: Record<Exclude<TrialSortOption, PublicationSortOption>, string> = {
  participantsHighLow: 'Participants: High to Low',
  participantsLowHigh: 'Participants: Low to High',
};

/** The display name of a sort order, matching the settings panel for preference values. */
export const getEvidenceSortLabel = (value: string): string =>
  Object.hasOwn(SECTION_ONLY_LABELS, value)
    ? SECTION_ONLY_LABELS[value as keyof typeof SECTION_ONLY_LABELS]
    : getPrettyPrefValue(value);

export const DEFAULT_EVIDENCE_SORT: SharedSortOption = 'dateHighLow';

/**
 * The sort order a section starts on: the user's evidence_sort preference when the section
 * offers it, newest first otherwise. This is the one place a stored preference is checked, so
 * everything downstream works with a known order.
 */
export const resolveEvidenceSort = <T extends string>(
  sortPreference: string | number | undefined,
  options: readonly (T | SharedSortOption)[],
): T | SharedSortOption => {
  const value = String(sortPreference);
  return options.find((option) => option === value) ?? DEFAULT_EVIDENCE_SORT;
};
