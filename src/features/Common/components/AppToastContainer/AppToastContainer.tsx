import { FC } from 'react';
import { ToastContainer, Slide } from 'react-toastify';

export const AppToastContainer: FC = () => (
  <ToastContainer
    position="top-center"
    autoClose={5000}
    theme="light"
    transition={Slide}
    pauseOnFocusLoss={false}
    hideProgressBar
    className="toastContainer"
    closeOnClick={false}
    closeButton={false}
  />
); 