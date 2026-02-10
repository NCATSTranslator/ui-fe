import styles from './LoadingIcon.module.scss';
import { FC } from "react";
import loadingIcon from '@/assets/images/loading/loading-purple.png';

type LoadingIconProps = {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const LoadingIcon: FC<LoadingIconProps> = ({className = "", size = "medium"}) => {

  return (
    <img src={loadingIcon} alt="" className={`${className} ${styles.spinner} ${styles[size]}`}/>
  )
}

export default LoadingIcon;