import React from "react";
import { getIcon } from "../../Utilities/utilities";
import styles from './QueryTemplate.module.scss';

const QueryTemplate = ({handleClick, items}) => {

  return (
    <button onClick={handleClick} className={styles.queryTemplate}>
      {
        items.map((item, index)=> {
          return (
            <span key={index}>{getIcon(item.category)}{item.name}</span>
          )
        })
      }
    </button>
  );
}

export default QueryTemplate;