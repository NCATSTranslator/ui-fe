import React from "react";
import styles from './Tab.module.scss';

const Tab = ({heading, onClick, activeTab}) => {

  let className = `${styles.tabListItem}`;

  if (activeTab === heading) {
    className += ` ${styles.active}`;
  }

  return (

    <div 
      className={className}
      onClick={onClick}
      data-heading={heading} >
        {heading}
    </div>

  );
}


export default Tab;