import styles from './GraphView.module.scss';
import React, {useState} from "react";

const GraphView = ({graph, staticNode}) => {

  return(
    <div className={`${styles.container}`}>
      <div className={styles.graphView}>

      </div>
    </div>
  )
}

export default GraphView;