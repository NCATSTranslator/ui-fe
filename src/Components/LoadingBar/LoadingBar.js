import React, {useEffect, useState} from "react";
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import styles from './LoadingBar.module.scss';

const LoadingBar = ({loading, useIcon, disclaimerText, className}) => {

  // Int, represents results progress bar
  const [progress, setProgress] = useState(1);
  // Bool, alternates opacity of progress bar while loading
  const [opacity, setOpacity] = useState(false);

  // Spoofs progress bar
  useEffect(() => {
    if(progress >= 100 || !loading || useIcon) 
      return;

    let randomTimeout = Math.random() * (5000 - 500) + 500;
    const timer = setTimeout(() => {
      let newProgress = progress + 5;
      if(newProgress < 100) {
        setProgress(newProgress);
      } else {
        setProgress(100);
      }
    }, randomTimeout);
    return () => clearTimeout(timer);
  }, [progress, loading, useIcon]);

  // Alternates progress bar opacity class on set timeout
  useEffect(() => {
    if(!loading || useIcon) 
      return;

    let timeout = 1500;
    const timer = setTimeout(() => {
      setOpacity(!opacity);
    }, timeout);
    return () => clearTimeout(timer);
  }, [opacity, loading, useIcon]);

  return (
    <div className={`${styles.loadingBar} ${className}`}> 
      { useIcon && 
        <img src={loadingIcon} alt="loading icon" className={styles.loadingIcon}/>
      }
      { !useIcon &&
        <div className={styles.barOuter}>
          <div 
            className={`${styles.barInner} ${opacity ? styles.dark: styles.light}`} 
            style={{width: `${progress}%`}}
            >  
          </div>
        </div>
      }
      <h6 className={styles.heading}>Loading...</h6>
      {disclaimerText && disclaimerText}
    </div>
  )
}

export default LoadingBar;