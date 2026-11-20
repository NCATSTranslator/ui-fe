import { FC } from 'react';
import styles from './ResultEvidenceSummary.module.scss';
import { EvidenceCountsContainer } from '@/features/Evidence/types/evidence';
import EvidenceBar from '@/features/ResultItem/components/EvidenceBar/EvidenceBar';

interface ResultEvidenceSummaryProps {
  evidenceCounts: EvidenceCountsContainer | null;
  // Largest total evidence count of any result in the query
  maxEvidenceTotal: number;
  pathCount: number;
}

/**
 * The evidence and path-count columns of a result row. Renders two
 * sibling cells so it slots into the parent's grid.
 */
const ResultEvidenceSummary: FC<ResultEvidenceSummaryProps> = ({ evidenceCounts, maxEvidenceTotal, pathCount }) => {
  return (
    <>
      <div className={styles.evidenceContainer}>
        <EvidenceBar evidenceCounts={evidenceCounts} maxEvidenceTotal={maxEvidenceTotal} />
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
