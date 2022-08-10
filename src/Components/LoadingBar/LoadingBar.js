import React, {useEffect, useState} from "react";
import loadingIcon from '../../Assets/Images/Loading/loading-purple.png';
import styles from './LoadingBar.module.scss';

const LoadingBar = ({loading, useIcon}) => {

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
  }, [progress, loading]);

  // Alternates progress bar opacity class on set timeout
  useEffect(() => {
    if(!loading || useIcon) 
      return;

    let timeout = 1500;
    const timer = setTimeout(() => {
      setOpacity(!opacity);
    }, timeout);
    return () => clearTimeout(timer);
  }, [opacity, loading]);

  return (
    <div className={styles.loadingBar}> 
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
      <p className={styles.text}>We will start showing you results as soon as we have them. You'll be prompted to refresh the page as we load more results.</p>
      <p className={styles.text}>Navigating away from this page will cancel your search.</p>
    </div>
  )
}

export default LoadingBar;