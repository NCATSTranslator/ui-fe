import styles from './LoadingIcon.module.scss';
import { FC } from "react";
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';

type LoadingIconProps = {
  className?: string;
}

const LoadingIcon: FC<LoadingIconProps> = ({className = ""}) => {

  return (
    <div className={`${className && className} ${styles.iconContainer}`}>
      <img src={loadingIcon} alt="loading icon" className={styles.loadingIcon}/>
    </div>
  )
}

export default LoadingIcon;