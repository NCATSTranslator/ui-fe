import React, {useEffect, useState} from "react";
import styles from './LoadingBar.module.scss';

const LoadingBar = ({loading}) => {

  // Int, represents results progress bar
  const [progress, setProgress] = useState(1);
  // Bool, alternates opacity of progress bar while loading
  const [opacity, setOpacity] = useState(false);

  // Spoofs progress bar
  useEffect(() => {
    if(progress >= 100 || !loading) 
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
    if(!loading) 
      return;

    let timeout = 1500;
    const timer = setTimeout(() => {
      setOpacity(!opacity);
    }, timeout);
    return () => clearTimeout(timer);
  }, [opacity, loading]);

  return (
    <div className={styles.loadingBar}>
      <div className={styles.barOuter}>
        <div 
          className={`${styles.barInner} ${opacity ? styles.dark: styles.light}`} 
          style={{width: `${progress}%`}}
          >  
        </div>
      </div>
    </div>
  )
}

export default LoadingBar;