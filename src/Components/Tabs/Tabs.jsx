import { useState, useEffect, useRef } from "react";
import Tab from "./Tab";
import { Fade } from 'react-awesome-reveal';
import styles from './Tabs.module.scss';
import { isEqual } from "lodash";

const Tabs = ({children, className, isOpen}) => {

  const firstElement = children.find(e => e);
  const [activeTabHeading, setActiveTab] = useState(firstElement?.props.heading);
  const tabClicked = useRef(false);
  const prevChildrenRef = useRef();

  const handleTabClick = (heading) => {
    setActiveTab(heading);
    tabClicked.current = true;
  }

  useEffect(() => {
    if(!isEqual(prevChildrenRef.current, children)) {
      setActiveTab(firstElement?.props.heading);
    }
    prevChildrenRef.current = children; 

    if(!tabClicked.current)
      setActiveTab(firstElement?.props.heading);
  }, [children, firstElement]);

  useEffect(() => {
    if(!isOpen)
      tabClicked.current = false;
  }, [isOpen]);

  return (

    <div className={`${styles.tabs} ${className}`}>
      <div className={styles.tabList}>
        {children.map((child, i) => {
          if(!child)
            return undefined;
          const { heading, tooltipIcon = false, dataTooltipId = ""} = child.props;
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
      {children.map((child, i) => {
        if(!child)
          return undefined;
        if (activeTabHeading !== child.props.heading) return undefined;
        return <Fade key={i} className={styles.fade}><div className={`${styles.tabContent} ${activeTabHeading}`}>{child.props.children}</div></Fade>; 
      })}
    </div>

  );
}


export default Tabs;