import { useRef, useState, FC } from "react";
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
import { useQuery } from "react-query";
import { handleFetchErrors } from "../../Utilities/utilities";

interface ResultsSummaryButtonProps {
  results: ResultItem[];
  queryString: string;
}

const ResultsSummaryButton: FC<ResultsSummaryButtonProps> = ({ results, queryString }) => {

  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [isSummaryAvailable, setIsSummaryAvailable] = useState<boolean>(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);

  const resultContext = useRef<ResultContextObject[]>([]);

  const handleSummaryButtonClick = () => {
    setIsSummaryModalOpen(true);
    if (isSummaryAvailable) {
      // display summary
      return;
    } 

    if(!isSummaryLoading) {
      // initiate summary generation
      const newContext = genTopNResultsContext(results, 50);
      resultContext.current = newContext;
      setIsSummaryLoading(true);
    }
  };

  const resultsData = useQuery('resultsSummarization', async () => {
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
    // eslint-disable-next-line
    const response = await fetch(`https://ncats-llm-summarization.onrender.com/summary`, requestOptions)
      .then(response => handleFetchErrors(response, () => {
        console.log(response.json());
        //   handleResultsError(true, setIsError, setIsLoading);
      }))
      .then(response => response.json())
      .then(data => {
        console.log('Summarization:', data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, {
    enabled: isSummaryLoading,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

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
        isOpen={isSummaryModalOpen}
        isSummaryLoading={isSummaryLoading}
        isSummaryAvailable={isSummaryAvailable}
        onClose={()=>setIsSummaryModalOpen(false)}
      />
    </>

  );
}

export default ResultsSummaryButton;