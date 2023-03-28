import styles from './GraphView.module.scss';
import {useState, useEffect, memo, useRef} from 'react';
import { resultToCytoscape } from '../../Utilities/graphFunctions';
import cytoscape from 'cytoscape';
import { v4 as uuidv4 } from 'uuid';
import klay from 'cytoscape-klay';
import dagre from 'cytoscape-dagre';
import avsdf from 'cytoscape-avsdf';

const GraphView = ({result, rawResults}) => {

  let graphRef = useRef(null);
  let cy = null;
  const [currentLayout, setCurrentLayout] = useState({name:'breadthfirst', spacingFactor: 1.5});

  // initialize 3rd party layouts
  cytoscape.use(klay);
  cytoscape.use(avsdf);
  cytoscape.use(dagre);

  const addClassToConnections = (highlightClass, hideClass, eventType, summary, cy) => {
    cy.unbind(eventType);
    cy.bind(eventType, 'node', (ev) => {
      // ev.cy.elements().removeClass([highlightClass, hideClass]);
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
        // if its a node and has the class AND has the id, hide it. This means we're clicking on an already selected node
        if(ele.isNode() && ele.hasClass(highlightClass) && nodes.has(ele.id())) {
          ele.addClass(hideClass);
          ele.removeClass(highlightClass);
        // if its an edge and has the class AND has the id, hide it. This means we're clicking on an already selected edge
        } else if(ele.isEdge() && ele.hasClass(highlightClass) && edges.has(ele.id())) {
          ele.addClass(hideClass);
          ele.removeClass(highlightClass);
        // If its a node and it either has the class or the id, we're clicking on it for the first time. highlight it.
        } else if (ele.isNode() && (ele.hasClass(highlightClass) || nodes.has(ele.id()))) {
          ele.addClass(highlightClass);
          ele.removeClass(hideClass);
        // If its an edge and it either has the class or the id, we're clicking on it for the first time. highlight it.
        } else if (ele.isEdge() && (ele.hasClass(highlightClass) || edges.has(ele.id()))) {
          ele.addClass(highlightClass);
          ele.removeClass(hideClass);
        // Otherwise hide it
        } else {
          ele.addClass(hideClass);
          ele.removeClass(highlightClass)
        }
      });
    });
  }

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
            'line-color': '#CED0D0'
          })
        .selector('edge.highlight')
          .css({
            'line-color': '#000',
            'opacity': '1.0'
          })
        .selector('.hover-highlight')
          .css({
            'line-color': '#606368'
          })
        .selector('.hide')
          .css({
            'opacity': '0.3'
          }),
      data: {
        result: 0
      }
    });


    addClassToConnections('highlight', 'hide', 'tapstart', summary, cy);
    // addClassToConnections('hover-highlight', 'hide', 'mouseover', summary, cy);

    // when background is clicked, remove highlight and hide classes from all elements
    cy.bind('click', (ev) => {
      if(ev.target === cy)
        ev.cy.elements().removeClass(['highlight', 'hide']);
    });    
    // cy.bind('mouseover', (ev) => {
    //   if(ev.target === cy)
    //     ev.cy.elements().removeClass(['highlight', 'hide']);
    // });    
  }
  

  useEffect(() => {
    if(graphRef.current)
      initCytoscapeInstance(result.rawResult, rawResults.data, graphRef, currentLayout);
  }, [result, rawResults, currentLayout]);

  return (
    <div className={styles.GraphView}>
      <div className="sidebar" style={{padding: '20px'}}>
        <button onClick={()=>setCurrentLayout({name:'breadthfirst', spacingFactor: 1.5})}>Breadthfirst</button>
        <button onClick={()=>setCurrentLayout({name:'dagre', spacingFactor: 1.5})}>dagre</button>
        <button onClick={()=>setCurrentLayout({name:'klay'})}>Klay</button>
        <button onClick={()=>setCurrentLayout({name:'random'})}>Random</button>
        <button onClick={()=>setCurrentLayout({name:'avsdf'})}>avsdf</button>
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