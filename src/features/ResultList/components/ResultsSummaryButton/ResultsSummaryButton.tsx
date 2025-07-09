import { useEffect, useRef, useState, FC, useCallback } from "react";
import styles from './ResultsSummaryButton.module.scss';
import Button from "@/features/Common/components/Button/Button";
import SparkleIcon from '@/assets/icons/buttons/Sparkles.svg?react';
import InfoIcon from '@/assets/icons/status/Alerts/Info.svg?react';
import loadingIcon from '@/assets/images/loading/loading-purple.png';
import Tooltip from "@/features/Common/components/Tooltip/Tooltip";
import ResultsSummaryModal from "@/features/ResultList/components/ResultsSummaryModal/ResultsSummaryModal";
import { genTopNResultsContext } from "@/features/ResultList/utils/llm";
import { Result } from "@/features/ResultList/types/results.d";
import { ResultContextObject } from "@/features/ResultList/utils/llm";
import { useTextStream } from "@/features/Common/hooks/customHooks";
import { currentConfig } from "@/features/UserAuth/slices/userSlice";
import { getResultSetById } from "@/features/ResultList/slices/resultsSlice";
import { isEqual } from "lodash";
import { useSelector } from "react-redux";

interface ResultsSummaryButtonProps {
  results: Result[];
  queryString: string;
  handleResultMatchClick: (match: ResultContextObject) => void;
  pk: string;
}

const ResultsSummaryButton: FC<ResultsSummaryButtonProps> = ({ 
  handleResultMatchClick,
  queryString,
  pk,
  results }) => {

  const config = useSelector(currentConfig);
  const resultSet = useSelector(getResultSetById(pk));

  const isSummaryAvailable = useRef<boolean>(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);

  const resultContext = useRef<ResultContextObject[]>([]);
  const lastResults = useRef<Result[]>([]);

  const generateNewSummary = async () => {
    if(!resultSet)
      return;
    
    const newContext = genTopNResultsContext(resultSet, results, 50);
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

  if(!config?.include_summarization)
    return null;

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
        handleResultMatchClick={handleResultMatchSelection}
        isError={isError}
        isOpen={isSummaryModalOpen}
        isSummaryLoading={isStreaming}
        onClose={()=>setIsSummaryModalOpen(false)}
        pk={pk}
        resultContext={resultContext.current}
        streamedText={streamedText}
      />
    </>
  );
}

export default ResultsSummaryButton;