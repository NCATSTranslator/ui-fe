import { FC, useMemo } from "react";
import styles from "./QueryStatusPanel.module.scss";
import StatusIndicator from "@/features/Projects/components/StatusIndicator/StatusIndicator";
import QueryLoadingBar from "@/features/Sidebar/components/QueryLoadingBar/QueryLoadingBar";
import { ARAStatusResponse, ResultListLoadingData } from "@/features/ResultList/types/results.d";
import { getQueryStatusIndicatorStatus, getQueryStatusPercentage } from "@/features/Projects/utils/utilities";
import ResultListLoadingButton from "@/features/ResultList/components/ResultListLoadingButton/ResultListLoadingButton";
import { Link } from "react-router-dom";

interface QueryStatusPanelProps {
  arsStatus: ARAStatusResponse | null;
  data: ResultListLoadingData;
  resultCount: number;
  resultStatus: "error" | "running" | "success" | "unknown";
}

const QueryStatusPanel: FC<QueryStatusPanelProps> = ({
  arsStatus,
  data,
  resultCount,
  resultStatus
}) => {
  const percentage = arsStatus ? getQueryStatusPercentage(arsStatus) : 5;
  const isComplete = arsStatus?.status === 'complete';

  const { label: statusLabel, status: statusIndicatorStatus } = useMemo(() => getQueryStatusIndicatorStatus(
    arsStatus,
    data.isFetchingARAStatus || false,
    data.hasFreshResults || false,
    data.isFetchingResults || false,
    resultStatus,
    resultCount
  ), [arsStatus, data.isFetchingARAStatus, data.hasFreshResults, data.isFetchingResults, resultStatus, resultCount]);

  const hideLoadingBar = useMemo(() => {
    return isComplete || statusLabel === 'All Results Shown' || statusLabel === 'No Results' || statusLabel === 'Error';
  }, [isComplete, statusLabel]);

  return (
    <div className={styles.queryStatusPanel}>
      <div className={styles.top}>
        <span className={styles.statusLabel}>{statusLabel}</span>
        <div className={styles.statusIndicator}>
          <StatusIndicator status={statusIndicatorStatus} />
          <span className={styles.percentage}>{!!arsStatus?.status && `${percentage}% Loaded`}</span>
        </div>
        <QueryLoadingBar fillPercentage={percentage} full={isComplete} hide={hideLoadingBar} />
        {
          statusLabel === 'Error' && (
            <p>There was an error while processing your query results. Please try again later, or try clearing your cache if the problem persists.</p>
          )
        }
        {
          statusLabel === 'No Results' && (
            <p>There are no results available for your query.</p>
          )
        }
        {
          (statusLabel === '' || statusLabel === 'New Results Available') && (
            <p>Translator results are loaded incrementally due to the complexity of our reasoning systems. As more results become available, you'll be prompted to refresh the page to view them.</p>
          )
        }
        <p>You can <Link to="/new-query">run another query</Link> or explore the results, bookmarks, and notes from your past queries in your <Link to="/projects">Projects</Link> or <Link to="/query-history">Query History</Link> while you wait for results to load.</p>
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