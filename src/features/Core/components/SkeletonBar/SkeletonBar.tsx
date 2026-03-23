import { CSSProperties, FC } from 'react';
import styles from './SkeletonBar.module.scss';

interface SkeletonBarProps {
  borderRadius?: CSSProperties['borderRadius'];
  className?: string;
  height?: CSSProperties['height'];
  style?: CSSProperties;
  width?: CSSProperties['width'];
}

const SkeletonBar: FC<SkeletonBarProps> = ({
  borderRadius,
  className,
  height,
  style = {},
  width
}) => {
  return (
    <div
      className={`${styles.skeletonBar}${className ? ` ${className}` : ''}`}
      style={{ width, height, borderRadius, ...style }}
    />
  );
};

export default SkeletonBar;
