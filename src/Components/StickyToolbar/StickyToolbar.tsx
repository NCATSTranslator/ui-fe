import { FC, useState } from "react";
import styles from './StickyToolbar.module.scss';
import ResultsListLoadingBar from "../ResultsListLoadingBar/ResultsListLoadingBar";

interface StickyToolbarProps {
  loadingButtonData: {
    handleResultsRefresh: () => void;
    isFetchingARAStatus: boolean | null;
    isFetchingResults: boolean | null;
    showDisclaimer: boolean;
    containerClassName: string;
    buttonClassName: string;
    hasFreshResults: boolean;
  }
  isError: boolean;
  returnedARAs: { aras: string[]; status: string; };
}

const StickyToolbar: FC<StickyToolbarProps> = ({ loadingButtonData, isError, returnedARAs }) => {

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
              isError: isError,
              setIsActive: setIsActive
            }}
          />
        }
      </div>
    </div>
  );
}

export default StickyToolbar;