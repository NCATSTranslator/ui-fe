import styles from './ResultListLoadingButton.module.scss';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import ResultsAvailableIcon from '@/assets/icons/buttons/Refresh.svg?react';
import Button from '@/features/Core/components/Button/Button';
// import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import { useNewResultsDisclaimerApproved } from '@/features/ResultList/hooks/resultListHooks';

interface ResultListLoadingButtonProps {
  hasFreshResults: boolean;
  showDisclaimer: boolean;
  handleResultsRefresh: () => void;
}

const ResultListLoadingButton = ({
  hasFreshResults,
  showDisclaimer,
  handleResultsRefresh,
}: ResultListLoadingButtonProps) => {

  const [isNewResultsDisclaimerApproved, setAndPersistNewResultsDisclaimerApproved] = useNewResultsDisclaimerApproved(false);
  // const [isTooltipOpen, setIsTooltipOpen] = useState(!isNewResultsDisclaimerApproved);
  
  const handleCheckbox = (): void => setAndPersistNewResultsDisclaimerApproved(prev => !prev);

  const resultsAvailable = hasFreshResults;
  // const resultsComplete = !resultsAvailable && !isFetchingARAStatus && !isFetchingResults;

  return(
    <>
      {
        resultsAvailable && (
          <div 
            className={`${styles.loadingButtonContainer}`}
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
                  iconLeft={<ResultsAvailableIcon/>}
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