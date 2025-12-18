import { FC, useMemo } from "react";
import styles from "./QueryStatusPanel.module.scss";
import StatusIndicator from "@/features/Projects/components/StatusIndicator/StatusIndicator";
import QueryLoadingBar from "@/features/Sidebar/components/QueryLoadingBar/QueryLoadingBar";
import { ARAStatusResponse, ResultListLoadingData } from "@/features/ResultList/types/results.d";
import { getQueryStatusIndicatorStatus, getQueryStatusPercentage } from "@/features/Projects/utils/utilities";
import ResultListLoadingButton from "@/features/ResultList/components/ResultListLoadingButton/ResultListLoadingButton";

interface QueryStatusPanelProps {
  arsStatus: ARAStatusResponse | null;
  data: ResultListLoadingData;
  resultStatus: "error" | "running" | "success" | "unknown";
}

const QueryStatusPanel: FC<QueryStatusPanelProps> = ({
  arsStatus,
  data,
  resultStatus
}) => {
  const percentage = arsStatus ? getQueryStatusPercentage(arsStatus) : 5;
  const isComplete = arsStatus?.status === 'complete';

  const { label: statusLabel, status: statusIndicatorStatus } = useMemo(() => getQueryStatusIndicatorStatus(
    arsStatus,
    data.isFetchingARAStatus || false,
    data.hasFreshResults || false,
    data.isFetchingResults || false,
    resultStatus
  ), [arsStatus, data.isFetchingARAStatus, data.hasFreshResults, data.isFetchingResults, resultStatus]);

  return (
    <div className={styles.queryStatusPanel}>
      <div className={styles.top}>
        <span className={styles.statusLabel}>{statusLabel}</span>
        <div className={styles.statusIndicator}>
          <StatusIndicator status={statusIndicatorStatus} />
          <span className={styles.percentage}>{!!arsStatus?.status && `${percentage}% Loaded`}</span>
        </div>
        <QueryLoadingBar fillPercentage={percentage} full={isComplete} />
        <p>Translator results are loaded incrementally due to the complexity of our reasoning systems.</p>
      </div>
      <div className={styles.bottom}>
        <ResultListLoadingButton 
          hasFreshResults={data.hasFreshResults}
          showDisclaimer={data.showDisclaimer}
          handleResultsRefresh={data.handleResultsRefresh}
        />
      </div>
    </div>
  );
};

export default QueryStatusPanel;