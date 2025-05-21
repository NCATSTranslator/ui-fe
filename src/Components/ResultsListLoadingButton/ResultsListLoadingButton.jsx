import styles from './ResultsListLoadingButton.module.scss';
import ResultsAvailableIcon from '../../Icons/Buttons/Refresh.svg?react';
import CompleteIcon from '../../Icons/Buttons/Checkmark/Circle Checkmark.svg?react';
import AlertIcon from '../../Icons/Status/Alerts/Warning.svg?react';
import Button from '../Core/Button';
import CloseIcon from "../../Icons/Buttons/Close/Close.svg?react";

const ResultsListLoadingButton = ({ data = {}, currentPercentage }) => {

  const containerClassName = (data.containerClassName) ? data.containerClassName : '';
  const buttonClassName = (data.buttonClassName) ? data.buttonClassName : '';

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
                (!data.hasFreshResults && !data.isFetchingARAStatus && !data.isFetchingResults) &&
                <div className={styles.complete}>
                  <CompleteIcon/>
                  <span>All Results Shown</span>
                </div>
              }
              {
                (data.hasFreshResults) &&
                <span className={styles.resultsAvailable}>New Results Available</span>
              }
          </>
        }
        {
          (data.hasFreshResults || currentPercentage < 100) &&
          <span className={styles.loadPercentage}>{Math.round(currentPercentage)}% Loaded</span>
        }
      </div>
      <div className={styles.right}>
      {
        (data.hasFreshResults) &&
        <>
          {
            data.showDisclaimer &&
            <p className={styles.refreshDisclaimer}>Syncing may update and reorder previously viewed results.</p>
          }
          <Button handleClick={data.handleResultsRefresh} className={`${buttonClassName} ${styles.loadingButton} ${styles.active}`}>
            {
              (data.isFetchingARAStatus || data.isFetchingResults) &&
              <ResultsAvailableIcon/>
            }
            {
              !(data.isFetchingARAStatus || data.isFetchingResults) &&
              <ResultsAvailableIcon/>
            }
            Sync New Results
          </Button>
        </>
      }
      {
        (!data.isError && !data.hasFreshResults && !data.isFetchingARAStatus && !data.isFetchingResults) &&
        <Button iconOnly handleClick={()=>data.setIsActive(false)} isSecondary><CloseIcon/></Button>
      }
      </div>
    </div>
  )
}

export default ResultsListLoadingButton;