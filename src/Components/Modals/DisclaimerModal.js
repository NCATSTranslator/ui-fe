import React, {useState, useEffect} from "react";
import styles from './DisclaimerModal.module.scss'

const DisclaimerModal = ({onClose }) => {

  const [isDisclaimerApproved, setIsDisclaimerApproved] = useState(JSON.parse(localStorage.getItem('disclaimerApproved')));
  var modalIsOpen = !isDisclaimerApproved;
  onClose = (onClose) ? onClose : ()=>{};

  const [fadeClass, setFadeClass] = useState(false);

  const handleClick = () => {
    localStorage.setItem('disclaimerApproved', true);
    setIsDisclaimerApproved(true);
    onClose();
  }

  useEffect(() => {
    if(!fadeClass) {
      const timer = setTimeout(() => {
        setFadeClass(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  },[fadeClass]);

  return (
    <>
      {
        modalIsOpen &&
        <div className={`${styles.disclaimerModal} ${fadeClass ? styles.fade : ''}`}>
          <div className={`${styles.disclaimerContainer} modal-container`}>
            <div className={`${styles.disclaimerInner} inner`}>
              <p className={`${styles.heading} h5`}>Disclaimer:</p>
              <div className={`${styles.body}`}>
                <p>The Biomedical Data Translator is for research purposes and is not meant to be used by clinical service providers in the course of treating patients. Note that there is no expectation that results from queries you run will be retained for future use at this time. This system is in a beta testing stage, so bugs and errors will not be uncommon, and we ask that you provide feedback through the feedback form linked here.</p>
              </div>
              <button type="button" onClick={handleClick} aria-label="accept disclaimer">Accept</button>
            </div>
          </div>
        </div>
      }
    </>
  );
}


export default DisclaimerModal;