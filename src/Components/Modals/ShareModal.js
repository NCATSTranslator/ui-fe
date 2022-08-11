import React from "react";
import styles from "./ShareModal.module.scss";
import Modal from "./Modal";

const ShareModal = ({children, isOpen, onClose, qid}) => {

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpen = startOpen;
  const qidURL = `http://transltr-bma-ui-dev.ncats.io/results?q=${qid}`;

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

