import { FC } from 'react';
import styles from './PredicateBadges.module.scss';
import { EvidenceTypeKey } from '@/features/Evidence/utils/evidenceLabels';
import { EVIDENCE_TYPE_ICONS } from '@/features/Evidence/utils/evidenceIcons';

interface PredicateBadgesProps {
  hasPubs: boolean;
  hasCTs: boolean;
  hasDrugLabels: boolean;
  isAcceptedOntology: boolean;
}

/** Evidence-type badges shown next to a predicate label; renders nothing when there are none. */
const PredicateBadges: FC<PredicateBadgesProps> = ({ hasPubs, hasCTs, hasDrugLabels, isAcceptedOntology }) => {
  // Listed in display order
  const badges: [EvidenceTypeKey, boolean][] = [
    ['clinicalTrials', hasCTs],
    ['publications', hasPubs],
    ['drugLabels', hasDrugLabels],
    ['acceptedOntologies', isAcceptedOntology],
  ];
  const shown = badges.filter(([, isShown]) => isShown);
  if (shown.length === 0)
    return null;
  return (
    <div className={styles.badges}>
      {shown.map(([type]) => {
        const Icon = EVIDENCE_TYPE_ICONS[type];
        return Icon ? <Icon key={type}/> : null;
      })}
    </div>
  );
};

export default PredicateBadges;
