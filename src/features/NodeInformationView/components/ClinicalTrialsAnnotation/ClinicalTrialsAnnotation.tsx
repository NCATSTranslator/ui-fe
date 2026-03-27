import { FC, useMemo } from "react";
import useClinicalTrialMetadata from "@/features/NodeInformationView/hooks/useClinicalTrialMetadata";
import SkeletonBar from "@/features/Core/components/SkeletonBar/SkeletonBar";
import styles from "./ClinicalTrialsAnnotation.module.scss";

const DISPLAY_LIMIT = 5;

interface ClinicalTrialsAnnotationProps {
  nctIds: string[];
  nodeName: string;
  nodeType: string;
}

const ClinicalTrialsAnnotation: FC<ClinicalTrialsAnnotationProps> = ({ nctIds, nodeName, nodeType }) => {
  const uniqueIds = useMemo(() => [...new Set(nctIds)], [nctIds]);
  const displayedIds = useMemo(() => uniqueIds.slice(0, DISPLAY_LIMIT), [uniqueIds]);
  const { trials, isLoading } = useClinicalTrialMetadata(displayedIds);
  const param = (nodeType === 'biolink:Drug' || nodeType === 'biolink:SmallMolecule') ? 'intr' : (nodeType === 'biolink:Disease' || nodeType === 'biolink:PhenotypicFeature') ? 'cond' : 'term';
  const searchUrl = `https://clinicaltrials.gov/search?${param}=${encodeURIComponent(nodeName)}&viewType=Card`;

  return (
    <div className={styles.clinicalTrialsAnnotation}>
      <p className={styles.description}>These clinical trials are related to {nodeName} and may not directly correspond to your query.</p>
      <ul className={styles.trialList}>
        {trials.map((trial) => (
          <li key={trial.nctId} className={styles.trialItem}>
            {isLoading && !trial.title ? (
              <>
                <SkeletonBar width="70%" height="1em" />
                <SkeletonBar width="3em" height="0.85em" />
              </>
            ) : (
              <>
                <a href={trial.url} target="_blank" rel="noreferrer">
                  {trial.title ?? trial.nctId}
                </a>
                {trial.year && <span className={styles.trialYear}>{trial.year}</span>}
              </>
            )}
          </li>
        ))}
        <li>
          <a className={styles.viewAllLink} href={searchUrl} target="_blank" rel="noreferrer">
            View all on clinicaltrials.gov
          </a>
        </li>
      </ul>
    </div>
  );
};

export default ClinicalTrialsAnnotation;
