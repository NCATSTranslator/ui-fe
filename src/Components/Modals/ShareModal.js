import React, {useRef, useEffect} from "react";
import styles from "./ShareModal.module.scss";
import Modal from "./Modal";
import { currentRoot } from "../../Redux/rootSlice";
import { currentQuery} from "../../Redux/querySlice";
import { useSelector } from 'react-redux';
import { getResultsShareURLPath } from "../../Utilities/resultsInteractionFunctions";

const ShareModal = ({isOpen, onClose, qid, label = null, typeID = null}) => {

  let storedQuery = useSelector(currentQuery);
  const root = useSelector(currentRoot);
  const sharedQueryLabel = (label) ? label : new URLSearchParams(window.location.search).get("l")
  const sharedQueryType = (typeID) ? typeID : new URLSearchParams(window.location.search).get("t")
  const sharedQueryItemID = new URLSearchParams(window.location.search).get("i")
  const queryLabel = (sharedQueryLabel) 
    ? sharedQueryLabel 
    : (storedQuery && storedQuery.node !== undefined) 
      ? encodeURIComponent(storedQuery.node.label) 
      : '';
  const queryItemID = (sharedQueryItemID) 
    ? sharedQueryItemID 
    : (storedQuery && storedQuery.node !== undefined) 
      ? encodeURIComponent(storedQuery.node.id) 
      : '';
  const queryTypeID = (sharedQueryType) 
    ? sharedQueryType 
    : (storedQuery && storedQuery.type !== undefined) 
      ? storedQuery.type.id 
      : '';

  const isResultsUrlSet = useRef(false);

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpen = startOpen;
  const qidPath = getResultsShareURLPath(queryLabel, queryItemID, queryTypeID, qid);
  const qidURL = encodeURI(`${window.location.origin}/${root}/${qidPath}`);
  
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
      <p>Easily return to this result set without needing to ask this question again. This link is unique to your question and will return results for up to 30 days, after which time your question will need to be run again.</p>
      <div className={styles.copyContainer}>
        <p className={styles.url}>{qidURL}</p>
        <button onClick={() => {navigator.clipboard.writeText(qidURL)}}>Copy Link</button>
      </div>
    </Modal>
  );
}


export default ShareModal;

