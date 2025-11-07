import { ReactNode } from "react";
import styles from './AppToast.module.scss';
import { ToastContent } from "react-toastify";

interface AppToastProps {
  topText?: ReactNode | string;
  bottomText?: ReactNode | string;
}
const AppToast: ToastContent<AppToastProps> = ({ data }) => (
  <div className={styles.appToast}>
    {
      data?.topText && (
        <div className={styles.topText}>
          {data.topText}
        </div>
      )
    }
    {
      data?.bottomText && (
        <div className={styles.bottomText}>
          {data.bottomText}
        </div>
      )
    }
  </div>
);

export default AppToast;