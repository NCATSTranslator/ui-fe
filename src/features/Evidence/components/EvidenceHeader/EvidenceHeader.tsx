import { FC } from 'react';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import styles from '@/features/Evidence/components/EvidenceModal/EvidenceModal.module.scss';

interface EvidenceHeaderProps {
  isInferred: boolean;
  pathKey: string;
  edgeLabel: string | null;
  edgeSeen: boolean;
  onToggleSeen: () => void;
}

const EvidenceHeader: FC<EvidenceHeaderProps> = ({
  isInferred,
  pathKey,
  edgeLabel,
  edgeSeen,
  onToggleSeen,
}) => {
  return (
    <>
      <h5 className={styles.title}>
        {isInferred ? "Indirect" : "Direct"} Path {pathKey} Evidence
      </h5>
      <div className={styles.labelContainer}>
        {edgeLabel && (
          <p className={styles.subtitle}>{edgeLabel}</p>
        )}
        <span className={styles.sep}>·</span>
        <p 
          className={styles.toggleSeen}
          onClick={onToggleSeen}
        >
          Mark as {edgeSeen ? "Unseen" : "Seen"}
        </p>
      </div>
      <Tooltip id="knowledge-sources-tooltip">
        <span>The resources that provided the information supporting the selected relationship.</span>
      </Tooltip>
    </>
  );
}; 

export default EvidenceHeader;