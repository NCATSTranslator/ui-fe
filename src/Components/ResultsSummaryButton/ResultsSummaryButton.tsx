import { useRef, useState, FC, useCallback } from "react";
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

interface ResultsSummaryButtonProps {
  results: ResultItem[];
  queryString: string;
  handleResultMatchClick: Function;
}

const ResultsSummaryButton: FC<ResultsSummaryButtonProps> = ({ results, queryString, handleResultMatchClick }) => {

  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [isSummaryAvailable, setIsSummaryAvailable] = useState<boolean>(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);

  const resultContext = useRef<ResultContextObject[]>([]);

  const handleSummaryButtonClick = async () => {
    setIsSummaryModalOpen(true);
    // display summary if available
    if (isSummaryAvailable) 
      return;

    // initiate summary generation
    if(!isSummaryLoading) {
      const newContext = genTopNResultsContext(results, 50);
      resultContext.current = newContext;
      setIsSummaryLoading(true);
      await refetch();
    }
  };

  const fetchTextStream = async () => {
    console.log("Fetching new summary...");
    let requestJson = JSON.stringify({
      query: queryString,
      results: resultContext.current
    });

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestJson
    };
    const response = await fetch('https://ncats-llm-summarization.onrender.com/summary', requestOptions);
    if(!response.body) 
      return null;
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let result = '';
  
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      let chunk = decoder.decode(value, { stream: true })
      result += chunk;
      setStreamedText((prev) => prev + chunk);
    }
  
    return result;
  }

  const handleStreamedDataCompletion = () => {
    setIsSummaryLoading(false);
    setIsSummaryAvailable(true);
  }

  const [streamedText, setStreamedText] = useState<string>('');
  const { refetch } = useTextStream(fetchTextStream, handleStreamedDataCompletion);

  const handleResultMatchSelection = useCallback((match: ResultContextObject) => {
    setIsSummaryModalOpen(false);
    handleResultMatchClick(match);
  }, [handleResultMatchClick]);

  return(
    <>
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
      <ResultsSummaryModal
        streamedText={streamedText}
        resultContext={resultContext.current}
        isOpen={isSummaryModalOpen}
        isSummaryLoading={isSummaryLoading}
        onClose={()=>setIsSummaryModalOpen(false)}
        handleResultMatchClick={handleResultMatchSelection}
      />
    </>

  );
}

export default ResultsSummaryButton;