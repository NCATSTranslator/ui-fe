import { useEffect, useRef, useState, FC, useCallback } from "react";
import styles from './ResultsSummaryButton.module.scss';
import Button from "../Core/Button";
import SparkleIcon from '../../Icons/Buttons/Sparkles.svg?react';
import InfoIcon from '../../Icons/Status/Alerts/Info.svg?react';
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import Tooltip from "../Tooltip/Tooltip";
import ResultsSummaryModal from "../Modals/ResultsSummaryModal";
import { genTopNResultsContext } from "../../Utilities/llm";
import { ResultItem } from "../../Types/results";
import { ResultContextObject } from "../../Utilities/llm";
import { useTextStream } from "../../Utilities/customHooks";
import { isEqual } from "lodash";

interface ResultsSummaryButtonProps {
  results: ResultItem[];
  queryString: string;
  handleResultMatchClick: Function;
}

const ResultsSummaryButton: FC<ResultsSummaryButtonProps> = ({ results, queryString, handleResultMatchClick }) => {

  const isSummaryAvailable = useRef<boolean>(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);

  const resultContext = useRef<ResultContextObject[]>([]);
  const lastResults = useRef<ResultItem[]>([]);

  const generateNewSummary = async () => {
    const newContext = genTopNResultsContext(results, 50);
    resultContext.current = newContext;
    startStream();
  }

  const handleSummaryButtonClick = async (summaryAvailable: boolean) => {
    setIsSummaryModalOpen(true);
    // display summary if available
    if (summaryAvailable) 
      return;

    // initiate summary generation
    if(!isStreaming) {
      await generateNewSummary();
    }
  }

  const handleStreamedDataCompletion = () => {
    isSummaryAvailable.current = true;
    console.log("summary generation complete");
  }

  const handleStreamedDataCancellation = () => {
    isSummaryAvailable.current = false;
  }

  const {
    streamedText,
    isStreaming,
    isError,
    startStream,
    cancelStream
  } = useTextStream('https://ncats-llm-summarization.onrender.com/summary', queryString , resultContext, handleStreamedDataCompletion, handleStreamedDataCancellation);

  const handleResultMatchSelection = useCallback((match: ResultContextObject) => {
    setIsSummaryModalOpen(false);
    handleResultMatchClick(match);
  }, [handleResultMatchClick]);

  const resetSummary = useCallback(() => {
    isSummaryAvailable.current = false;
    cancelStream();
  }, [cancelStream]);
  
  useEffect(() => {
    if(isEqual(results, lastResults.current))
      return;

    if(lastResults.current.length > 0) 
      resetSummary();

    lastResults.current = results;
  }, [results, resetSummary, isStreaming]);

  return(
    <>
      <Button
        className={styles.summaryButton}
        isSecondary
        handleClick={()=>handleSummaryButtonClick(isSummaryAvailable.current)}
        smallFont
        >
        {
          !!isStreaming
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
      <ResultsSummaryModal
        streamedText={streamedText}
        resultContext={resultContext.current}
        isOpen={isSummaryModalOpen}
        isSummaryLoading={isStreaming}
        onClose={()=>setIsSummaryModalOpen(false)}
        handleResultMatchClick={handleResultMatchSelection}
        isError={isError}
      />
    </>
  );
}

export default ResultsSummaryButton;