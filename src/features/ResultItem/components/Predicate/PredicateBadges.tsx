import { FC } from 'react';
import styles from './Predicate.module.scss';
import PubIcon from '@/assets/icons/status/HasPub.svg?react';
import CTIcon from '@/assets/icons/status/HasCT.svg?react';
import AcceptedOntologyIcon from '@/assets/icons/queries/Accepted Ontology.svg?react';

interface PredicateBadgesProps {
  hasPubs: boolean;
  hasCTs: boolean;
  isAcceptedOntology: boolean;
}

/** Evidence-type badges shown next to a predicate label; renders nothing when there are none. */
const PredicateBadges: FC<PredicateBadgesProps> = ({ hasPubs, hasCTs, isAcceptedOntology }) => {
  if (!hasPubs && !hasCTs && !isAcceptedOntology)
    return null;
  return (
    <div className={styles.badges}>
      {hasCTs && <CTIcon/>}
      {hasPubs && <PubIcon/>}
      {isAcceptedOntology && <AcceptedOntologyIcon/>}
    </div>
  );
};

export default PredicateBadges;
