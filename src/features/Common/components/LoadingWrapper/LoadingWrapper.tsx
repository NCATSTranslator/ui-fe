import { FC, useEffect, useState, ReactNode } from 'react';
import styles from './LoadingWrapper.module.scss';
import LoadingIcon from '@/features/Common/components/LoadingIcon/LoadingIcon';

interface LoadingWrapperProps {
  loading?: boolean;
  children?: ReactNode;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const LoadingWrapper: FC<LoadingWrapperProps> = ({ 
  loading = false,
  children,
  className = "",
  size = 'medium' 
}) => {
  const [showContent, setShowContent] = useState(false);
  const [isLoading, setIsLoading] = useState(loading);
  const showDelay = 350;

  useEffect(() => {
    let timer: boolean | number = false;
    if (!loading) {
      timer = setTimeout(() => {setShowContent(true); setIsLoading(false);}, showDelay);
    }
    return () => {
      if(!!timer)
       clearTimeout(timer);
    };
  }, [loading]);

  if (!children) {
    return (
      <div className={`${styles.loadingWrapper} ${styles[size]} ${className}`}>
        <LoadingIcon size={size} />
      </div>
    );
  }

  return (
    <div>
      <div className={`${styles.loadingContainer} ${isLoading ? styles.fadeEnterActive : styles.fadeExitActive}`}>
        <LoadingIcon size={size} />
      </div>
      <div className={`${styles.contentContainer} ${showContent ? styles.fadeEnterActive : styles.fadeExitActive} ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default LoadingWrapper;
