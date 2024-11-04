import { useState } from "react";
import styles from './ResultsSummaryButton.module.scss';
import Button from "../Core/Button";
import SparkleIcon from '../../Icons/Buttons/Sparkles.svg?react';
import InfoIcon from '../../Icons/Status/Alerts/Info.svg?react';
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import Tooltip from "../Tooltip/Tooltip";

const ResultsSummaryButton = () => {

  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [isSummaryAvailable, setIsSummaryAvailable] = useState<boolean>(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);

  const handleSummaryButtonClick = () => {
    if (isSummaryAvailable) {
      // display summary
      return;
    } 

    if(!isSummaryLoading) {
      setIsSummaryLoading(true);
      // initiate summary generation
    }
  };

  return(
      <Button
      className={styles.summaryButton}
      isSecondary
      handleClick={handleSummaryButtonClick}
      smallFont
    >
      {
        !!isSummaryLoading
        ?                  
          <img
            src={loadingIcon}
            className={`${styles.summaryLoadingIcon} loadingIcon`}
            alt="loading icon"
          />
        : 
          <SparkleIcon className={styles.summaryLoadingIcon} />
      }
      <span>View Results Summary</span>
      <InfoIcon className={styles.infoIcon} data-tooltip-id="result-summary-tooltip" />
      <Tooltip id="result-summary-tooltip">
        <span>This AI-generated summary reviews the data returned by Translator and identifies interesting results, ChEBI roles, and objects found in paths. <br/><br/> This summary is not intended to be a replacement for medical advice.</span>
      </Tooltip>
    </Button>
  );
}

export default ResultsSummaryButton;