import { useState, useEffect, FC, ReactElement, Children, isValidElement,
  useMemo, useCallback, useRef, KeyboardEvent } from "react";
import Tab, { TabProps } from "./Tab";
import { Fade } from 'react-awesome-reveal';
import styles from './Tabs.module.scss';
import OutsideClickHandler from "@/features/Common/components/OutsideClickHandler/OutsideClickHandler";

interface TabsProps {
  children: (ReactElement<TabProps> | null)[];
  className?: string;
  tabListClassName?: string;
  tabClassName?: string;
  isOpen: boolean;
  handleTabSelection?: (heading: string) => void;
  handleOutsideTabListClick?: () => void;
  defaultActiveTab?: string;
  controlled?: boolean;
  activeTab?: string;
}

const Tabs: FC<TabsProps> = ({ 
  children, 
  className, 
  tabListClassName = "",
  tabClassName = "",
  isOpen, 
  handleTabSelection = () => {}, 
  handleOutsideTabListClick = () => {},
  defaultActiveTab,
  controlled = false,
  activeTab: controlledActiveTab
}) => {
  // Memoize valid children to avoid recalculation
  const validChildren = useMemo(() => 
    Children.toArray(children).filter((child) => isValidElement(child)) as ReactElement<TabProps>[],
    [children]
  );

  const firstTabHeading = useMemo(() => 
    validChildren[0]?.props.heading || defaultActiveTab,
    [validChildren, defaultActiveTab]
  );

  // Use controlled or uncontrolled state
  const [internalActiveTab, setInternalActiveTab] = useState<string | undefined>(firstTabHeading);
  const activeTabHeading = controlled ? controlledActiveTab : internalActiveTab;

  // Memoize tab headings for comparison
  const tabHeadings = useMemo(() => 
    validChildren.map(child => child.props.heading),
    [validChildren]
  );

  // Check if active tab is still valid
  const isValidActiveTab = useMemo(() => 
    activeTabHeading && tabHeadings.includes(activeTabHeading),
    [tabHeadings, activeTabHeading]
  );

  // Refs for focus management
  const tabRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Reset to first tab if current active tab is invalid
  useEffect(() => {
    if (!isValidActiveTab && firstTabHeading) {
      if (!controlled) {
        setInternalActiveTab(firstTabHeading);
      }
      handleTabSelection(firstTabHeading);
    }
  }, [isValidActiveTab, firstTabHeading, controlled, handleTabSelection]);

  const handleTabClick = useCallback((heading: string) => {
    if (!controlled) {
      setInternalActiveTab(heading);
    }
    handleTabSelection(heading);
  }, [controlled, handleTabSelection]);

  // Set tab ref
  const setTabRef = useCallback((heading: string, element: HTMLDivElement | null) => {
    tabRefs.current[heading] = element;
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className={`${styles.tabs} ${className || ''}`} 
      role="tablist"
      ref={tabsContainerRef}
    >
      <div className={styles.tabListWrapper}>
        <OutsideClickHandler onOutsideClick={handleOutsideTabListClick} className={styles.outsideClickHandler}>
          <div className={`${styles.tabList} ${tabListClassName || ''}`}>
            {validChildren.map((child, i) => {
              const { heading, headingOverride, tooltipIcon, dataTooltipId = "" } = child.props;
              return (
                <Tab
                  key={`${heading}-${i}`}
                  activeTabHeading={activeTabHeading}
                  heading={heading}
                  headingOverride={headingOverride}
                  tooltipIcon={tooltipIcon}
                  onClick={handleTabClick}
                  dataTooltipId={dataTooltipId}
                  setTabRef={setTabRef}
                  className={tabClassName}
                />
              );
            })}
          </div>
        </OutsideClickHandler>
      </div>
      
      {validChildren.map((child, i) => {
        const { heading, className: childClassName = "" } = child.props;
        const isActive = activeTabHeading === heading;
        
        return (
          <Fade key={`${heading}-${i}`} className={`${styles.fade} ${isActive ? '' : styles.inactive}`}>
            <div 
              className={`${styles.tabContent} ${childClassName} ${isActive ? '' : styles.inactive}`}
              role="tabpanel"
              aria-labelledby={`tab-${heading}`}
              id={`tabpanel-${heading}`}
            >
              {child.props.children}
            </div>
          </Fade>
        );
      })}
    </div>
  );
};

export default Tabs;