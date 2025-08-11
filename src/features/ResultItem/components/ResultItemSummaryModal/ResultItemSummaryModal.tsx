import { FC, ReactNode } from "react";
import LoadingWrapper from "@/features/Common/components/LoadingWrapper/LoadingWrapper";
import Modal from "@/features/Common/components/Modal/Modal";
import styles from "./ResultItemSummaryModal.module.scss";
import Button from "@/features/Core/components/Button/Button";
import LoadingIcon from "@/features/Common/components/LoadingIcon/LoadingIcon";

interface ResultItemSummaryModalProps {
  isOpen: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  isError: boolean;
  summary: ReactNode | null;
  onClose: () => void;
  onClearAndRefetchSummary: () => void;
}

const ResultItemSummaryModal: FC<ResultItemSummaryModalProps> = ({ 
  isOpen, 
  isLoading, 
  isStreaming,
  isError,
  summary,
  onClose,
  onClearAndRefetchSummary,
}) => {

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
    >
      <LoadingWrapper loading={isLoading && !isStreaming} size="medium" loadingText="Results may take up to a minute to generate.">
        <div>
          <div className={styles.content}>
            <div className={styles.header}>
              <h4 className={styles.title}>Result Summary</h4>
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