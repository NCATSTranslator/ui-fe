import { FC } from 'react';
import { ToastContainer, Slide } from 'react-toastify';

export const AppToastContainer: FC = () => (
  <ToastContainer
    position="top-center"
    autoClose={4000}
    theme="light"
    transition={Slide}
    pauseOnFocusLoss={false}
    hideProgressBar
    draggable
    className="toastContainer"
    closeOnClick={false}
    closeButton={false}
  />
); 