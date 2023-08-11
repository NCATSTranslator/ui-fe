import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import TextCrossfade from '../TextCrossfade/TextCrossfade';
import styles from './LoadingBar.module.scss';

const LoadingBar = ({loading, useIcon, disclaimerText, className, reducedPadding}) => {

  return (
    <div className={`${styles.loadingBar} ${className} ${(reducedPadding) ? styles.reducedPadding : ''}`}> 
      { useIcon && 
        <img src={loadingIcon} alt="loading icon" className={styles.loadingIcon}/>
      }
      <TextCrossfade />
      {disclaimerText && disclaimerText}
    </div>
  )
}

export default LoadingBar;
