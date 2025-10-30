import { FC } from 'react';
import styles from './BetaTag.module.scss';
import { joinClasses } from '@/features/Common/utils/utilities';

interface BetaTagProps {
  heading: string;
  wrapperClassName?: string;
  tagClassName?: string;
}

const BetaTag: FC<BetaTagProps> = ({
  heading,
  wrapperClassName,
  tagClassName
}) => {
  const wrapperClassNames = joinClasses(styles.betaTag, wrapperClassName);
  const tagClassNames = joinClasses(styles.tag, tagClassName);
  return (
    <span className={wrapperClassNames}>{heading}<span className={tagClassNames}>Beta</span></span>
  );
};

export default BetaTag;