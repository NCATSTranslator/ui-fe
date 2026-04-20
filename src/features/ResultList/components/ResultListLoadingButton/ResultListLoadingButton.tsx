import styles from './ResultListLoadingButton.module.scss';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import ResultsAvailableIcon from '@/assets/icons/buttons/Refresh.svg?react';
import Button from '@/features/Core/components/Button/Button';
import { useNewResultsDisclaimerApproved } from '@/features/ResultList/hooks/resultListHooks';
import { joinClasses } from '@/features/Common/utils/utilities';

interface ResultListLoadingButtonProps {
  className?: string;
  hasFreshResults: boolean;
  showDisclaimer: boolean;
  showIcon?: boolean;
  handleResultsRefresh: () => void;
}

const ResultListLoadingButton = ({
  className,
  hasFreshResults,
  showDisclaimer,
  showIcon = true,
  handleResultsRefresh,
}: ResultListLoadingButtonProps) => {

  const [, setAndPersistNewResultsDisclaimerApproved] = useNewResultsDisclaimerApproved(false);
  
  const handleCheckbox = (): void => setAndPersistNewResultsDisclaimerApproved(prev => !prev);

  const resultsAvailable = hasFreshResults;

  return(
    <>
      {
        resultsAvailable && (
          <div 
            className={joinClasses(`${styles.loadingButtonContainer}`, className)}
            >
            <Tooltip 
              id="sync-new-results-button"
              // isOpen={isTooltipOpen}
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
                {/* <CloseIcon
                  onClick={() => setIsTooltipOpen(false)}
                  className={styles.close}
                /> */}
              </span>
            </Tooltip>
            {
              (resultsAvailable) &&
              <>
                <Button
                  handleClick={handleResultsRefresh}
                  className={`${styles.loadingButton} ${resultsAvailable && styles.active}`}
                  dataTooltipId="sync-new-results-button"
                  iconLeft={showIcon ? <ResultsAvailableIcon/> : null}
                  >
                  Sync New Results
                </Button>
                {
                  (showDisclaimer) &&
                  <p className={`${styles.refreshDisclaimer} ${resultsAvailable && styles.active}`}>Syncing may reorder results and update paths and evidence in previously viewed results.</p>
                }
              </>
            }
          </div>
        )
      }
    </>
  )
}

export default ResultListLoadingButton; 