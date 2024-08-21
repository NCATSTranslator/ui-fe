import styles from './ResultsListLoadingBar.module.scss';
import { useEffect, useState, useRef } from 'react';
import Info from '../../Icons/Status/Alerts/Info.svg?react'
import { useInterval } from '../../Utilities/customHooks';
import ResultsListLoadingButton from '../ResultsListLoadingButton/ResultsListLoadingButton';
import Tooltip from '../Tooltip/Tooltip';

const ResultsListLoadingBar = ({ data, totalIntervals = 6 }) => {

  const [barColor, setBarColor] = useState(true);
  const [barWidthPercentage, setBarWidthPercentage] = useState(5);
  const currentInterval = data.currentInterval ? data.currentInterval : 1;
  const isFirstLoad = useRef(true);

  useInterval(() => {
    if(barWidthPercentage < 100)
      setBarColor(prev=>!prev);
  }, 2000);

  useEffect(() => {
    if(data.isError) {
      setBarWidthPercentage(100);
      return;
    }

    if(currentInterval >= totalIntervals || data.status === "success" || (!data.hasFreshResults && !data.isFetchingARAStatus && !data.isFetchingResults) ) {
      // results complete on initial load
      if(isFirstLoad.current) 
        setBarWidthPercentage(100);
      // error returned after some results have returned
      else if(data.isFetchingARAStatus == null && barWidthPercentage !== 100)
        setBarWidthPercentage(100);
      // results complete not on initial load, new results incoming, 
      else if(!data.hasFreshResults && barWidthPercentage !== 100) 
        setBarWidthPercentage(95);
      // results complete without fresh results or after new results have been loaded from results endpoint, 
      // load new results button may still need to be pressed
      else 
        setBarWidthPercentage(100)
      // results in progress, update to match current interval
    } else {
      setBarWidthPercentage(((currentInterval / totalIntervals) * 100) - 5);
    } 

    if(isFirstLoad.current)
      isFirstLoad.current = false;
  // eslint-disable-next-line
  }, [currentInterval, data, totalIntervals]);

  return(
    <>
      <div 
        className={`${styles.resultsListLoadingBar}`}
        >
          <div className={styles.top}>
            <ResultsListLoadingButton data={data} currentPercentage={barWidthPercentage}/>
          </div>
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