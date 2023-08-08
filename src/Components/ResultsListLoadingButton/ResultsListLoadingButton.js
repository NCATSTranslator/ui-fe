import { useState } from 'react';
import styles from './ResultsListLoadingButton.module.scss';
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import {ReactComponent as ResultsAvailableIcon} from '../../Icons/Alerts/Checkmark.svg';
import {ReactComponent as CompleteIcon} from '../../Icons/Alerts/Checkmark.svg';
import {ReactComponent as Subtract} from '../../Icons/Buttons/Subtract.svg';
import {ReactComponent as Add} from '../../Icons/Buttons/Add.svg';

const ResultsListLoadingButton = ({ data = {} }) => {

  const containerClassName = (data.containerClassName) ? data.containerClassName : '';
  const buttonClassName = (data.buttonClassName) ? data.buttonClassName : '';
  const isSticky = (data.isSticky !== undefined) ? data.isSticky : false;
  const stickyClassName = isSticky ? styles.sticky : '';

  const [isExpanded, setIsExpanded] = useState(true);
  const expandedClassName = isExpanded ? styles.expanded : styles.collapsed;
  
  return(
    <div 
      className={`${containerClassName} ${styles.loadingButtonContainer} ${stickyClassName} ${expandedClassName}`}
      >
      {
        isSticky &&
        <button 
          className={styles.expandButton}
          onClick={()=>{setIsExpanded(prev=>!prev)}} 
          >
          {isExpanded ? <Subtract/> : <Add/>}
        </button>
      }
      {
        (!data.isFetchingARAStatus && !data.isFetchingResults) &&
        <div className={styles.complete}>
          <CompleteIcon/>
          <span>Results Complete</span>
        </div>
      }
      {
        (!data.hasFreshResults && (data.isFetchingARAStatus || data.isFetchingResults)) &&
        <button className={`${buttonClassName} ${styles.loadingButton} ${styles.inactive}`}>
          <img src={loadingIcon} className={styles.loadingButtonIcon} alt="results button loading icon"/>
          <span>Calculating</span>
        </button>
      }
      {
        (data.hasFreshResults && (data.isFetchingARAStatus || data.isFetchingResults)) &&
        <>
          <button onClick={data.handleResultsRefresh} className={`${buttonClassName} ${styles.loadingButton} ${styles.active}`}>
            {
              (data.isFetchingARAStatus) &&
              <img src={loadingIcon} className={styles.loadingButtonIcon} alt="results button loading icon"/>
            }
            {
              !data.isFetchingARAStatus &&
              <ResultsAvailableIcon/>
            }
            <span>Load New Results</span>
          </button>
          {
            data.showDisclaimer &&
            <p className={styles.refreshDisclaimer}>Please note that refreshing this page may cause the order of answers to change.<br/>Results you have already viewed may also be updated with new data.</p>
          }
        </>
      }
    </div>
  )
}

export default ResultsListLoadingButton;