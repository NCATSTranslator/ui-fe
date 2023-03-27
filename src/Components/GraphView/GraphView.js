import styles from './GraphView.module.scss';
import {useState, useEffect, memo, useRef} from 'react';
import {Graph} from 'cytoscape-react';
import { resultToCytoscape } from '../../Utilities/graphFunctions';
import { isEqual } from 'lodash';
import cytoscape from 'cytoscape';
import { v4 as uuidv4 } from 'uuid';

const GraphView = ({result, rawResults}) => {

  let graphRef = useRef(null);
  let cy = null;
  const [currentLayout, setCurrentLayout] = useState({name:'breadthfirst', spacingFactor: 1.5});

  const initCytoscapeInstance = (result, summary, graphRef, layout) => {
    cy = cytoscape({
      container: graphRef.current,
      elements: resultToCytoscape(result, summary),
      layout: layout,
      style: cytoscape.stylesheet()
        .selector('node')
          .css({
            'id': 'data(id)',
            'content': 'data(label)',
            'shape': 'round-rectangle',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': '206px',
            'height': '40px',
            'padding': '8px',
            'color': '#fff',
            'background-color': '#2d5492',
            'border-width': '0px',
          })
        .selector('edge')
          .css({
            'line-color': 'black'
          })
        .selector('.highlight')
          .css({
            'line-color': 'red'
          })
        .selector('.hide')
          .css({
            'opacity': '0.3'
          }),
      data: {
        result: 0
      }
    });
    
    cy.unbind('mouseover');
    cy.bind('mouseover', 'node', (ev) => {
      ev.cy.elements().removeClass(['highlight', 'hide']);
      const paths = summary.paths;
      const edges = new Set();
      const nodes = new Set();
      summary.results[ev.cy.data().result].paths.forEach((p) => {
        if (paths[p].subgraph.includes(ev.target.id())) {
          paths[p].subgraph.forEach((o, i) => {
            if (i%2 === 0) {
              nodes.add(o);
            } else {
              edges.add(o);
            }
          });
        };
      })
    
      ev.cy.elements().forEach((ele) => {
        if (ele.isEdge() && edges.has(ele.id())) {
          ele.addClass('highlight');
        } else if (ele.isNode() && nodes.has(ele.id())) {
          ele.addClass('highlight');
        } else {
          ele.addClass('hide');
        }
      });
    });

    // when background is clicked, remove highlight and hide classes from all elements
    cy.bind('mouseout', 'node', (ev) => {
      ev.cy.elements().removeClass(['highlight', 'hide']);
    });
    
  }
  

  useEffect(() => {
    if(graphRef.current)
      initCytoscapeInstance(result.rawResult, rawResults.data, graphRef, currentLayout);
  }, [result, rawResults, currentLayout]);

  return (
    <div className={styles.GraphView}>
      <div className="sidebar" style={{padding: '20px'}}>
        <button onClick={()=>setCurrentLayout({name:'breadthfirst', spacingFactor: 1.5})}>Breadthfirst</button>
        <button onClick={()=>setCurrentLayout({name:'random'})}>Random</button>
        <button onClick={()=>setCurrentLayout({name:'circle'})}>Circle</button>
        <button onClick={()=>setCurrentLayout({name:'concentric'})}>Concentric</button>
        <button onClick={()=>setCurrentLayout({name:'cose'})}>Cose</button>
      </div>
      <h3>Current Type: <strong>{currentLayout.name}</strong></h3>
      <div className={styles.graphContainer} style={{width: '1200px', height:'600px', margin: '0 auto', border: '1px solid black'}}>
        <div id={`cy-${uuidv4()}`}ref={graphRef} className={`${styles.cytoscapeContainer} cytoscape-container`}></div>
      </div>
    </div>
  );
}

export default memo(GraphView);