import styles from './ResultListLoadingButton.module.scss';
import { useState } from 'react';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import ResultsAvailableIcon from '@/assets/icons/buttons/Refresh.svg?react';
import CompleteIcon from '@/assets/icons/buttons/Checkmark/Circle Checkmark.svg?react';
import AlertIcon from '@/assets/icons/status/Alerts/Warning.svg?react';
import Button from '@/features/Common/components/Button/Button';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import { useNewResultsDisclaimerApproved } from '@/features/ResultList/hooks/resultListHooks';
import { ResultListLoadingData } from '@/features/ResultList/types/results';

interface ResultListLoadingButtonProps {
  data?: Partial<ResultListLoadingData>;
  currentPercentage: number;
}

const ResultListLoadingButton = ({ data = {}, currentPercentage }: ResultListLoadingButtonProps) => {

  const containerClassName = (data.containerClassName) ? data.containerClassName : '';
  const buttonClassName = (data.buttonClassName) ? data.buttonClassName : '';
  const resultsAvailable = data.hasFreshResults;
  const [isNewResultsDisclaimerApproved, setAndPersistNewResultsDisclaimerApproved] = useNewResultsDisclaimerApproved(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(!isNewResultsDisclaimerApproved);
  
  const handleCheckbox = (): void => setAndPersistNewResultsDisclaimerApproved(prev => !prev);

  return(
    <div 
      className={`${containerClassName} ${styles.loadingButtonContainer}`}
      >
      <div className={styles.left}>
        {
          data.isError
          ? 
            <div className={styles.complete}>
              <AlertIcon/>
              <span>Error</span>
            </div>
          : 
            <>
              {
                (!resultsAvailable && !data.isFetchingARAStatus && !data.isFetchingResults) &&
                <div className={styles.complete}>
                  <CompleteIcon/>
                  <span>All Results Shown</span>
                </div>
              }
              {
                (resultsAvailable) &&
                <span className={styles.resultsAvailable}>New Results Available</span>
              }
          </>
        }
        {
          (resultsAvailable || currentPercentage < 100) &&
          <span className={styles.loadPercentage}>{Math.round(currentPercentage)}% Loaded</span>
        }
      </div>
      <div className={styles.right}>
      <Tooltip 
        id="sync-new-results-button"
        isOpen={isTooltipOpen}
        >
        <span className={styles.tooltipInner}>
          <p className={styles.bold}>
            New Results Available
          </p>
          <p>
            We return the first available results as soon as we get them to cut down on loading times. Click this button to load new results.
          </p>
          <span className={styles.checkbox}>
            <input
              type="checkbox"
              id="checkbox-dont-show"
              onClick={handleCheckbox}
            />
            <label htmlFor="checkbox-dont-show">Don't show again</label>
          </span>
          <CloseIcon
            onClick={() => setIsTooltipOpen(false)}
            className={styles.close}
          />
        </span>
      </Tooltip>
      {
        (resultsAvailable) &&
        <>
          {
            data.showDisclaimer &&
            <p className={styles.refreshDisclaimer}>Syncing may update and reorder previously viewed results.</p>
          }
          <Button 
            handleClick={data.handleResultsRefresh} 
            className={`${buttonClassName} ${styles.loadingButton} ${styles.active}`}
            dataTooltipId="sync-new-results-button"
            >
            <ResultsAvailableIcon/>
            Sync New Results
          </Button>
        </>
      }
      {
        (!data.isError && !resultsAvailable && !data.isFetchingARAStatus && !data.isFetchingResults) &&
        <Button iconOnly handleClick={() => data.setIsActive?.(false)} isSecondary><CloseIcon/></Button>
      }
      </div>
    </div>
  )
}

export default ResultListLoadingButton; 