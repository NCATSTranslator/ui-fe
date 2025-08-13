import { FC, ReactNode, MouseEvent } from 'react';
import styles from './CardWrapper.module.scss';
import { joinClasses } from '@/features/Common/utils/utilities';

interface CardWrapperProps {
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
}

const CardWrapper: FC<CardWrapperProps> = ({ children, className, onClick }) => {
  return (
    <div className={joinClasses(styles.cardWrapper, className)} onClick={onClick}>
      {children}
    </div>
  );
};

export default CardWrapper;