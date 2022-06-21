import styles from './GraphView.module.css';
import React, {useRef, useEffect, useState} from "react";
// import {GraphCanvas, GraphCanvasRef, useSelection} from 'reagraph';
// import { ForceGraph2D } from 'react-force-graph';
import { Canvas, Node, Edge, Label, useSelection, Arrow  } from 'reaflow';

const GraphView = () => {

  // let nodes = [
  //   {
  //     id: "n-1",
  //     label: "1",
  //     // icon: "Test"
  //   },
  //   {
  //     id: "n-2",
  //     label: "2"
  //   },
  //   {
  //     id: "n-3",
  //     label: "3"
  //   },
  //   {
  //     id: "n-4",
  //     label: "4"
  //   },
  //   {
  //     id: "n-5",
  //     label: "5"
  //   },
  //   {
  //     id: "n-6",
  //     label: "6"
  //   },
  //   // {
  //   //   id: "n-7",
  //   //   label: "7"
  //   // }
  // ];

  // let edges = [
  //   {
  //     id: "1->2",
  //     source: "n-1",
  //     target: "n-2",
  //     label: "Edge 1-2"
  //   },
  //   {
  //     id: "1->3",
  //     source: "n-1",
  //     target: "n-3",
  //     label: "Edge 1-3"
  //   },
  //   {
  //     id: "1->4",
  //     source: "n-1",
  //     target: "n-4",
  //     label: "Edge 1-4"
  //   },
  //   {
  //     id: "2->5",
  //     source: "n-2",
  //     target: "n-5",
  //     label: "Edge 2-5"
  //   },
  //   {
  //     id: "3->5",
  //     source: "n-3",
  //     target: "n-5",
  //     label: "Edge 3-5"
  //   },
  //   {
  //     id: "5->6",
  //     source: "n-5",
  //     target: "n-6",
  //     label: "Edge 5-6"
  //   }
  // ];

  const [nodes, setNodes] = useState([
    {
      id: '1',
      text: 'Serotonin'
    },
    {
      id: '2',
      text: 'Agonists'
    },
    {
      id: '3',
      text: 'Ondansetron'
    },
    {
      id: '4',
      text: 'Dexamethasone'
    },
    {
      id: '5',
      text: 'Nausea'
    }
  ]);
  
  const [edges, setEdges] = useState([
    {
      id: '1-2',
      from: '1',
      to: '2',
      text: 'Regulates'
    },
    {
      id: '1-3',
      from: '1',
      to: '3',
      text: 'Regulates'
    },
    {
      id: '1-4',
      from: '1',
      to: '4',
      text: 'Regulates'
    },
    {
      id: '1-5',
      from: '1',
      to: '5',
      text: "Treats"
    },
    {
      id: '2-5',
      from: '2',
      to: '5',
      text: 'Treats'
    },
    {
      id: '3-5',
      from: '3',
      to: '5',
      text: 'Treats'
    },
    {
      id: '4-5',
      from: '4',
      to: '5',
      text: 'Treats'
    }
  ]);


  const fgRef = useRef();
  const { selections, onCanvasClick, onClick, onKeyDown, clearSelections, setSelections } = useSelection({
        nodes,
        edges,
        onDataChange: (n, e) => {
          console.info('Data changed', n, e);
          setNodes(n);
          setEdges(e);
        },
        onSelection: (s) => {
          console.info('Selection', s);
        }
      });


  const getConnections = (item, edgeOrNode = false) => {
    let selection = item.id;
    let newSelections = [selection];
    if(edgeOrNode) {
      console.log(item);
      newSelections.push(item.to);
      selection = item.to;
    } 
    edges.forEach((e)=> {
      if(e.from === selection) {
        console.log(e);
        newSelections.push(e.id, e.to);
        selection = e.to;
      }
    })  
    console.log(newSelections);
    setSelections(newSelections);
  }
  return(
    <div className="container">
      <div className={styles.graphView}>
        <Canvas
          nodes={nodes}
          edges={edges}
          selections={selections}
          direction="RIGHT"
          onCanvasClick={(e)=> {
            onCanvasClick();
          }}
          node={
            <Node
              style={{ stroke: '#1a192b', fill: 'white', strokeWidth: 1 }}
              label={<Label style={{ fill: 'black' }} />}
              onClick={(event, node) => {
                console.log('Selecting Node', event, node);
                // onClick(event, node);
                getConnections(node);
              }}
            />
          }
          edge={
            <Edge
              label={<Label className={styles.edgeLabel} />}
              onClick={(event, edge) => {
                console.log('Selecting Edge', event, edge);
                getConnections(edge, true);
                // onClick(event, edge);
              }}
            />
          }
          onLayoutChange={layout => console.log('Layout', layout)}
          layoutOptions={{
            'elk.nodeLabels.placement': 'INSIDE V_CENTER H_RIGHT',
            'elk.algorithm': 'org.eclipse.elk.layered',
            'elk.direction': 'RIGHT',
            nodeLayering: 'INTERACTIVE',
            'org.eclipse.elk.edgeRouting': 'ORTHOGONAL',
            '.elk.core.options.EdgeLabelPlacement': 'CENTER',
            'org.eclipse.elk.edgeLabels.inline': 'false',
            'elk.layered.unnecessaryBendpoints': 'true',
            // 'elk.layered.spacing.edgeNodeBetweenLayers': '20',
            'org.eclipse.elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
            'org.eclipse.elk.layered.cycleBreaking.strategy': 'DEPTH_FIRST',
            'org.eclipse.elk.insideSelfLoops.activate': 'true',
            separateConnectedComponents: 'false',
            // 'spacing.componentComponent': '20',
            // spacing: '25',
            // 'spacing.nodeNodeBetweenLayers': '20'
          }}
        />
      </div>

    </div>
  )
}

export default GraphView;