import { FC } from "react";
import styles from "./QueryStatusPanel.module.scss";
import StatusIndicator from "@/features/Projects/components/StatusIndicator/StatusIndicator";
import QueryLoadingBar from "@/features/Sidebar/components/QueryLoadingBar/QueryLoadingBar";
import { ARAStatusResponse, ResultListLoadingData } from "@/features/ResultList/types/results.d";
import { QueryStatus } from "@/features/Projects/types/projects";
import { getQueryStatusPercentage } from "@/features/Projects/utils/utilities";
import ResultListLoadingButton from "@/features/ResultList/components/ResultListLoadingButton/ResultListLoadingButton";

interface QueryStatusPanelProps {
  arsStatus: ARAStatusResponse | null;
  data: ResultListLoadingData;
}

const QueryStatusPanel: FC<QueryStatusPanelProps> = ({
  arsStatus,
  data
}) => {
  const percentage = arsStatus ? getQueryStatusPercentage(arsStatus) : 5;
  const isComplete = arsStatus?.status === 'complete';

  return (
    <div className={styles.queryStatusPanel}>
      <div className={styles.top}>        
        <div className={styles.statusIndicator}>
          <StatusIndicator status={arsStatus?.status as QueryStatus || "unknown"} />
          <span className={styles.percentage}>{!!arsStatus?.status ? `${percentage}% Loaded` : `Loading`}</span>
        </div>
        <QueryLoadingBar fillPercentage={percentage} full={isComplete} />
        <p>Translator results are loaded incrementally due to the complexity of our reasoning systems. As more results become available, you'll be prompted to refresh the page to view them.</p>
      </div>
      <div className={styles.bottom}>
        <ResultListLoadingButton 
          hasFreshResults={data.hasFreshResults}
          isFetchingARAStatus={data.isFetchingARAStatus ?? false}
          isFetchingResults={data.isFetchingResults ?? false}
          isError={data.isError}
          showDisclaimer={data.showDisclaimer}
          handleResultsRefresh={data.handleResultsRefresh}
          setIsActive={data.setIsActive ?? (() => {console.log("no setIsActive function provided in QueryStatusPanel")})}
          currentPercentage={percentage}
        />
      </div>
    </div>
  );
};

export default QueryStatusPanel;