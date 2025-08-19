import LoadingIcon from "@/features/Common/components/LoadingIcon/LoadingIcon";
import styles from './StatusIndicator.module.scss';
import CheckIcon from "@/assets/icons/buttons/Checkmark/Checkmark.svg?react";
import ErrorIcon from "@/assets/icons/buttons/Close/Close.svg?react";
import WarningIcon from "@/assets/icons/status/Alerts/Warning.svg?react";
import { Fade } from "react-awesome-reveal";
import { FC } from "react";

interface StatusIndicatorProps {
  status: 'warning' | 'complete' | 'running' | 'error' | 'unknown';
}

const StatusIndicator: FC<StatusIndicatorProps> = ({ status }) => {

  const FADE_DELAY = 100;
  const FADE_DURATION = 500;

  if(status === 'complete') {
    return (
      <div>
        <Fade
          delay={FADE_DELAY}
          duration={FADE_DURATION}
          triggerOnce
          key="complete"
        >
          <span className={`${styles.status} ${styles.statusSuccess}`}>
            <CheckIcon/>
          </span>
        </Fade>
      </div>
    )
  }

  if(status === 'running') {
    return (
      <div>
        <Fade
          delay={FADE_DELAY}
          duration={FADE_DURATION}
          triggerOnce
          key="running"
        >
          <span className={`${styles.status} ${styles.statusRunning}`}>
            <LoadingIcon size="small" className={styles.loadingIcon}/>
          </span>
        </Fade>
      </div>
    )
  }

  if(status === 'warning') {
    return (
      <div>
        <Fade
          delay={FADE_DELAY}
          duration={FADE_DURATION}
          triggerOnce
          key="complete"
        >
          <span className={`${styles.status} ${styles.statusWarning}`}>
            <WarningIcon/>
          </span>
        </Fade>
      </div>
    )
  }

  if(status === 'error') {
    return (
      <div>
        <Fade
          delay={FADE_DELAY}
          duration={FADE_DURATION}
          triggerOnce
          key="error"
        >
          <span className={`${styles.status} ${styles.statusError}`}>
            <ErrorIcon/>
          </span>
        </Fade>
      </div>
    ) 
  }

  if(status === 'unknown') {
    return (
      <div>
        <Fade
          delay={FADE_DELAY}
          duration={FADE_DURATION}
          triggerOnce
          key="unknown"
        >
          <span className={`${styles.status} ${styles.statusUnknown}`}>
            {/* TODO: Add unknown status icon */}
            <LoadingIcon size="small" className={styles.loadingIcon}/>
          </span>
        </Fade>
      </div>
    ) 
  }

  return null;
}

export default StatusIndicator;