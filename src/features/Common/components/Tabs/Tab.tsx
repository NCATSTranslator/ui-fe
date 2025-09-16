import { ReactNode, KeyboardEvent, forwardRef, useImperativeHandle, useRef, RefObject } from 'react';
import styles from './Tab.module.scss';
import { joinClasses } from '@/features/Common/utils/utilities';

export interface TabProps {
  heading: string;
  headingOverride?: ReactNode;
  onClick?: (heading: string) => void;
  activeTabHeading?: string;
  tooltipIcon?: ReactNode;
  dataTooltipId?: string;
  children?: ReactNode;
  className?: string;
  setTabRef?: (heading: string, element: HTMLDivElement | null) => void;
}

const Tab = forwardRef<HTMLDivElement, TabProps>(({ 
  heading,
  headingOverride,
  onClick = () => {}, 
  activeTabHeading = "", 
  tooltipIcon, 
  dataTooltipId = "", 
  className = "",
  setTabRef
}, ref) => {
  const tabRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement | null>;
  
  // Forward the ref
  useImperativeHandle(ref, () => tabRef.current!, []);

  const isActive = activeTabHeading === heading;
  
  const handleClick = () => onClick(heading);
  
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        onClick(heading);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'Home':
      case 'End':
        // Let the parent Tabs component handle these keys
        break;
    }
  };

  const classes = joinClasses(className, styles.tabListItem, isActive && styles.active);

  // Set ref in parent component for focus management
  const handleRef = (element: HTMLDivElement | null) => {
    if (setTabRef) {
      setTabRef(heading, element);
    }
  };

  return (
    <div 
      ref={(element) => {
        tabRef.current = element;
        handleRef(element);
      }}
      className={classes}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${heading}`}
      tabIndex={isActive ? 0 : -1}
      id={`tab-${heading}`}
    >
      <span className={styles.heading}>{headingOverride || heading}</span>
      {tooltipIcon && (
        <span 
          data-tooltip-id={dataTooltipId} 
          className={styles.iconContainer}
        >
          {tooltipIcon}
        </span>
      )}
      <div className={styles.underline}></div>
    </div>
  );
});

Tab.displayName = 'Tab';

export default Tab;