import styles from './GraphView.module.scss';
import {useState, useEffect, memo, useRef, useCallback} from 'react';
import { resultToCytoscape } from '../../Utilities/graphFunctions';
import cytoscape from 'cytoscape';
import { v4 as uuidv4 } from 'uuid';
import klay from 'cytoscape-klay';
import dagre from 'cytoscape-dagre';
import avsdf from 'cytoscape-avsdf';

const GraphView = ({result, rawResults}) => {

  let graphRef = useRef(null);
  let cy = null;
  const layoutList = {
    breadthfirst: {
      name: 'breadthfirst', spacingFactor: 1.1, avoidOverlap: true
    },
    dagre: {
      name: 'dagre', spacingFactor: 1.1
    },
    klay: {
      name: 'klay'
    },
    random: {
      name: 'random'
    },
    avsdf: {
      name: 'avsdf'
    },
    circle: {
      name: 'circle'
    },
    concentric: {
      name: 'concentric'
    },
    cose: {
      name: 'cose'
    }
  }
  const [currentLayout, setCurrentLayout] = useState(layoutList.breadthfirst)
  const selectedNodes = useRef(new Set());
  const deselectedNodes = useRef(new Set());
  const highlightClass = 'highlight';
  const hideClass = 'hide';

  // initialize 3rd party layouts
  cytoscape.use(klay);
  cytoscape.use(avsdf);
  cytoscape.use(dagre);

  const highlightElement = (element) => {
    element.addClass(highlightClass);
    element.removeClass(hideClass);
  }
  const hideElement = (element) => {
    element.removeClass(highlightClass);
    element.addClass(hideClass);
  }

  const handleApplyHighlight = useCallback((el) => {
    let showEdge = true;
    // if it's an edge
    if(el.isEdge()) {
      // loop through its targets
      el.targets().forEach((n)=>{
        // if that target is not among the deselected nodes,highlight it
        if(!deselectedNodes.current.has(n.id())) 
          highlightElement(n);
          // if it is among the deselected nodes, don't highlight it and hide the edge it's associated with
        else 
          showEdge = false;

      })
      // do the same for the edge's sources
      el.sources().forEach((n)=>{
        if(!deselectedNodes.current.has(n.id()))
          highlightElement(n);
        else 
          showEdge = false;
      })
      if(showEdge)
        highlightElement(el);
    }
  }, [])

  const addClassToConnections = useCallback((eventType, cy) => {
    cy.unbind(eventType);
    cy.bind(eventType, 'node', (ev) => {
      const target = ev.target;
      let hideTarget = false;

      // If we're clicking on a previously deselected node, remove it from the list 
      if(deselectedNodes.current.has(target.id()))
        deselectedNodes.current.delete(target.id());

      /* 
        if the node was highlighted previously, but it isn't the selected node, then the user 
        has selected an intermediate node in a path that's already highlighted. So we should
        hide such a node
      */
      if(!selectedNodes.current.has(target.id()) && target.hasClass(highlightClass)) {
        hideTarget = true;
        deselectedNodes.current.add(target.id());
      }

      // initialize graph by hiding all elements
      hideElement(ev.cy.elements());

      // If we're clicking a node we've already selected, remove it 
      if(selectedNodes.current.size && selectedNodes.current.has(target.id()) ) {
        selectedNodes.current.delete(target.id())
      } else if(!hideTarget) {
        // otherwise if it's not one we want to hide, add it 
        selectedNodes.current.add(target.id())
      } 
        
      // for each selected node
      selectedNodes.current.forEach((nodeId)=> {
        let node = ev.cy.getElementById(nodeId);
        // for each of the selected node's successors
        node.successors().forEach((e)=> {
          handleApplyHighlight(e);
        })
        node.predecessors().forEach((e)=> {
          handleApplyHighlight(e);
        })
      })

      if(hideTarget) {
        hideElement(target);
        if(target.predecessors().size() <= 1) {
          hideElement(target.predecessors());
        } else {
          hideElement(target.connectedEdges());
        }
        if(target.successors().size() <= 1) {
          hideElement(target.successors());
        } else {
          hideElement(target.connectedEdges());
        }
      }

    });
  },[handleApplyHighlight]);

  const initCytoscapeInstance = useCallback((result, summary, graphRef, layout, cy) => {

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


    addClassToConnections('tapstart', cy);
    // addClassToConnections('hover-highlight', 'hide', 'mouseover', summary, cy);

    // when background is clicked, remove highlight and hide classes from all elements
    cy.bind('click', (ev) => {
      if(ev.target === cy) {
        ev.cy.elements().removeClass(['highlight', 'hide']);
        selectedNodes.current.clear();
        deselectedNodes.current.clear();
      }
    });    
  
  },[selectedNodes, addClassToConnections]);
  
  useEffect(() => {
    if(graphRef.current) {
      initCytoscapeInstance(result.rawResult, rawResults.data, graphRef, currentLayout, cy);
    }
  }, [result, rawResults, currentLayout, initCytoscapeInstance, cy]);

  return (
    <div className={styles.GraphView}>
      <div className={styles.sidebar}>
        <h4 className={styles.layoutHeader}>Layout Type:</h4>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'breadthfirst')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.breadthfirst)}>Breadthfirst</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'dagre')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.dagre)}>dagre</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'klay')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.klay)}>Klay</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'random')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.random)}>Random</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'avsdf')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.avsdf)}>avsdf</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'circle')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.circle)}>Circle</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'concentric')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.concentric)}>Concentric</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'cose')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.cose)}>Cose</button>
      </div>
      <div className={styles.graphContainer} >
        <div id={`cy-${uuidv4()}`}ref={graphRef} className={`${styles.cytoscapeContainer} cytoscape-container`}></div>
      </div>
    </div>
  );
}

export default memo(GraphView);