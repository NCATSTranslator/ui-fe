import { useState } from "react";
import styles from './StickyToolbar.module.scss';
import ResultsListLoadingBar from "../ResultsListLoadingBar/ResultsListLoadingBar";

const StickyToolbar = ({ loadingButtonData, isError, returnedARAs }) => {

  const [isActive, setIsActive] = useState(true);
  const activeClassName = isActive ? styles.active : styles.inactive;

  return(
    <div className={`${styles.sticky} ${activeClassName}`}>
      <div className={styles.container}>
        {
          !!returnedARAs?.aras &&
          <ResultsListLoadingBar
            data={{
              handleResultsRefresh: loadingButtonData.handleResultsRefresh,
              isFetchingARAStatus: loadingButtonData.isFetchingARAStatus,
              isFetchingResults: loadingButtonData.isFetchingResults,
              showDisclaimer: loadingButtonData.showDisclaimer,
              containerClassName: loadingButtonData.containerClassName,
              buttonClassName: loadingButtonData.buttonClassName,
              hasFreshResults: loadingButtonData.hasFreshResults,
              currentInterval: returnedARAs.aras.length,
              status: returnedARAs.status, 
              isError: isError
            }}
          />
        }
      </div>
    </div>
  );
}

export default StickyToolbar;