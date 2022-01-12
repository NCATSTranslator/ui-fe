import React from "react";

const Tab = ({heading, onClick, activeTab}) => {

  let className = 'tab-list-item';

  if (activeTab === heading) {
    className += ' tab-list-item active';
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