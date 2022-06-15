import styles from './GraphView.module.css';
import React, {useRef, useSelection} from "react";
import {GraphCanvas, GraphCanvasRef} from 'reagraph';

const GraphView = () => {

  let nodes = [
    {
      id: "n-1",
      label: "1"
    },
    {
      id: "n-2",
      label: "2"
    },
    {
      id: "n-3",
      label: "3"
    },
    {
      id: "n-4",
      label: "4"
    }
  ];

  let edges = [
    {
      id: "1->2",
      source: "n-1",
      target: "n-2",
      label: "Edge 1-2"
    },
    {
      id: "1->3",
      source: "n-1",
      target: "n-3",
      label: "Edge 1-3"
    },
    {
      id: "1->4",
      source: "n-1",
      target: "n-4",
      label: "Edge 1-4"
    }
  ];

  const graphRef = useRef<GraphCanvasRef | null>(null);
  const { selections, onNodeClick, onCanvasClick } = useSelection({
    ref: graphRef,
    nodes: nodes,
    edges: edges,
    focusOnSelect: false
  });

  return(
    <div className={styles.graphView}>
      <GraphCanvas
        // ref={graphRef}
        nodes={nodes}
        edges={edges}
        selections={selections}
        onCanvasClick={onCanvasClick}
        onNodeClick={onNodeClick}
        layoutType="hierarchicalLr"
      />
    </div>
  )
}

export default GraphView;