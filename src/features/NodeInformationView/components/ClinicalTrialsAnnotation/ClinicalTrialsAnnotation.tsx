import { FC, useMemo } from "react";
import useClinicalTrialMetadata from "@/features/NodeInformationView/hooks/useClinicalTrialMetadata";
import ClinicalTrialTitleLink from "@/features/NodeInformationView/components/ClinicalTrialTitleLink/ClinicalTrialTitleLink";
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
            <ClinicalTrialTitleLink
              url={trial.url}
              title={trial.title}
              fallbackId={trial.nctId}
              isLoading={isLoading}
              skeletonWidth="70%"
              year={trial.year}
              yearClassName={styles.trialYear}
            />
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
