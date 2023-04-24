import React, {useRef, useEffect} from "react";
import styles from "./ShareModal.module.scss";
import Modal from "./Modal";
import { currentQuery} from "../../Redux/querySlice";
import { useSelector } from 'react-redux';

const ShareModal = ({isOpen, onClose, qid}) => {

  let storedQuery = useSelector(currentQuery);
  const sharedQueryLabel = new URLSearchParams(window.location.search).get("l")
  const sharedQueryType = new URLSearchParams(window.location.search).get("t")
  const queryLabel = (sharedQueryLabel) 
    ? sharedQueryLabel 
    : (storedQuery && storedQuery.node !== undefined) 
      ? encodeURIComponent(storedQuery.node.label) 
      : '';
  const queryTypeID = (sharedQueryType) 
    ? sharedQueryType 
    : (storedQuery && storedQuery.type !== undefined) 
      ? storedQuery.type.id 
      : '';

  const isResultsUrlSet = useRef(false);

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpen = startOpen;
  const qidPath = `/results?l=${queryLabel}&t=${queryTypeID}&q=${qid}`
  const qidURL = `${window.location.origin}${qidPath}`;
  
  useEffect(() => {
    if(window.location.pathname.includes("results") && !isResultsUrlSet.current && qidURL) {
      isResultsUrlSet.current = true;
      window.history.replaceState(null, "Results", qidPath);
    }
  }, [qidPath, qidURL]);

  return (
    <Modal 
      isOpen={modalIsOpen} 
      onClose={onClose} 
      className={styles.feedbackModal}
      containerClass={styles.feedbackContainer}
      >
      <h5>Share</h5>
      <p>Easily return to this result set without needing to ask this question again. This link is unique to your question and will return results for up to 30 days, after which your question will be run again.</p>
      <div className={styles.copyContainer}>
        <p className={styles.url}>{qidURL}</p>
        <button onClick={() => {navigator.clipboard.writeText(qidURL)}}>Copy Link</button>
      </div>
    </Modal>
  );
}


export default ShareModal;

