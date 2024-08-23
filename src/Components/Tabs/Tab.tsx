import { FC, ReactNode } from 'react';
import styles from './Tab.module.scss';

export interface TabProps {
  heading: string;
  onClick?: (heading: string) => void;
  activeTabHeading?: string;
  tooltipIcon?: ReactNode;
  dataTooltipId?: string;
  children?: ReactNode;
}

const Tab: FC<TabProps> = ({ heading, onClick = ()=>{}, activeTabHeading = "", tooltipIcon, dataTooltipId = "" }) => {

  let className = `${styles.tabListItem}`;

  if (activeTabHeading === heading) {
    className += ` ${styles.active}`;
  }

  return (
    <div className={className} onClick={() => onClick(heading)} >
      <span className={styles.heading}>{heading}</span>
      {tooltipIcon &&
        <span data-tooltip-id={dataTooltipId} className={styles.iconContainer}>{tooltipIcon}</span>
      }
      <div className={styles.underline}></div>
    </div>
  );
}

export default Tab;