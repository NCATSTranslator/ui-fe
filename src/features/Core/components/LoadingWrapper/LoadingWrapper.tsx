import { FC, useEffect, useState, ReactNode } from 'react';
import styles from './LoadingWrapper.module.scss';
import LoadingIcon from '@/features/Core/components/LoadingIcon/LoadingIcon';
import { Timeout } from '@/features/Common/types/global';

interface LoadingWrapperProps {
  loading?: boolean;
  children?: ReactNode;
  wrapperClassName?: string;
  contentClassName?: string;
  spinnerClassName?: string;
  size?: 'small' | 'medium' | 'large';
}

const LoadingWrapper: FC<LoadingWrapperProps> = ({
  loading = false,
  children,
  wrapperClassName = "",
  contentClassName = "",
  spinnerClassName = "",
  size = 'medium' 
}) => {
  const [showContent, setShowContent] = useState(false);
  const [isLoading, setIsLoading] = useState(loading);
  const showDelay = 350;

  useEffect(() => {
    let timer: Timeout | null = null;
    if (!loading) {
      timer = setTimeout(() => {setShowContent(true); setIsLoading(false);}, showDelay);
    } else {
      setIsLoading(true);
      setShowContent(false);
    }
    return () => {
      if(!!timer)
       clearTimeout(timer);
    };
  }, [loading]);

  if (!children) {
    return (
      <div className={`${styles.loadingWrapper} ${styles[size]} ${wrapperClassName}`}>
        <LoadingIcon size={size} className={spinnerClassName} />
      </div>
    );
  }

  return (
    <div>
      <div className={`${styles.loadingContainer} ${isLoading ? styles.fadeEnterActive : styles.fadeExitActive} ${wrapperClassName}`}>
        <LoadingIcon size={size} className={spinnerClassName} />
      </div>
      <div className={`${styles.contentContainer} ${showContent ? styles.fadeEnterActive : styles.fadeExitActive} ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default LoadingWrapper;
