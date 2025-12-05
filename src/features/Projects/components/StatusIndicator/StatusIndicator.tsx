import { FC, useId } from "react";
import styles from './StatusIndicator.module.scss';
import LoadingIcon from "@/features/Common/components/LoadingIcon/LoadingIcon";
import CheckIcon from "@/assets/icons/buttons/Checkmark/Checkmark.svg?react";
import ErrorIcon from "@/assets/icons/buttons/Close/Close.svg?react";
import CloseIcon from "@/assets/icons/buttons/Close/Close.svg?react";
import WarningIcon from "@/assets/icons/status/Alerts/Warning.svg?react";
import { Fade } from "react-awesome-reveal";
import Tooltip from "@/features/Common/components/Tooltip/Tooltip";
import { joinClasses } from "@/features/Common/utils/utilities";

interface StatusIndicatorProps {
  className?: string;
  inSidebar?: boolean;
  redDot?: boolean;
  status: 'warning' | 'complete' | 'running' | 'error' | 'unknown' | 'noQueries' | 'noResults';
}

const StatusIndicator: FC<StatusIndicatorProps> = ({
  className,
  inSidebar = false,
  redDot = false,
  status
}) => {

  const FADE_DELAY = 100;
  const FADE_DURATION = 500;
  const uniqueId = useId();
  const classes = joinClasses(
    styles.statusIndicator,
    className,
    redDot && styles.redDot
  );

  if(status === 'complete') {
    return (
      <div data-tooltip-id={`${uniqueId}-success-tooltip`} className={classes}>
        <Tooltip id={`${uniqueId}-success-tooltip`} className={styles.tooltip}>
          {
            inSidebar 
              ? (
                <>
                  <span>Results fully loaded</span>
                </>
              )
              : (
                <>  
                  <span className={styles.tooltipHeading}>Fully Loaded</span>
                  <span>Click to view results</span>
                </>
              )
          }

        </Tooltip>
        <Fade
          delay={FADE_DELAY}
          duration={FADE_DURATION}
          triggerOnce
          key="complete"
        >
          <span className={`${styles.status} ${styles.statusSuccess}`} >
            <CheckIcon/>
          </span>
        </Fade>
      </div>
    )
  }

  if(status === 'running') {
    return (
      <div data-tooltip-id={`${uniqueId}-running-tooltip`} className={classes}>
        <Tooltip id={`${uniqueId}-running-tooltip`} className={styles.tooltip}>
          <span className={styles.tooltipHeading}>Loading</span>
          <span>You will be notified when this query is fully loaded. While you wait, you can click to view the results that have been returned so far.</span>
        </Tooltip>
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
      <div data-tooltip-id={`${uniqueId}-warning-tooltip`} className={classes}>
        <Tooltip id={`${uniqueId}-warning-tooltip`} className={styles.tooltip}>
          <span className={styles.tooltipHeading}>Error</span>
          <span>There was an error while processing your query results. Please try again later, or try clearing your cache if the problem persists.<br/>Click to view the results that were returned.</span>
        </Tooltip>
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
      <div data-tooltip-id={`${uniqueId}-error-tooltip`} className={classes}>
        <Tooltip id={`${uniqueId}-error-tooltip`} className={styles.tooltip}>
          <span className={styles.tooltipHeading}>Query Failed</span>
          <span>There was an error while processing your query results. Please try again later, or try clearing your cache if the problem persists.</span>
        </Tooltip>
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

  if(status === 'noQueries' || status === 'noResults') {
    return (
      <div data-tooltip-id={`${uniqueId}-none-tooltip`} className={classes} >
        <Tooltip id={`${uniqueId}-none-tooltip`} className={styles.tooltip}>
          <span className={styles.tooltipHeading}>{status === 'noQueries' ? 'No Queries' : 'No Results'}</span>
          <span>{status === 'noQueries' ? 'No queries have been added to this project.' : 'No results are available for this query.'}</span>
        </Tooltip>
        {/* <Fade
          delay={FADE_DELAY}
          duration={FADE_DURATION}
          triggerOnce
          key={status}
        >
          <span className={`${styles.status} ${status === 'noQueries' ? styles.statusNoQueries : styles.statusNoResults}`}>
            <CloseIcon/>
          </span>
        </Fade> */}
      </div>
    ) 
  }

  if(status === 'unknown') {
    return (
      <div data-tooltip-id={`${uniqueId}-unknown-tooltip`} className={classes} >
        <Fade
          delay={FADE_DELAY}
          duration={FADE_DURATION}
          triggerOnce
          key="unknown"
        >
          <span className={`${styles.status} ${styles.statusUnknown}`}>
            <CloseIcon/>
          </span>
        </Fade>
      </div>
    ) 
  }

  return null;
}

export default StatusIndicator;