import { useState, useEffect, FC } from "react";
import styles from './DisclaimerModal.module.scss';

interface DisclaimerModalProps {
  onClose?: () => void;
  isOpen: boolean;
}

const DisclaimerModal: FC<DisclaimerModalProps> = ({ onClose = () => {}, isOpen }) => {

  const [isFaded, setIsFaded] = useState<boolean>(false); 

  const handleClick = () => {
    onClose();
  }

  useEffect(() => {
    if(!isFaded) {
      const timer = setTimeout(() => {
        setIsFaded(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  },[isFaded]);

  return isOpen ? (
    <div className={`${styles.disclaimerModal} ${isFaded ? styles.fade : ''}`}>
      <div className={`${styles.disclaimerContainer} modal-container`}>
        <div className={`${styles.disclaimerInner} inner`}>
          <p className={`${styles.heading} h5`}>Disclaimer:</p>
          <div className={`${styles.body}`}>
            <p>The Biomedical Data Translator is for research purposes and is not meant to be used by clinical service providers in the course of treating patients. Note that there is no expectation that results from queries you run will be retained for future use at this time. This system is in a beta testing stage, so bugs and errors will not be uncommon, and we ask that you provide feedback through the feedback form in the navigation bar at the top of the page.</p>
            <p>Translator components are made publicly available from the sources listed <a href="https://github.com/NCATSTranslator/Translator-All/wiki" rel="noreferrer" target="_blank">here</a>. Please respect their individual licenses regarding proper use and redistribution.</p>
          </div>
          <button type="button" onClick={handleClick} aria-label="accept disclaimer">Accept</button>
        </div>
      </div>
    </div>
  ) : null;
}


export default DisclaimerModal;