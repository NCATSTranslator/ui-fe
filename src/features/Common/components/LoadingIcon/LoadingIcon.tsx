import styles from './LoadingIcon.module.scss';
import { FC } from "react";

type LoadingIconProps = {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const LoadingIcon: FC<LoadingIconProps> = ({className = "", size = "medium"}) => {

  return (
    <div className={`${className} ${styles.spinner} ${styles[size]}`}></div>
  )
}

export default LoadingIcon;