import LoadingWrapper from "@/features/Common/components/LoadingWrapper/LoadingWrapper";
import Modal from "@/features/Common/components/Modal/Modal";
import { FC } from "react";
import styles from "./ResultItemSummaryModal.module.scss";

interface ResultItemSummaryModalProps {
  isOpen: boolean;
  isLoading: boolean;
  isError: boolean;
  summary: string | null;
  onClose: () => void;
}

const ResultItemSummaryModal: FC<ResultItemSummaryModalProps> = ({ 
  isOpen, 
  isLoading, 
  isError,
  summary,
  onClose,
}) => {

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
    >
      <LoadingWrapper loading={isLoading && !isError} size="medium">
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
                <div className={styles.summary}>
                  {summary}
                </div>
          }
        </div>
      </LoadingWrapper>
    </Modal>
  );
};

export default ResultItemSummaryModal;