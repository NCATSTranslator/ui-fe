import { FC, MouseEvent } from "react";
import styles from "./StatusSidebarIcon.module.scss";
import StatusIndicator from "@/features/Projects/components/StatusIndicator/StatusIndicator";
import Button from "@/features/Core/components/Button/Button";
import CloseIcon from "@/assets/icons/buttons/Close/Close.svg?react";
import Checkbox from "@/features/Core/components/Checkbox/Checkbox";
import { ARAStatusResponse, ResultListLoadingData } from "@/features/ResultList/types/results.d";
import { getQueryStatusPercentage } from "@/features/Projects/utils/utilities";
import ResultListLoadingButton from "@/features/ResultList/components/ResultListLoadingButton/ResultListLoadingButton";

interface StatusSidebarIconProps {
  arsStatus: ARAStatusResponse | null;
  data: ResultListLoadingData;
  hasFreshResults: boolean;
  setShowQueryStatusToast: (show: boolean) => void;
  showQueryStatusToast: boolean;
  status: 'running' | 'complete' | 'error' | 'unknown';
}
const StatusSidebarIcon: FC<StatusSidebarIconProps> = ({
  arsStatus,
  data,
  hasFreshResults,
  setShowQueryStatusToast,
  showQueryStatusToast,
  status
}) => {

  const localStorageKey = 'showQueryStatusToast';
  const showToast = showQueryStatusToast && localStorage.getItem(localStorageKey) !== 'false';
  const percentage = arsStatus ? getQueryStatusPercentage(arsStatus) : 5;

  const handleCloseToast = (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setShowQueryStatusToast(false);
  };
  
  const handleCheckboxClick = () => {
    setShowQueryStatusToast(false);
    localStorage.setItem(localStorageKey, 'false');
  };

  return (
    <div className={styles.statusSidebarIcon}>
      <StatusIndicator status={status} inSidebar redDot={hasFreshResults} className={styles.statusIndicator}/>
      {
        (status !== 'complete' && status !== 'error') && (
          <span className={styles.loadPercentage}>{percentage}%</span>
        )
      }
      {
        showToast && (
          <div className={`${styles.freshResultsToast} freshResultsToast`} onClick={(e) => e.stopPropagation()}>
            <span className={styles.toastHeading}>New Results Available!</span>
            <span className={styles.toastText}>Click the status tab or the button below to learn about and sync new results.</span>
            <ResultListLoadingButton 
              hasFreshResults={data.hasFreshResults}
              showDisclaimer={data.showDisclaimer}
              handleResultsRefresh={data.handleResultsRefresh}
              className={styles.loadingButton}
              showIcon={false}
            />
            <span className={styles.checkboxContainer}><Checkbox handleClick={handleCheckboxClick} className={styles.checkbox} />Don't show this again</span>
            <Button iconOnly iconLeft={<CloseIcon />} className={styles.closeButton} variant="textOnly" handleClick={handleCloseToast} />
          </div>
        )
      }
    </div>
  );
};

export default StatusSidebarIcon;