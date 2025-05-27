import styles from './ResultsListLoadingButton.module.scss';
import { useState } from 'react';
import Tooltip from '../Tooltip/Tooltip';
import ResultsAvailableIcon from '../../Icons/Buttons/Refresh.svg?react';
import CompleteIcon from '../../Icons/Buttons/Checkmark/Circle Checkmark.svg?react';
import AlertIcon from '../../Icons/Status/Alerts/Warning.svg?react';
import Button from '../Core/Button';
import CloseIcon from "../../Icons/Buttons/Close/Close.svg?react";
import { useNewResultsDisclaimerApproved } from '../../Utilities/customHooks';

const ResultsListLoadingButton = ({ data = {}, currentPercentage }) => {

  const containerClassName = (data.containerClassName) ? data.containerClassName : '';
  const buttonClassName = (data.buttonClassName) ? data.buttonClassName : '';
  const resultsAvailable = data.hasFreshResults;
  const [isNewResultsDisclaimerApproved, setAndPersistNewResultsDisclaimerApproved] = useNewResultsDisclaimerApproved();
  const [isTooltipOpen, setIsTooltipOpen] = useState(!isNewResultsDisclaimerApproved);
  const handleCheckbox = () => {
    setAndPersistNewResultsDisclaimerApproved(prev=>!prev);
  }

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
            onClick={()=>setIsTooltipOpen(false)}
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
        <Button iconOnly handleClick={()=>data.setIsActive(false)} isSecondary><CloseIcon/></Button>
      }
      </div>
    </div>
  )
}

export default ResultsListLoadingButton;