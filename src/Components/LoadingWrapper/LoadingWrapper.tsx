import { FC, useEffect, useState, ReactNode } from 'react';
import styles from './LoadingWrapper.module.scss'; 
import LoadingIcon from '../LoadingIcon/LoadingIcon';

interface LoadingWrapperProps {
  loading: boolean;
  children: ReactNode;
}

const LoadingWrapper: FC<LoadingWrapperProps> = ({ loading, children }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShowContent(true);
    }
  }, [loading]);

  return (
    <div>
      <div className={`${styles.loadingContainer} ${loading ? styles.fadeEnterActive : styles.fadeExitActive}`}>
        <LoadingIcon />
      </div>
      <div className={`${styles.contentContainer} ${showContent ? styles.fadeEnterActive : styles.fadeExitActive}`}>
        {children}
      </div>
    </div>
  );
};

export default LoadingWrapper;
