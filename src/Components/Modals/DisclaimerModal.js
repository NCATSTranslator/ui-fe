import React, {useState, useEffect} from "react";
import styles from './DisclaimerModal.module.scss'

const DisclaimerModal = ({children, onClose }) => {

  const [isDisclaimerApproved, setIsDisclaimerApproved] = useState(JSON.parse(localStorage.getItem('disclaimerApproved')));
  var modalIsOpen = !isDisclaimerApproved;

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
                <p>I understand that results returned from Translator are not in any way legitimate medical advice, etc. etc.</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec est tortor, convallis a molestie ut, mattis nec quam. Aliquam sagittis est nisi, vitae porta tortor dapibus vel. Vivamus mollis scelerisque justo, in posuere lectus iaculis eu. Cras rutrum dui porta, rhoncus mauris nec, cursus ligula. Etiam dictum maximus urna. Nunc posuere tempor justo, sit amet viverra massa mollis id. Pellentesque luctus velit enim, sit amet consectetur erat vulputate ut. </p>
              </div>
              <button onClick={handleClick}>Accept</button>
            </div>
          </div>
        </div>
      }
    </>
  );
}


export default DisclaimerModal;