import { FC, ReactNode } from 'react';
import styles from './Tab.module.scss';

export interface TabProps {
  heading: string;
  onClick?: (heading: string) => void;
  activeTabHeading?: string;
  tooltipIcon?: ReactNode;
  dataTooltipId?: string;
  children?: ReactNode;
  className?: string;
}

const Tab: FC<TabProps> = ({ heading, onClick = ()=>{}, activeTabHeading = "", tooltipIcon, dataTooltipId = "", className = "" }) => {

  let classes = `${className} ${styles.tabListItem}`;

  if (activeTabHeading === heading) {
    classes += ` ${styles.active}`;
  }

  return (
    <div className={classes} onClick={() => onClick(heading)} >
      <span className={styles.heading}>{heading}</span>
      {tooltipIcon &&
        <span data-tooltip-id={dataTooltipId} className={styles.iconContainer}>{tooltipIcon}</span>
      }
      <div className={styles.underline}></div>
    </div>
  );
}

export default Tab;