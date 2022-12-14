import React, { useState } from "react";
import Tab from "./Tab";
import { Fade } from 'react-awesome-reveal';
import styles from './Tabs.module.scss';

const Tabs = ({children}) => {

  // discard any elements that don't evaluate to 'true'
  const firstElement = children.find(e => e)
  const [activeTab, setActiveTab] = useState(firstElement.props.heading);

  const handleTabClick = (event) => {
    setActiveTab(event.target.dataset.heading);
  }

  return (

    <div className={styles.tabs}>
      <div className={styles.tabList}>
        {children.map((child, i) => {
          if(!child)
            return undefined;
          const { heading } = child.props;
          return (
            <Tab
              activeTab={activeTab}
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
        if (activeTab !== child.props.heading) return undefined;
        return <Fade key={i}><div className={`${styles.tabContent} ${activeTab}`}>{child.props.children}</div></Fade>; 
      })}
    </div>

  );
}


export default Tabs;