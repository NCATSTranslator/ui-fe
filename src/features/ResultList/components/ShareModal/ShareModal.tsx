import { useEffect, useState, FC } from "react";
import styles from "./ShareModal.module.scss";
import Modal from "@/features/Common/components/Modal/Modal";
import Button from "@/features/Core/components/Button/Button";
import { getPathfinderResultsShareURLPath, getResultsShareURLPath } from "@/features/ResultList/utils/resultsInteractionFunctions";
import { getDataFromQueryVar } from "@/features/Common/utils/utilities";
import { AutocompleteItem } from "@/features/Query/types/querySubmission";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void; 
  qid: string;
  label?: string | null; 
  nodeID?: string | null; 
  typeID?: string | null; 
  shareResultID?: string;
}

const ShareModal: FC<ShareModalProps> = ({isOpen, onClose, qid, label = null, nodeID = null, typeID = null, shareResultID = null}) => {
  const sharedQueryLabel = (label) ? label : getDataFromQueryVar("l");
  const sharedQueryType = (typeID) ? typeID : getDataFromQueryVar("t");
  const sharedQueryItemID = (nodeID) ? nodeID : getDataFromQueryVar("i");
  const initSharedQueryResultID = (shareResultID != null) ? shareResultID : getDataFromQueryVar("r");
  const [sharedQueryResultID, setSharedQueryResultID] = useState(initSharedQueryResultID);

  useEffect(() => {
    setSharedQueryResultID(shareResultID)
  }, [shareResultID]);

  const queryLabel = (sharedQueryLabel) 
    ? sharedQueryLabel 
    : '';
  const queryItemID = (sharedQueryItemID) 
    ? sharedQueryItemID 
    : '';
  const queryTypeID = (sharedQueryType) 
    ? sharedQueryType 
    : '';
  const queryResultID = sharedQueryResultID || '0';

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpen = startOpen;
  const isPathfinder = sharedQueryType === 'p';
  let qidPath = null;  
  if(isPathfinder) {
    const itemOne: AutocompleteItem = {
      id: getDataFromQueryVar('ione') || "",
      label: getDataFromQueryVar('lone') || ""
    }
    const itemTwo = {
      id: getDataFromQueryVar('itwo') || "",
      label: getDataFromQueryVar('ltwo') || ""
    }
    const constraint = getDataFromQueryVar('c') || "";
    qidPath = getPathfinderResultsShareURLPath(itemOne, itemTwo, queryResultID, constraint, qid);
  } else {
    qidPath = getResultsShareURLPath(queryLabel, queryItemID, queryTypeID, queryResultID, qid);
  }
  const qidURL = encodeURI(`${window.location.origin}/${qidPath}`);

  return (
    <Modal 
      isOpen={modalIsOpen} 
      onClose={onClose} 
      className={styles.feedbackModal}
      containerClass={styles.feedbackContainer}
      >
      {
        shareResultID != null
        ?
          <>
            <h5>Share this result</h5>
            <p className="italic">This link will return you to this result set with an option to automatically open this result.</p>
            <p>It is unique to your question and will return results for up to 30 days, after which time your question will need to be run again.</p>
          </>
        :
          <>
            <h5>Share</h5>
            <p>Easily return to this result set without needing to ask this question again.</p>
            <p>This link is unique to your question and will return results for up to 30 days, after which time your question will need to be run again.</p>
          </>
      }
      <div className={styles.copyContainer}>
        <p className={styles.url} data-testid='share-url-container'>{qidURL}</p>
        <Button handleClick={() => {navigator.clipboard.writeText(qidURL)}}>Copy Link</Button>
      </div>
    </Modal>
  );
}


export default ShareModal;

