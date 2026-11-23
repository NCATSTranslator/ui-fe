import { FC, ReactNode, useId } from 'react';
import InfoTooltip from '@/features/Core/components/Tooltip/InfoTooltip';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import { EvidenceTypeKey } from '@/features/Evidence/utils/evidenceLabels';
import { EVIDENCE_TYPE_ICONS } from '@/features/Evidence/utils/evidenceIcons';
import { getSectionDomId } from '@/features/Evidence/utils/evidenceSections';
import styles from './EvidenceSection.module.scss';

interface EvidenceSectionProps {
  /** The evidence type the section shows; decides its icon and the id links scroll to. */
  sectionKey: EvidenceTypeKey;
  heading: string;
  /** Explanation shown from an info icon beside the heading. */
  tooltip?: string;
  children: ReactNode;
}

/**
 * One block of the evidence view: a heading over a body that grows with its content up to a
 * maximum height, then scrolls.
 */
const EvidenceSection: FC<EvidenceSectionProps> = ({ sectionKey, heading, tooltip, children }) => {
  const headingId = useId();
  const Icon = EVIDENCE_TYPE_ICONS[sectionKey];

  return (
    <section id={getSectionDomId(sectionKey)} className={styles.section} aria-labelledby={headingId}>
      <h6 id={headingId} className={styles.heading}>
        {Icon && <Icon className={styles.icon} aria-hidden="true" />}
        {heading}
        {tooltip && (
          <InfoTooltip iconClassName={styles.infoIcon}>
            <span>{tooltip}</span>
          </InfoTooltip>
        )}
      </h6>
      <div className={joinClasses(styles.body, 'scrollable')}>
        {children}
      </div>
    </section>
  );
};

export default EvidenceSection;
