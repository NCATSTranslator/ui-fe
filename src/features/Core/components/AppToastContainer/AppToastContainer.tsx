import { FC } from 'react';
import styles from './AppToastContainer.module.scss';
import { ToastContainer, Slide } from 'react-toastify';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';

const CloseButton = ({closeToast}: {closeToast: () => void}) => (
  <CloseIcon onClick={closeToast} className={styles.closeButton} />
);

export const AppToastContainer: FC = () => (
  <ToastContainer
    position="top-right"
    autoClose={4000}
    theme="light"
    transition={Slide}
    pauseOnFocusLoss={false}
    hideProgressBar
    draggable
    draggablePercent={60}
    closeOnClick={false}
    closeButton={CloseButton}
    toastClassName={styles.toast}
  />
); 