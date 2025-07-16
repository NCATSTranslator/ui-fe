import { FC, ReactNode } from 'react';
import styles from './CardWrapper.module.scss';
import { joinClasses } from '@/features/Common/utils/utilities';

interface CardWrapperProps {
  children: ReactNode;
  className?: string;
}

const CardWrapper: FC<CardWrapperProps> = ({ children, className }) => {
  return (
    <div className={joinClasses(styles.cardWrapper, className)}>
      {children}
    </div>
  );
};

export default CardWrapper;