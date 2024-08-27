import { FC } from 'react';
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import TextCrossfade from '../TextCrossfade/TextCrossfade';
import styles from './LoadingBar.module.scss';

interface LoadingBarProps {
  useIcon: boolean;
  disclaimerText?: string;
  className?: string;
  reducedPadding: boolean;
  loadingText?: string;
}

const LoadingBar: FC<LoadingBarProps> = ({useIcon, disclaimerText, className, reducedPadding, loadingText}) => {

  return (
    <div className={`${styles.loadingBar} ${className} ${(reducedPadding) ? styles.reducedPadding : ''}`}> 
      <div className={styles.top}>
        { useIcon && 
          <img src={loadingIcon} alt="loading icon" className={styles.loadingIcon}/>
        }
        {
          loadingText 
          ? <span className={styles.heading}>{loadingText}</span>
          : <TextCrossfade />
        }
      </div>
      {disclaimerText && disclaimerText}
    </div>
  )
}

export default LoadingBar;
