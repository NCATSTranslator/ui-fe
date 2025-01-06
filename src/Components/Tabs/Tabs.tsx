import { useState, useEffect, useRef, FC, ReactElement, Children, isValidElement } from "react";
import Tab, { TabProps } from "./Tab";
import { Fade } from 'react-awesome-reveal';
import styles from './Tabs.module.scss';
import { isEqual } from "lodash";

interface TabsProps {
  children: (ReactElement<TabProps> | null)[];
  className?: string;
  isOpen: boolean;
  handleTabSelection?: (heading: string) => void;
}

const Tabs: FC<TabsProps> = ({ children, className, isOpen, handleTabSelection = ()=>{} }) => {
  const firstElement = Children.toArray(children).find((child) => isValidElement(child)) as ReactElement<TabProps> | undefined;
  const [activeTabHeading, setActiveTab] = useState(firstElement?.props.heading);
  const tabClicked = useRef(false);
  const prevChildrenRef = useRef<(ReactElement<TabProps> | null)[]>(children);

  const handleTabClick = (heading: string) => {
    handleTabSelection(heading);
    setActiveTab(heading);
    tabClicked.current = true;
  };

  const isActiveHeadingWithinChildren = (children: (ReactElement<TabProps> | null)[], activeHeading: string | undefined) => {
    if(!activeHeading)
      return false;

    let headingIsPresent = false;
    for(const child of children) {
      if(!!child?.props?.heading && child.props.heading === activeHeading) {
        headingIsPresent = true;
        break;
      }
    }
    return headingIsPresent
  }

  const areChildrenHeadingsEqual = (children: (ReactElement<TabProps> | null)[], prevChildren: (ReactElement<TabProps> | null)[]) => {
    if(children.length !== prevChildren.length)   
      return false;
    for(const [i, child] of children.entries()) {
      if(!child?.props?.heading || !prevChildren[i]?.props?.heading || child?.props.heading !== prevChildren[i]?.props.heading) {
        return false;
      }
    }
    return true;
  }

  useEffect(() => {
    if(isEqual(prevChildrenRef.current, children))
      return;

    if (!isActiveHeadingWithinChildren(children, activeTabHeading)) {
      setActiveTab(firstElement?.props.heading);
      prevChildrenRef.current = children;
      return;
    }
    
    if (!tabClicked.current || !areChildrenHeadingsEqual(prevChildrenRef.current, children)) {
      setActiveTab(firstElement?.props.heading);
      tabClicked.current = true;
    }
    prevChildrenRef.current = children;
    // eslint-disable-next-line
  }, [children]);

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
        return (
          <Fade key={i} className={styles.fade}>
            <div className={`${styles.tabContent} ${activeTabHeading !== child.props.heading ? styles.inactive : activeTabHeading}`}>{child.props.children}</div>
          </Fade>
        );
      })}
    </div>
  );
};

export default Tabs;