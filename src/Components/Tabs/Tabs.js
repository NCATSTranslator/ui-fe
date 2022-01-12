import React, { useState } from "react";
import Tab from "./Tab";
import { Fade } from 'react-awesome-reveal';

const Tabs = ({children}) => {

  const [activeTab, setActiveTab] = useState(children[0].props.heading);

  const handleTabClick = (event) => {
    setActiveTab(event.target.dataset.heading);
  }

  return (

    <div className="tabs">
      <div className="tab-list">
      {children.map((child, i) => {
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
        if (activeTab !== child.props.heading) return undefined;
        return <Fade key={i}><div className={`tab-content ${activeTab}`}>{child.props.children}</div></Fade>; 
      })}
    </div>

  );
}


export default Tabs;