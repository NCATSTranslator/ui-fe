import styles from './BetaTag.module.scss';
import { FC } from 'react';

interface BetaTagProps {
  heading: string;
  className?: string;
}

const BetaTag: FC<BetaTagProps> = ({
  heading,
  className}) => {
  return (
    <span className={`${styles.betaTag} ${className || ''}`}>{heading}<span className={styles.tag}>Beta</span></span>
  );
};

export default BetaTag;