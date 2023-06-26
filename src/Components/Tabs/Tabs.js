import { useState, useEffect, useRef } from "react";
import Tab from "./Tab";
import { Fade } from 'react-awesome-reveal';
import styles from './Tabs.module.scss';

const Tabs = ({children, isOpen}) => {

  const firstElement = children.find(e => e);
  const [activeTabHeading, setActiveTab] = useState(firstElement?.props.heading);
  const tabClicked = useRef(false);

  const handleTabClick = (event) => {
    setActiveTab(event.target.dataset.heading);
    tabClicked.current = true;
  }

  useEffect(() => {
    if(!tabClicked.current)
      setActiveTab(firstElement?.props.heading);
  }, [firstElement]);
  
  useEffect(() => {
    if(!isOpen)
      tabClicked.current = false;
  }, [isOpen]);

  return (

    <div className={styles.tabs}>
      <div className={styles.tabList}>
        {children.map((child, i) => {
          if(!child)
            return undefined;
          const { heading } = child.props;
          return (
            <Tab
              activeTabHeading={activeTabHeading}
              key={i}
              heading={heading}
              onClick={handleTabClick}
            />
          );
        })}
      </div>
      {children.map((child, i) => {
        if(!child)
          return undefined;
        if (activeTabHeading !== child.props.heading) return undefined;
        return <Fade key={i}><div className={`${styles.tabContent} ${activeTabHeading}`}>{child.props.children}</div></Fade>; 
      })}
    </div>

  );
}


export default Tabs;