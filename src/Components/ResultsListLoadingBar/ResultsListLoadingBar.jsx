import styles from './ResultsListLoadingBar.module.scss';
import Info from '../../Icons/Alerts/Info.svg?react'
import { useInterval } from '../../Utilities/customHooks';
import { useEffect, useState } from 'react';
import ResultsListLoadingButton from '../ResultsListLoadingButton/ResultsListLoadingButton';
import Tooltip from '../Tooltip/Tooltip';

const ResultsListLoadingBar = ({ data, totalIntervals = 6 }) => {

  const [barColor, setBarColor] = useState(true);
  const [barWidthPercentage, setBarWidthPercentage] = useState(5);
  const currentInterval = data.currentInterval ? data.currentInterval : 1;

  useInterval(() => {
    if(barWidthPercentage < 100)
      setBarColor(prev=>!prev);
  }, 2000);

  useEffect(() => {

    if(currentInterval >= totalIntervals || data.status === "success") {
      if(!data.hasFreshResults && barWidthPercentage != 100) 
        setBarWidthPercentage(95);
      else 
        setBarWidthPercentage(100)
    } else {
      setBarWidthPercentage(((currentInterval / totalIntervals) * 100) - 5);
    } 

  }, [currentInterval, data, totalIntervals]);

  return(
    <>
      {/* <ResultsListLoadingButton data={data}/> */}
      <div 
        className={`${styles.resultsListLoadingBar}`}
        >
          <div className={styles.top}>
            <ResultsListLoadingButton data={data}/>
            <Info data-tooltip-id="results-loading-bar-tooltip"/>
            <Tooltip id="results-loading-bar-tooltip">
              {
                barWidthPercentage >= 100 
                ? 
                  data.hasFreshResults
                  ? <span>All results have been retrieved. Click <i>Load New Results</i> to incorporate them into the existing results.</span>
                  : <span>All results have been retrieved.</span>
                : <span>Additional results are currently being retrieved. {currentInterval} of {totalIntervals} reasoning agents have returned results.</span>
              }
            </Tooltip>
          </div>
          {/* <p className={styles.loadingText}>Loading New Results <Info/></p> */}
          <div className={styles.loadingBarContainer}>
            <div 
              className={`${barColor || barWidthPercentage >= 100 ? '' : styles.fade} ${styles.fill}`}
              style={{'width': `${barWidthPercentage}%`}}
              >
            </div>
          </div>
      </div>
    </>
  )
}

export default ResultsListLoadingBar;