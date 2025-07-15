import LoadingIcon from "@/features/Common/components/LoadingIcon/LoadingIcon";
import styles from './StatusIndicator.module.scss';
import { QueryStatus } from "@/features/Projects/types/projects";
import CheckIcon from "@/assets/icons/buttons/Checkmark/Checkmark.svg?react";
import ErrorIcon from "@/assets/icons/buttons/Close/Close.svg?react";
import { FC } from "react";

interface StatusIndicatorProps {
  status: QueryStatus;
}

const StatusIndicator: FC<StatusIndicatorProps> = ({ status }) => {

  if(status === 'success') {
    return (
      <span className={`${styles.status} ${styles.statusSuccess}`}>
        <CheckIcon/>
      </span>
    )
  }

  if(status === 'running') {
    return (
      <span className={`${styles.statusRunning}`}>
        <LoadingIcon size="small"/>
      </span>
    )
  }

  if(status === 'error') {
    return (
      <span className={`${styles.status} ${styles.statusError}`}>
        <ErrorIcon/>
      </span>
    ) 
  }

  return null;
}

export default StatusIndicator;