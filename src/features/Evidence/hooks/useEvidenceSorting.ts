import { useCallback, useMemo, useState } from 'react';
import {
  PUBLICATION_SORT_OPTIONS,
  PublicationSortOption,
  TRIAL_SORT_OPTIONS,
  TrialSortOption,
  resolveEvidenceSort,
} from '@/features/Evidence/utils/evidenceSortOptions';

export interface SectionSort<T extends string> {
  value: T;
  onChange: (value: T) => void;
}

export interface EvidenceSorting {
  publications: SectionSort<PublicationSortOption>;
  clinicalTrials: SectionSort<TrialSortOption>;
}

interface SortValues {
  publications?: PublicationSortOption;
  clinicalTrials?: TrialSortOption;
}

interface SortChoices {
  /** The preference the choices were made under; they are dropped once it changes. */
  preference: string | number | undefined;
  values: SortValues;
}

/**
 * The sort order of the publications and clinical trials sections. Each starts on the user's
 * evidence_sort preference and can be changed for the current view without saving the preference.
 * Changing the preference itself puts both sections back on it.
 */
const useEvidenceSorting = (sortPreference: string | number | undefined): EvidenceSorting => {
  const [choices, setChoices] = useState<SortChoices>({ preference: sortPreference, values: {} });
  const chosen = choices.preference === sortPreference ? choices.values : undefined;

  const choose = useCallback((values: SortValues) => {
    setChoices((prev) => ({
      preference: sortPreference,
      values: { ...(prev.preference === sortPreference ? prev.values : {}), ...values },
    }));
  }, [sortPreference]);

  const publicationSort = chosen?.publications ?? resolveEvidenceSort(sortPreference, PUBLICATION_SORT_OPTIONS);
  const trialSort = chosen?.clinicalTrials ?? resolveEvidenceSort(sortPreference, TRIAL_SORT_OPTIONS);

  return useMemo(() => ({
    publications: { value: publicationSort, onChange: (value) => choose({ publications: value }) },
    clinicalTrials: { value: trialSort, onChange: (value) => choose({ clinicalTrials: value }) },
  }), [publicationSort, trialSort, choose]);
};

export default useEvidenceSorting;
