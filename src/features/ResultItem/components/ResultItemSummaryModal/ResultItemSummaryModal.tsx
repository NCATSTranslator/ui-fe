import { FC, ReactNode } from "react";
import LoadingWrapper from "@/features/Core/components/LoadingWrapper/LoadingWrapper";
import Modal from "@/features/Common/components/Modal/Modal";
import styles from "./ResultItemSummaryModal.module.scss";
import Button from "@/features/Core/components/Button/Button";
import LoadingIcon from "@/features/Core/components/LoadingIcon/LoadingIcon";
import { Result } from "@/features/ResultList/types/results";

interface ResultItemSummaryModalProps {
  isOpen: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  isError: boolean;
  summary: ReactNode | null;
  onClose: () => void;
  onClearAndRefetchSummary: () => void;
  result: Result;
}

const ResultItemSummaryModal: FC<ResultItemSummaryModalProps> = ({ 
  isOpen, 
  isLoading, 
  isStreaming,
  isError,
  summary,
  onClose,
  onClearAndRefetchSummary,
  result,
}) => {

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
    >
      <LoadingWrapper loading={isLoading && !isStreaming} size="medium">
        <div>
          <div className={styles.content}>
            <div className={styles.header}>
              <h4 className={styles.title}>Result Summary for <span className={styles.resultName}>{result.drug_name}</span></h4>
            </div>
            {
              isError
                ?
                  <div className={styles.error}>
                    <p>Error fetching summary</p>
                  </div>
                :
                <>
                  <div 
                    className={styles.summary}
                    dangerouslySetInnerHTML={{ __html: summary as string }}
                  />
                  {isStreaming && <LoadingIcon size="small" className={styles.streamingIcon} />}
                </>
            }
          </div>
          <Button 
            handleClick={onClearAndRefetchSummary}
            variant="secondary"
            small
            className={styles.clearButton}
            disabled={isStreaming}
          >
            Clear and Refetch
          </Button>
        </div>
      </LoadingWrapper>
    </Modal>
  );
};

export default ResultItemSummaryModal;