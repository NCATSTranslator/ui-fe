import { useEffect, useState } from "react";
import ResultsListLoadingButton from "../ResultsListLoadingButton/ResultsListLoadingButton";
import styles from './StickyToolbar.module.scss';
import ShareIcon from '../../Icons/share.svg?react';
import Subtract from '../../Icons/Buttons/Subtract.svg?react';
import Add from '../../Icons/Buttons/Add.svg?react';

const StickyToolbar = ({ loadingButtonData, setShareModalFunction }) => {

  const resultsCompleteCollapseTime = 4000;
  const containedDivsRevealTime = 250;
  const [isExpanded, setIsExpanded] = useState(true);
  const expandedClassName = isExpanded ? styles.expanded : styles.collapsed;
  const [containedDivsClass, setContainedDivsClass] = useState(styles.showText);

  useEffect(() => {
    if(isExpanded) {
      const collapseTimeout = setTimeout(() => {
        setContainedDivsClass(styles.showText);
      }, containedDivsRevealTime);
      return () => clearTimeout(collapseTimeout);
    } else {
      setContainedDivsClass(styles.hideText);
    }
  }, [isExpanded]);

  useEffect(() => {
    if(!loadingButtonData.hasFreshResults &&
       !loadingButtonData.isFetchingARAStatus &&
       !loadingButtonData.isFetchingResults) {
      const collapseTimeout = setTimeout(() => {
        setIsExpanded(false);
      }, resultsCompleteCollapseTime);
      return () => clearTimeout(collapseTimeout);
    }
  }, [loadingButtonData.hasFreshResults, loadingButtonData.isFetchingARAStatus, loadingButtonData.isFetchingResults]);

  return(
    <div className={`${styles.sticky} ${expandedClassName} ${containedDivsClass}`}>
      <button 
        className={styles.expandButton}
        onClick={()=>{setIsExpanded(prev=>!prev)}} 
        >
        {isExpanded ? <Subtract/> : <Add/>}
      </button>
      <div className={styles.container}>
        <ResultsListLoadingButton
          data={loadingButtonData}
        />
        <button
          className={styles.shareButton}
          onClick={()=>{setShareModalFunction(true)}}
          >
            <ShareIcon/>
        </button>
      </div>
    </div>
  );
}

export default StickyToolbar;