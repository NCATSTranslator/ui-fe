import React from "react";
import styles from './QueryItemButton.module.scss';
import { getIcon } from "../../Utilities/utilities";

const QueryItemButton = ({handleClick, item, disabled, children}) => {

  const isDisabled = (disabled === undefined) ? false : disabled;
  const icon = getIcon(item.category);

  return (
    <button onClick={handleClick} className={`${styles.queryItemButton} ${isDisabled}`}>
      {icon}
      {children}
    </button>
  );
}

export default QueryItemButton;