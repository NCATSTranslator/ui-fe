import { useMemo } from 'react';
import { TrialObject } from '@/features/Evidence/types/evidence.d';
import useClinicalTrialMetadata, { ClinicalTrialMeta } from '@/features/NodeInformationView/hooks/useClinicalTrialMetadata';
import {
  getTrialIdsNeedingMetadata,
  mergeTrialMetadata,
  trialNeedsMetadata,
} from '@/features/Evidence/components/ClinicalTrialsList/clinicalTrialHelpers';

/** What was fetched from ClinicalTrials.gov for an edge's trials, and what is still on its way. */
export interface TrialMetadata {
  byId: Record<string, ClinicalTrialMeta>;
  /** The ids of the trials whose missing details are still being fetched. */
  pendingIds: ReadonlySet<string>;
}

const NONE_PENDING: ReadonlySet<string> = new Set();

/**
 * An edge's clinical trials with the details they arrived without (title, start date, phase,
 * status, or size) filled in from ClinicalTrials.gov. The trials keep the order they were given in.
 */
const useEnrichedTrials = (clinicalTrials: TrialObject[]) => {
  const idsNeedingMetadata = useMemo(() => getTrialIdsNeedingMetadata(clinicalTrials), [clinicalTrials]);
  const { trials: fetchedMetadata, isLoading } = useClinicalTrialMetadata(idsNeedingMetadata);

  const metadata = useMemo((): TrialMetadata => ({
    byId: Object.fromEntries(fetchedMetadata.map((meta) => [meta.nctId, meta])),
    pendingIds: isLoading ? new Set(idsNeedingMetadata) : NONE_PENDING,
  }), [fetchedMetadata, isLoading, idsNeedingMetadata]);

  const trials = useMemo(
    () => clinicalTrials.map((trial) => {
      if (!trial.id || !trialNeedsMetadata(trial)) return trial;
      return mergeTrialMetadata(trial, metadata.byId[trial.id]);
    }),
    [clinicalTrials, metadata],
  );

  return { trials, metadata, isLoading };
};

export default useEnrichedTrials;
