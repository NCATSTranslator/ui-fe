import { useState, useEffect, useRef, FC, ReactElement, Children, isValidElement } from "react";
import Tab, { TabProps } from "./Tab";
import { Fade } from 'react-awesome-reveal';
import styles from './Tabs.module.scss';
import { isEqual } from "lodash";

interface TabsProps {
  children: ReactElement<TabProps>[];
  className?: string;
  isOpen: boolean;
}

const Tabs: FC<TabsProps> = ({ children, className, isOpen }) => {
  const firstElement = Children.toArray(children).find((child) => isValidElement(child)) as ReactElement<TabProps> | undefined;
  const [activeTabHeading, setActiveTab] = useState(firstElement?.props.heading);
  const tabClicked = useRef(false);
  const prevChildrenRef = useRef<ReactElement<TabProps>[]>(children);

  const handleTabClick = (heading: string) => {
    setActiveTab(heading);
    tabClicked.current = true;
  };

  useEffect(() => {
    if (!isEqual(prevChildrenRef.current, children)) {
      setActiveTab(firstElement?.props.heading);
    }
    prevChildrenRef.current = children;

    if (!tabClicked.current) {
      setActiveTab(firstElement?.props.heading);
    }
  }, [children, firstElement]);

  useEffect(() => {
    if (!isOpen) {
      tabClicked.current = false;
    }
  }, [isOpen]);

  return (
    <div className={`${styles.tabs} ${className || ''}`}>
      <div className={styles.tabList}>
        {Children.map(children, (child, i) => {
          if (!isValidElement(child)) return null;
          const { heading, tooltipIcon = false, dataTooltipId = "" } = child.props;
          return (
            <Tab
              activeTabHeading={activeTabHeading}
              key={i}
              heading={heading}
              tooltipIcon={tooltipIcon}
              onClick={handleTabClick}
              dataTooltipId={dataTooltipId}
            />
          );
        })}
      </div>
      {Children.map(children, (child, i) => {
        if (!isValidElement(child)) return null;
        if (activeTabHeading !== child.props.heading) return null;
        return (
          <Fade key={i} className={styles.fade}>
            <div className={`${styles.tabContent} ${activeTabHeading}`}>{child.props.children}</div>
          </Fade>
        );
      })}
    </div>
  );
};

export default Tabs;