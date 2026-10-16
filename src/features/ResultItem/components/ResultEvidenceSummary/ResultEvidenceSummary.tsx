import { FC } from 'react';
import styles from './ResultEvidenceSummary.module.scss';
import { EvidenceCountsContainer } from '@/features/Evidence/types/evidence';

interface ResultEvidenceSummaryProps {
  evidenceCounts: EvidenceCountsContainer | null;
  pathCount: number;
}

/**
 * The evidence-count and path-count columns of a result row. Renders two
 * sibling cells so it slots into the parent's grid.
 */
const ResultEvidenceSummary: FC<ResultEvidenceSummaryProps> = ({ evidenceCounts, pathCount }) => {
  const { publicationCount = 0, clinicalTrialCount = 0, miscCount = 0, sourceCount = 0 } = evidenceCounts ?? {};
  return (
    <>
      <div className={styles.evidenceContainer}>
        <span className={styles.evidenceLink}>
          <div>
            {publicationCount > 0 && <span className={styles.info}>Publications ({publicationCount})</span>}
            {clinicalTrialCount > 0 && <span className={styles.info}>Clinical Trials ({clinicalTrialCount})</span>}
            {miscCount > 0 && <span className={styles.info}>Misc ({miscCount})</span>}
            {sourceCount > 0 && <span className={styles.info}>Sources ({sourceCount})</span>}
          </div>
        </span>
      </div>
      <div className={styles.pathsContainer}>
        <span className={styles.paths}>
          <span className={styles.pathsNum}>{pathCount} {pathCount > 1 ? "Paths" : "Path"}</span>
        </span>
      </div>
    </>
  );
};

export default ResultEvidenceSummary;
