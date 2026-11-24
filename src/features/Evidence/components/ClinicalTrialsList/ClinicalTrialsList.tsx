import { FC, useMemo } from 'react';
import { Provenance, TrialObject } from '@/features/Evidence/types/evidence.d';
import { GroupedSource, groupSourcesByName } from '@/features/Evidence/utils/utilities';
import { TrialMetadata } from '@/features/Evidence/hooks/useEnrichedTrials';
import ClinicalTrialCard from '@/features/Evidence/components/ClinicalTrialsList/ClinicalTrialCard';
import cardStyles from '@/features/Evidence/components/EvidenceSection/evidenceCards.module.scss';

const NO_SOURCES: GroupedSource[] = [];

interface ClinicalTrialsListProps {
  /** Already enriched and in display order (see useEnrichedTrials and sortTrials). */
  clinicalTrials: TrialObject[];
  metadata: TrialMetadata;
}

/**
 * The clinical trials supporting the selected relationship, in the order given. A trial whose
 * missing details are still being fetched from ClinicalTrials.gov shows placeholders for them.
 */
const ClinicalTrialsList: FC<ClinicalTrialsListProps> = ({ clinicalTrials, metadata }) => {
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
      {clinicalTrials.map((trial, i) => (
        <ClinicalTrialCard
          key={trial.id || i}
          trial={trial}
          meta={trial.id ? metadata.byId[trial.id] : undefined}
          isLoadingMetadata={!!trial.id && metadata.pendingIds.has(trial.id)}
          sources={(trial.sources && groupedSources.get(trial.sources)) ?? NO_SOURCES}
        />
      ))}
    </ul>
  );
};

export default ClinicalTrialsList;
