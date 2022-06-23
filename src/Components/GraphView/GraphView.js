import styles from './GraphView.module.css';
import React, {useState} from "react";
import { Canvas, Node, Edge, Label, useSelection } from 'reaflow';

const GraphView = ({graph, staticNode}) => {
  
  const staticNodeName = staticNode.names[0];

  const [nodes, setNodes] = useState([
    {
      id: '1',
      text: graph.subject.name
    },
    {
      id: '2',
      text: staticNodeName
    }
  ]);
  
  const [edges, setEdges] = useState([
    {
      id: '1-2',
      from: '1',
      to: '2',
      text: graph.edge.predicate.replace("biolink:", '')
    },
  ]);


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
                className='node'
                draggable={false}
                linkable={false}
                style={{ fill: 'white', strokeWidth: 1 }}
                label={<Label style={{ fill: 'black' }} />}
                onEnter={(event, node)=> {
                  console.log('Entered Node: ', event, node);
                }}
                onClick={(event, node) => {
                  console.log('Selecting Node', event, node);
                  // onClick(event, node);
                  getConnections(node);
                }}
              />
          }
          edge={
            <Edge
              label={
                <Label className={styles.edgeLabel} style={{color: 'blue'}} />
              }
              // style={{ fill: 'white', strokeWidth: 1 }}
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