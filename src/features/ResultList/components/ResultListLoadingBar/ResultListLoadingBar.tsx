import styles from './ResultListLoadingBar.module.scss';
import { useEffect, useState, useRef, FC, useMemo, useCallback } from 'react';
import { useInterval } from '@/features/Common/hooks/customHooks';
import ResultListLoadingButton from '@/features/ResultList/components/ResultListLoadingButton/ResultListLoadingButton';
import { ResultListLoadingData } from '@/features/ResultList/types/results';

interface ResultListLoadingBarProps {
  data: ResultListLoadingData;
  totalIntervals?: number;
}

const INITIAL_BAR_WIDTH = 5;
const COMPLETION_BAR_WIDTH = 100;
const NEAR_COMPLETION_BAR_WIDTH = 95;
const BAR_COLOR_INTERVAL = 2000;

const ResultListLoadingBar: FC<ResultListLoadingBarProps> = ({ 
  data, 
  totalIntervals = 6 
}) => {
  const [barColor, setBarColor] = useState<boolean>(true);
  const [barWidthPercentage, setBarWidthPercentage] = useState<number>(INITIAL_BAR_WIDTH);
  const isFirstLoad = useRef<boolean>(true);

  const currentInterval = data.currentInterval ?? 1;
  const isComplete = useMemo(() => {
    return currentInterval >= totalIntervals || 
           data.status === "success" || 
           (!data.hasFreshResults && !data.isFetchingARAStatus && !data.isFetchingResults);
  }, [currentInterval, totalIntervals, data.status, data.hasFreshResults, data.isFetchingARAStatus, data.isFetchingResults]);

  const isError = useMemo(() => data.isError, [data.isError]);

  const shouldRunInterval = useMemo(() => {
    return barWidthPercentage < COMPLETION_BAR_WIDTH && !isError;
  }, [barWidthPercentage, isError]);

  const toggleBarColor = useCallback(() => {
    setBarColor(prev => !prev);
  }, []);

  useInterval(toggleBarColor, shouldRunInterval ? BAR_COLOR_INTERVAL : null);

  useEffect(() => {
    if (isError) {
      setBarWidthPercentage(COMPLETION_BAR_WIDTH);
      return;
    }

    if (isComplete) {
      if (isFirstLoad.current) {
        // Results complete on initial load
        setBarWidthPercentage(COMPLETION_BAR_WIDTH);
      } else if (data.isFetchingARAStatus == null && barWidthPercentage !== COMPLETION_BAR_WIDTH) {
        // Error returned after some results have returned
        setBarWidthPercentage(COMPLETION_BAR_WIDTH);
      } else if (!data.hasFreshResults && barWidthPercentage !== COMPLETION_BAR_WIDTH) {
        // Results complete not on initial load, new results incoming
        setBarWidthPercentage(NEAR_COMPLETION_BAR_WIDTH);
      } else {
        // Results complete without fresh results or after new results have been loaded
        setBarWidthPercentage(COMPLETION_BAR_WIDTH);
      }
    } else {
      // Results in progress, update to match current interval
      const progressPercentage = ((currentInterval / totalIntervals) * 100) - INITIAL_BAR_WIDTH;
      setBarWidthPercentage(Math.max(INITIAL_BAR_WIDTH, progressPercentage));
    }

    if (isFirstLoad.current) {
      isFirstLoad.current = false;
    }
  }, [currentInterval, isComplete, isError, data.isFetchingARAStatus, data.hasFreshResults, barWidthPercentage, totalIntervals]);

  const barFillClass = useMemo(() => {
    const baseClass = styles.fill;
    const fadeClass = (!barColor && barWidthPercentage < COMPLETION_BAR_WIDTH) ? styles.fade : '';
    return `${baseClass} ${fadeClass}`.trim();
  }, [barColor, barWidthPercentage]);

  return (
    <div className={styles.ResultListLoadingBar}>
      <div className={styles.top}>
        <ResultListLoadingButton 
          data={data} 
          currentPercentage={barWidthPercentage}
        />
      </div>
      <div className={styles.loadingBarContainer}>
        <div 
          className={barFillClass}
          style={{ width: `${barWidthPercentage}%` }}
        />
      </div>
    </div>
  );
};

export default ResultListLoadingBar; 