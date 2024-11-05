import { FC, ReactNode } from 'react';
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import TextCrossfade from '../TextCrossfade/TextCrossfade';
import styles from './LoadingBar.module.scss';

interface LoadingBarProps {
  useIcon: boolean;
  disclaimerText?: string | ReactNode;
  className?: string;
  reducedPadding?: boolean;
  loadingText?: string;
}

const LoadingBar: FC<LoadingBarProps> = ({useIcon, disclaimerText, className, reducedPadding = false, loadingText}) => {

  return (
    <div className={`${styles.loadingBar} ${className} ${(reducedPadding) ? styles.reducedPadding : ''}`}> 
      <div className={styles.top}>
        { useIcon && 
          <img src={loadingIcon} alt="loading icon" className={`${styles.loadingIcon} ${!!loadingText && styles.small}`}/>
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
