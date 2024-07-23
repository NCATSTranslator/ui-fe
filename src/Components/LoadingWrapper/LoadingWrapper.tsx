import { FC, useEffect, useState, ReactNode } from 'react';
import styles from './LoadingWrapper.module.scss'; 
import LoadingIcon from '../LoadingIcon/LoadingIcon';

interface LoadingWrapperProps {
  loading: boolean;
  children: ReactNode;
}

const LoadingWrapper: FC<LoadingWrapperProps> = ({ loading, children }) => {
  const [showContent, setShowContent] = useState(false);
  const [isLoading, setIsLoading] = useState(loading);
  const showDelay = 350;

  useEffect(() => {
    let timer: boolean | NodeJS.Timeout = false;
    if (!loading) {
      timer = setTimeout(() => {setShowContent(true); setIsLoading(false);}, showDelay);
    }
    return () => {
      if(!!timer)
       clearTimeout(timer);
    };
  }, [loading]);

  return (
    <div>
      <div className={`${styles.loadingContainer} ${isLoading ? styles.fadeEnterActive : styles.fadeExitActive}`}>
        <LoadingIcon />
      </div>
      <div className={`${styles.contentContainer} ${showContent ? styles.fadeEnterActive : styles.fadeExitActive}`}>
        {children}
      </div>
    </div>
  );
};

export default LoadingWrapper;
