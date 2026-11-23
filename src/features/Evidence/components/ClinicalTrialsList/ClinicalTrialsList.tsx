import { FC, useMemo } from 'react';
import { Provenance, TrialObject } from '@/features/Evidence/types/evidence.d';
import { GroupedSource, groupSourcesByName } from '@/features/Evidence/utils/utilities';
import useClinicalTrialMetadata from '@/features/NodeInformationView/hooks/useClinicalTrialMetadata';
import ClinicalTrialCard from '@/features/Evidence/components/ClinicalTrialsList/ClinicalTrialCard';
import {
  getTrialIdsNeedingMetadata,
  mergeTrialMetadata,
  sortTrialsNewestFirst,
  trialNeedsMetadata,
} from '@/features/Evidence/components/ClinicalTrialsList/clinicalTrialHelpers';
import cardStyles from '@/features/Evidence/components/EvidenceSection/evidenceCards.module.scss';

const NO_SOURCES: GroupedSource[] = [];

interface ClinicalTrialsListProps {
  clinicalTrials: TrialObject[];
}

/**
 * The clinical trials supporting the selected relationship, newest first. Trials that arrive
 * without a title, start date, phase, status, or size have those filled in from ClinicalTrials.gov.
 */
const ClinicalTrialsList: FC<ClinicalTrialsListProps> = ({ clinicalTrials }) => {
  const idsNeedingMetadata = useMemo(
    () => getTrialIdsNeedingMetadata(clinicalTrials),
    [clinicalTrials],
  );
  const idsNeedingMetadataSet = useMemo(() => new Set(idsNeedingMetadata), [idsNeedingMetadata]);
  const { trials: fetchedMetadata, isLoading: metadataLoading } = useClinicalTrialMetadata(idsNeedingMetadata);

  const metadataById = useMemo(
    () => Object.fromEntries(fetchedMetadata.map((meta) => [meta.nctId, meta])),
    [fetchedMetadata],
  );

  // Sorted after enrichment, since a trial's start date may only arrive with its metadata
  const enrichedTrials = useMemo(
    () => sortTrialsNewestFirst(clinicalTrials.map((trial) => {
      if (!trial.id || !trialNeedsMetadata(trial)) return trial;
      return mergeTrialMetadata(trial, metadataById[trial.id]);
    })),
    [clinicalTrials, metadataById],
  );

  // Trials on an edge share one list of sources, so each distinct list is grouped once, not per card
  const groupedSources = useMemo(() => {
    const byList = new Map<Provenance[], GroupedSource[]>();
    for (const { sources } of clinicalTrials) {
      if (sources && !byList.has(sources)) byList.set(sources, groupSourcesByName(sources));
    }
    return byList;
  }, [clinicalTrials]);

  return (
    <ul className={cardStyles.list}>
      {enrichedTrials.map((trial, i) => (
        <ClinicalTrialCard
          key={trial.id || i}
          trial={trial}
          meta={trial.id ? metadataById[trial.id] : undefined}
          isLoadingMetadata={metadataLoading && !!trial.id && idsNeedingMetadataSet.has(trial.id)}
          sources={(trial.sources && groupedSources.get(trial.sources)) ?? NO_SOURCES}
        />
      ))}
    </ul>
  );
};

export default ClinicalTrialsList;
