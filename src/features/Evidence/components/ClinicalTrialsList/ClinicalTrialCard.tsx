import { FC } from 'react';
import { TrialObject } from '@/features/Evidence/types/evidence.d';
import { getUrlByType, GroupedSource } from '@/features/Evidence/utils/utilities';
import { ClinicalTrialMeta } from '@/features/NodeInformationView/hooks/useClinicalTrialMetadata';
import ClinicalTrialTitleLink from '@/features/NodeInformationView/components/ClinicalTrialTitleLink/ClinicalTrialTitleLink';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import SkeletonBar from '@/features/Core/components/SkeletonBar/SkeletonBar';
import SourceLink from '@/features/Evidence/components/EvidenceLink/SourceLink';
import CardMeta from '@/features/Evidence/components/EvidenceSection/CardMeta';
import {
  getTrialDisplayId,
  getTrialSummary,
  getTrialYear,
} from '@/features/Evidence/components/ClinicalTrialsList/clinicalTrialHelpers';
import cardStyles from '@/features/Evidence/components/EvidenceSection/evidenceCards.module.scss';

interface ClinicalTrialCardProps {
  trial: TrialObject;
  meta: ClinicalTrialMeta | undefined;
  /** True while the details this trial is missing are still being fetched. */
  isLoadingMetadata: boolean;
  /** The sources credited for the trial (see getTrialSources), already grouped by name. */
  sources: GroupedSource[];
}

const ClinicalTrialCard: FC<ClinicalTrialCardProps> = ({ trial, meta, isLoadingMetadata, sources }) => {
  const url = trial.url || (trial.id ? getUrlByType(trial.id, 'NCT') : '');
  const displayId = getTrialDisplayId(trial.id);
  const summary = getTrialSummary(trial, meta);

  return (
    <li className={cardStyles.card}>
      <div className={cardStyles.header}>
        <span className={cardStyles.title}>
          <ClinicalTrialTitleLink
            url={url}
            title={trial.title}
            fallbackId={displayId}
            isLoading={isLoadingMetadata}
            skeletonWidth="16em"
          />
        </span>
        <span className={cardStyles.year}>
          {isLoadingMetadata && !trial.start_date
            ? <SkeletonBar width="2.5em" height="1em" />
            : getTrialYear(trial.start_date)}
        </span>
      </div>
      {isLoadingMetadata && summary.length === 0
        ? <SkeletonBar width="14em" height="1em" />
        : summary.length > 0 && <p className={joinClasses(cardStyles.meta, cardStyles.summary)}>{summary.join(' · ')}</p>}
      <CardMeta>
        {!!displayId && <span>{displayId}</span>}
        {sources.length > 0 && (
          <span>
            {sources.map((source, i) => (
              <span key={source.name}>
                <SourceLink name={source.name} url={source.urls[0]} />
                {i < sources.length - 1 && ', '}
              </span>
            ))}
          </span>
        )}
      </CardMeta>
    </li>
  );
};

export default ClinicalTrialCard;
